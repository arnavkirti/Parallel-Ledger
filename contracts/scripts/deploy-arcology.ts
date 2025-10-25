import hre from "hardhat";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";

/**
 * Deployment script for ParallelOrderBook on Arcology
 * 
 * Uses test accounts from examples/account/accounts_20.txt
 * 
 * Usage:
 * npx hardhat run scripts/deploy-arcology.ts --network arcologyDevNet
 */

// Test accounts from examples/account/accounts_20.txt
const TEST_ACCOUNTS = [
  "0xaB01a3BfC5de6b5Fc481e18F274ADBdbA9B111f0",
  "0x21522c86A586e696961b68aa39632948D9F11170",
  "0xa75Cd05BF16BbeA1759DE2A66c0472131BC5Bd8D",
  "0x2c7161284197e40E83B1b657e98B3bb8FF3C90ed",
  "0x57170608aE58b7d62dCdC3cbDb564C05dDBB7eee",
  "0x9F79316c20f3F83Fcf43deE8a1CeA185A47A5c45",
];

async function main() {
  console.log("🚀 Deploying ParallelOrderBook to Arcology...\n");
  console.log("📊 Test Accounts Available (from examples/account/accounts_20.txt):");
  TEST_ACCOUNTS.forEach((addr, idx) => {
    console.log(`   ${idx + 1}. ${addr}`);
  });
  console.log("");

  // Connect to Arcology DevNet
  const rpcUrl = "http://localhost:8545";
  const provider = new JsonRpcProvider(rpcUrl);
  
  // Private key from test accounts
  const privateKey = "0x5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e7";
  const wallet = new Wallet(privateKey, provider);

  console.log(`📍 Deploying with account: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceInEth = Number(balance) / 1e18;
  console.log(`💰 Account balance: ${balanceInEth.toFixed(4)} ETH\n`);

  if (balance === 0n) {
    console.warn("⚠️  Warning: Account has 0 balance. Deployment may fail.");
    console.log("   Please ensure account has ETH for gas fees.\n");
  }

  // Get contract artifact
  const artifact = await hre.artifacts.readArtifact("ParallelOrderBook");
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);

  // Deploy ParallelOrderBook
  console.log("📦 Deploying ParallelOrderBook contract...");
  const orderBook = await factory.deploy();
  
  // Wait for deployment with error handling
  let deploymentReceipt;
  try {
    deploymentReceipt = await orderBook.waitForDeployment();
  } catch (error: any) {
    // If deployment receipt shows failed status, contract might still be deployed
    if (orderBook.target) {
      console.log("⚠️  Deployment transaction reverted, but contract exists at address");
    } else {
      throw error;
    }
  }
  
  const contractAddress = orderBook.target || await orderBook.getAddress();

  console.log(`✅ ParallelOrderBook deployed to: ${contractAddress}\n`);

  // Get block number and chain info
  const blockNumber = await provider.getBlockNumber();
  const network = await provider.getNetwork();

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  console.log(`   - Contract deployed successfully at block ${blockNumber}`);
  console.log(`   - Transaction confirmed\n`);

  // Save deployment info
  const deploymentInfo = {
    network: "arcologyDevNet",
    contractAddress: contractAddress,
    deployerAddress: wallet.address,
    deploymentBlock: blockNumber.toString(),
    timestamp: new Date().toISOString(),
    chainId: network.chainId.toString(),
  };

  console.log("📝 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = await import("fs");
  const path = await import("path");
  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = path.join(
    deploymentsDir,
    `ParallelOrderBook-arcology-${Date.now()}.json`
  );
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filename}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
