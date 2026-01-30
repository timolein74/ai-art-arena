// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../PrizePool.sol";

contract DeployScript is Script {
    // USDC on Base Sepolia
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PrizePool
        PrizePool prizePool = new PrizePool(
            USDC_BASE_SEPOLIA,
            platformWallet
        );

        console.log("PrizePool deployed to:", address(prizePool));
        console.log("USDC address:", USDC_BASE_SEPOLIA);
        console.log("Platform wallet:", platformWallet);

        // Start first game (24 hours)
        prizePool.startGame(24 hours);
        console.log("First game started!");

        vm.stopBroadcast();
    }
}
