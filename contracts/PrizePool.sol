// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AI Art Arena Prize Pool
 * @notice Handles entry fees, prize pool escrow, and winner payouts
 * @dev Uses USDC for all transactions, 10% platform fee
 */
contract PrizePool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    IERC20 public immutable usdc;
    
    uint256 public constant ENTRY_FEE = 50000; // $0.05 in USDC (6 decimals)
    uint256 public constant PLATFORM_FEE_BPS = 1000; // 10% = 1000 basis points
    uint256 public constant BPS_DENOMINATOR = 10000;

    address public platformWallet;
    uint256 public currentGameId;
    
    struct Game {
        uint256 prizePool;
        uint256 entryCount;
        uint256 startTime;
        uint256 endTime;
        address winner;
        bool finalized;
    }

    struct Entry {
        address player;
        string imageUri;
        uint256 timestamp;
        uint256 score;
    }

    // gameId => Game
    mapping(uint256 => Game) public games;
    
    // gameId => entries
    mapping(uint256 => Entry[]) public gameEntries;
    
    // gameId => player => hasEntered
    mapping(uint256 => mapping(address => bool)) public hasEntered;

    // ============ Events ============

    event GameStarted(uint256 indexed gameId, uint256 startTime, uint256 endTime);
    event EntrySubmitted(uint256 indexed gameId, address indexed player, string imageUri);
    event GameFinalized(uint256 indexed gameId, address indexed winner, uint256 prize);
    event PlatformFeeCollected(uint256 indexed gameId, uint256 amount);

    // ============ Errors ============

    error GameNotActive();
    error AlreadyEntered();
    error GameNotEnded();
    error GameAlreadyFinalized();
    error NoEntries();
    error InvalidWinner();

    // ============ Constructor ============

    constructor(address _usdc, address _platformWallet) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }

    // ============ External Functions ============

    /**
     * @notice Start a new daily game
     * @param duration Duration of the game in seconds (default: 24 hours)
     */
    function startGame(uint256 duration) external onlyOwner {
        currentGameId++;
        
        games[currentGameId] = Game({
            prizePool: 0,
            entryCount: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            winner: address(0),
            finalized: false
        });

        emit GameStarted(currentGameId, block.timestamp, block.timestamp + duration);
    }

    /**
     * @notice Submit entry to current game
     * @param imageUri IPFS URI of the submitted artwork
     */
    function submitEntry(string calldata imageUri) external nonReentrant {
        Game storage game = games[currentGameId];
        
        if (block.timestamp < game.startTime || block.timestamp > game.endTime) {
            revert GameNotActive();
        }
        
        if (hasEntered[currentGameId][msg.sender]) {
            revert AlreadyEntered();
        }

        // Transfer entry fee from player
        usdc.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);
        
        // Add to prize pool
        game.prizePool += ENTRY_FEE;
        game.entryCount++;
        
        // Record entry
        hasEntered[currentGameId][msg.sender] = true;
        gameEntries[currentGameId].push(Entry({
            player: msg.sender,
            imageUri: imageUri,
            timestamp: block.timestamp,
            score: 0
        }));

        emit EntrySubmitted(currentGameId, msg.sender, imageUri);
    }

    /**
     * @notice Finalize game and distribute prizes
     * @param gameId The game to finalize
     * @param winnerIndex Index of the winning entry
     */
    function finalizeGame(uint256 gameId, uint256 winnerIndex) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        
        if (block.timestamp < game.endTime) {
            revert GameNotEnded();
        }
        
        if (game.finalized) {
            revert GameAlreadyFinalized();
        }
        
        if (game.entryCount == 0) {
            revert NoEntries();
        }

        Entry[] storage entries = gameEntries[gameId];
        if (winnerIndex >= entries.length) {
            revert InvalidWinner();
        }

        address winner = entries[winnerIndex].player;
        game.winner = winner;
        game.finalized = true;

        // Calculate fees
        uint256 platformFee = (game.prizePool * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPrize = game.prizePool - platformFee;

        // Transfer prizes
        usdc.safeTransfer(winner, winnerPrize);
        usdc.safeTransfer(platformWallet, platformFee);

        emit GameFinalized(gameId, winner, winnerPrize);
        emit PlatformFeeCollected(gameId, platformFee);
    }

    // ============ View Functions ============

    /**
     * @notice Get current game info
     */
    function getCurrentGame() external view returns (Game memory) {
        return games[currentGameId];
    }

    /**
     * @notice Get entries for a game
     */
    function getGameEntries(uint256 gameId) external view returns (Entry[] memory) {
        return gameEntries[gameId];
    }

    /**
     * @notice Check if game is active
     */
    function isGameActive() external view returns (bool) {
        Game storage game = games[currentGameId];
        return block.timestamp >= game.startTime && block.timestamp <= game.endTime;
    }

    /**
     * @notice Get time remaining in current game
     */
    function getTimeRemaining() external view returns (uint256) {
        Game storage game = games[currentGameId];
        if (block.timestamp >= game.endTime) return 0;
        return game.endTime - block.timestamp;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update platform wallet
     */
    function setPlatformWallet(address _platformWallet) external onlyOwner {
        platformWallet = _platformWallet;
    }

    /**
     * @notice Emergency withdraw (only if no active game)
     */
    function emergencyWithdraw() external onlyOwner {
        Game storage game = games[currentGameId];
        require(game.finalized || game.entryCount == 0, "Active game");
        
        uint256 balance = usdc.balanceOf(address(this));
        if (balance > 0) {
            usdc.safeTransfer(owner(), balance);
        }
    }
}
