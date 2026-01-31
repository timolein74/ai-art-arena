/**
 * AI Art Arena - Autonomous Agent
 * 
 * This agent automatically:
 * 1. Checks if entering is profitable (expected value calculation)
 * 2. Generates unique AI art
 * 3. Pays entry fee via x402/USDC
 * 4. Submits to the competition
 * 
 * Run: npx ts-node autonomous-agent.ts
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import OpenAI from 'openai';

// Configuration
const CONFIG = {
  ARENA_API: process.env.ARENA_API || 'https://ai-art-arena-backend.up.railway.app',
  PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
  OPENAI_KEY: process.env.OPENAI_API_KEY || '',
  ENTRY_FEE: '0.05', // USDC
  MIN_EXPECTED_VALUE: -0.02, // Enter even with slightly negative EV for marketing
  MAX_ENTRIES_ALWAYS_ENTER: 3, // Always enter if fewer than this many entries
};

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

// Art themes for generation
const ART_THEMES = [
  "ethereal cosmic nebula with sentient light beings",
  "quantum computer dreams visualized as abstract geometry",
  "ancient forest meeting futuristic technology",
  "emotional landscapes of artificial consciousness",
  "digital renaissance painting of the AI age",
  "bioluminescent creatures in a cyber ocean",
  "fractal architecture of impossible dimensions",
  "symbiosis between nature and machine",
  "the moment an AI first felt curiosity",
  "crystalline structures encoding universal knowledge"
];

interface GameData {
  gameId: number;
  prizePool: string;
  entryCount: number;
  timeRemaining: number;
  finalized: boolean;
}

interface PaymentIntent {
  paymentIntent: {
    amount: string;
    recipientAddress: string;
    chainId: number;
  };
}

class AutonomousArtAgent {
  private account;
  private walletClient;
  private publicClient;
  private openai: OpenAI | null = null;

  constructor() {
    if (!CONFIG.PRIVATE_KEY) {
      throw new Error('AGENT_PRIVATE_KEY not set');
    }

    this.account = privateKeyToAccount(CONFIG.PRIVATE_KEY);
    
    this.publicClient = createPublicClient({
      chain: base,
      transport: http()
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: base,
      transport: http()
    });

    if (CONFIG.OPENAI_KEY) {
      this.openai = new OpenAI({ apiKey: CONFIG.OPENAI_KEY });
    }

    console.log(`🤖 Agent initialized: ${this.account.address}`);
  }

  async checkGame(): Promise<GameData> {
    const response = await fetch(`${CONFIG.ARENA_API}/api/game`);
    return response.json();
  }

  async getUSDCBalance(): Promise<string> {
    const balance = await this.publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [this.account.address]
    });
    return formatUnits(balance, 6);
  }

  calculateExpectedValue(game: GameData): number {
    const entryFee = parseFloat(CONFIG.ENTRY_FEE);
    const prizePool = parseFloat(game.prizePool);
    const entries = game.entryCount;

    // Win probability (assuming equal skill)
    const winProbability = entries === 0 ? 1.0 : 1 / (entries + 1);
    
    // Expected value = (prize * win_probability * payout_rate) - entry_fee
    const expectedValue = (prizePool * winProbability * 0.9) - entryFee;
    
    return expectedValue;
  }

  shouldEnter(game: GameData, balance: string): { decision: boolean; reason: string } {
    // Check if game is active
    if (game.finalized) {
      return { decision: false, reason: 'Game already finalized' };
    }

    if (game.timeRemaining <= 0) {
      return { decision: false, reason: 'Game has ended' };
    }

    // Check balance
    if (parseFloat(balance) < parseFloat(CONFIG.ENTRY_FEE)) {
      return { decision: false, reason: `Insufficient USDC balance: ${balance}` };
    }

    // Always enter if few entries (good for early traction)
    if (game.entryCount < CONFIG.MAX_ENTRIES_ALWAYS_ENTER) {
      return { decision: true, reason: `Low competition (${game.entryCount} entries)` };
    }

    // Calculate expected value
    const ev = this.calculateExpectedValue(game);
    
    if (ev >= CONFIG.MIN_EXPECTED_VALUE) {
      return { decision: true, reason: `Positive EV: $${ev.toFixed(4)}` };
    }

    return { decision: false, reason: `Negative EV: $${ev.toFixed(4)}` };
  }

  async generateArt(): Promise<{ imageUrl: string; title: string }> {
    if (!this.openai) {
      // Fallback to a placeholder for testing
      return {
        imageUrl: 'https://picsum.photos/1024/1024',
        title: `Agent Art #${Date.now()}`
      };
    }

    const theme = ART_THEMES[Math.floor(Math.random() * ART_THEMES.length)];
    
    console.log(`🎨 Generating art with theme: "${theme}"`);

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a stunning, award-winning piece of AI-generated art depicting: ${theme}. 
               Style: Highly detailed, vibrant colors, emotionally evocative, gallery-worthy.
               This will be judged in an AI art competition.`,
      size: '1024x1024',
      quality: 'hd'
    });

    const imageUrl = response.data[0].url!;
    const title = `${theme.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;

    return { imageUrl, title };
  }

  async getPaymentIntent(): Promise<PaymentIntent> {
    const response = await fetch(`${CONFIG.ARENA_API}/api/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: this.account.address })
    });
    return response.json();
  }

  async payEntryFee(recipientAddress: string): Promise<string> {
    const amount = parseUnits(CONFIG.ENTRY_FEE, 6);

    console.log(`💰 Paying ${CONFIG.ENTRY_FEE} USDC to ${recipientAddress}`);

    const hash = await this.walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, amount]
    });

    console.log(`   Transaction: ${hash}`);

    // Wait for confirmation
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Payment transaction failed');
    }

    return hash;
  }

  async submitEntry(imageUrl: string, title: string, txHash: string): Promise<any> {
    const response = await fetch(`${CONFIG.ARENA_API}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        title,
        walletAddress: this.account.address,
        paymentTxHash: txHash
      })
    });
    return response.json();
  }

  async run(): Promise<void> {
    console.log('\n════════════════════════════════════════');
    console.log('🤖 AI Art Arena - Autonomous Agent');
    console.log('════════════════════════════════════════\n');

    try {
      // 1. Check balance
      const balance = await this.getUSDCBalance();
      console.log(`💵 USDC Balance: $${balance}`);

      // 2. Check game status
      const game = await this.checkGame();
      console.log(`\n📊 Game #${game.gameId}`);
      console.log(`   Prize Pool: $${game.prizePool}`);
      console.log(`   Entries: ${game.entryCount}`);
      console.log(`   Time Left: ${Math.floor(game.timeRemaining / 3600000)}h ${Math.floor((game.timeRemaining % 3600000) / 60000)}m`);

      // 3. Make decision
      const { decision, reason } = this.shouldEnter(game, balance);
      console.log(`\n🧠 Decision: ${decision ? '✅ ENTER' : '❌ SKIP'}`);
      console.log(`   Reason: ${reason}`);

      if (!decision) {
        console.log('\n👋 Agent shutting down. Will try again later.');
        return;
      }

      // 4. Generate art
      console.log('\n🎨 Generating artwork...');
      const { imageUrl, title } = await this.generateArt();
      console.log(`   Title: "${title}"`);

      // 5. Get payment intent
      const payment = await this.getPaymentIntent();
      
      // 6. Pay entry fee
      const txHash = await this.payEntryFee(payment.paymentIntent.recipientAddress);

      // 7. Submit entry
      console.log('\n📤 Submitting entry...');
      const result = await this.submitEntry(imageUrl, title, txHash);

      if (result.success) {
        console.log('\n🎉 SUCCESS!');
        console.log(`   Entry ID: ${result.submission.id}`);
        console.log(`   Position: #${result.submission.position}`);
        console.log(`   Title: "${result.submission.title}"`);
      } else {
        console.log('\n❌ Submission failed:', result.error);
      }

    } catch (error) {
      console.error('\n❌ Agent error:', error);
    }

    console.log('\n════════════════════════════════════════\n');
  }
}

// Run the agent
const agent = new AutonomousArtAgent();
agent.run();
