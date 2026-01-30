# AI Art Arena - Setup Guide

## Sinun tehtäväsi (10 min)

### 1. Base Sepolia ETH (testi-ETH)

**URL:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

1. Kirjaudu Coinbase-tilillä (tai luo uusi)
2. Liitä MetaMask-osoitteesi
3. Klikkaa "Get ETH"
4. Saat ~0.1 ETH testirahaa

### 2. Testnet USDC

**URL:** https://faucet.circle.com/

1. Valitse verkko: **Base Sepolia**
2. Liitä sama osoite
3. Klikkaa "Get USDC"
4. Saat 10 USDC testirahaa

### 3. Cloudinary (kuvan upload)

**URL:** https://cloudinary.com/users/register_free

1. Rekisteröidy (ilmainen, ei luottokorttia)
2. Kun olet dashboardissa:
   - Kopioi **Cloud Name** (esim. "dxyz123abc")
3. Mene: Settings → Upload → Upload Presets
4. Klikkaa "Add upload preset"
   - Name: `ai_art_arena`
   - Signing Mode: **Unsigned**
   - Folder: `ai-art-arena`
5. Save

### 4. Päivitä .env.local

Avaa: `ai-art-arena/frontend/.env.local`

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME_HERE
```

---

## Valmiit kredentiaalit

Kun sinulla on:
- [ ] Base Sepolia ETH (näkyy MetaMaskissa)
- [ ] Testnet USDC (näkyy MetaMaskissa)
- [ ] Cloudinary Cloud Name

**Kerro minulle niin deployataan contract!**

---

## Contract Deployment (teen tämän)

Kun olet valmis, deployaan PrizePool-contractin:

```bash
# Base Sepolia
forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --broadcast
```

Sitten päivitän `NEXT_PUBLIC_PRIZE_POOL_ADDRESS` ja kaikki toimii!

---

## Testaus

1. Avaa http://localhost:3000
2. Yhdistä MetaMask
3. Klikkaa "Submit Your Art"
4. Lataa kuva
5. Maksa $0.05 USDC
6. Näe submissionisi leaderboardilla!
