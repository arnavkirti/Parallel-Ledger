import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

/**
 * Transaction Generation Script for ParallelOrderBook Benchmarking
 *
 * This script generates transaction files for benchmarking the ParallelOrderBook contract
 * on Arcology DevNet. It creates batches of order placement transactions that can be
 * submitted in parallel to test concurrent execution performance.
 *
 * Generated files:
 * - benchmark/order-placement/txs/order-placement-batch-{batchId}.json
 * - benchmark/order-placement/summary.json
 *
 * Usage:
 * npx hardhat run scripts/gen-tx-parallel-orderbook.ts --network arcologyDevNet
 */

interface TransactionData {
  rawTx: string;
  from: string;
  to: string;
  data: string;
  value: string;
  gasLimit: string;
}

interface BatchData {
  batchId: number;
  transactions: TransactionData[];
  totalTransactions: number;
  estimatedGas: string;
}

interface BenchmarkConfig {
  totalTransactions: number;
  batchSize: number;
  baseAmount: number;
  quoteAmount: number;
  mixBuySell: boolean;
  outputDir: string;
}

// Test accounts from examples/account/accounts_20.txt
const TEST_ACCOUNTS = [
  "0xaB01a3BfC5de6b5Fc481e18F274ADBdbA9B111f0",
  "0x21522c86A586e696961b68aa39632948D9F11170",
  "0xa75Cd05BF16BbeA1759DE2A66c0472131BC5Bd8D",
  "0x2c7161284197e40E83B1b657e98B3bb8FF3C90ed",
  "0x57170608aE58b7d62dCdC3cbDb564C05dDBB7eee",
  "0x9F79316c20f3F83Fcf43deE8a1CeA185A47A5c45",
  "0x9f9E0F23aFd5404b34006678c900629183c9A25d",
  "0xd7cB260c7658589fe68789F2d678e1e85F7e4831",
  "0x5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c",
  "0x4797cf2eb40d1bdd98dc26e7b5bb1315c3ffa654c",
  "0x89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd9",
  "0x8dc26e7b5bb1315c3ffa654c89f1f8b27f93cb4ef",
  "0x6b0474c4797cf2eb40d1bdd98dc26e7b5bb1315c",
  "0x3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2e",
  "0xb40d1bdd98dc26e7b5bb1315c3ffa654c89f1f8b",
  "0x27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e",
  "0x7b5bb1315c3ffa654c89f1f8b27f93cb4ef6b047",
  "0x4c4797cf2eb40d1bdd98dc26e7b5bb1315c3ffa6",
  "0x54c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1",
  "0xbdd98dc26e7b5bb1315c3ffa654c89f1f8b27f93"
];

const PRIVATE_KEYS = [
  "0x5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e7",
  "0x2289ae919f03075448d567c9c4a22846ce3711731c895f1bea572cef25bb346f",
  "0x19c439237a1e2c86f87b2d31438e5476738dd67297bf92d752b16bdb4ff37aa2",
  "0x236c7b430c2ea13f19add3920b0bb2795f35a969f8be617faa9629bc5f6201f1",
  "0xc4fbe435d6297959b0e326e560fdfb680a59807d75e1dec04d873fcd5b36597b",
  "0xf91fcd0784d0b2e5f88ec3ba6fe57fa7ef4fbf2fe42a8fa0aaa22625d2147a7a",
  "0x630549dc7564f9789eb4435098ca147424bcde3f1c14149a5ab18e826868f337",
  "0x2a31c00f193d4071adf4e45abaf76d7222d4af87ab30a7a4f7bae51e28aceb0a",
  "0xa2ffe69115c1f2f145297a4607e188775a1e56907ca882b7c6def550f218fa84",
  "0xd9815a0fa4f31172530f17a6ae64bf5f00a3a651f3d6476146d2c62ae5527dc4",
  "0x134aea740081ac7e0e892ff8e5d0a763ec400fcd34bae70bcfe6dae3aceeb7f0",
  "0x2cbecec34decef3150b77dba0a232b033952e1d78b303007bbb2f36c7f1e08be",
  "0xf19c51d0bbcc39831e06b8452cfcc0b2e0c1fd164e6fc2984485a0a141c79ce3",
  "0xc9cb7bbbec162bde1234753dccc4cc207903ba184949b93e53a7d7efa50571a0",
  "0x49163930711a0236e1a8c1777a0eb10951e85b82ad9c9b094b8835bc40b92cd2",
  "0xb4df44450e01290bd3ce86f32d970aa2e2aa17a24e6a847ce8d5310ad54ed71a",
  "0xe6e7fd52f20aae2648046b0eefbd00512553e1d4a2becb53fb6a79f632fe47b2",
  "0xdf288a18540245219892add292722cf7508e59d1398338e6104f7483594c98db",
  "0x7d9bc27ea230c38d0cb3d30a4cdd5b091244a53eddd59b23a61465a1c0d1ea5a",
  "0x696cceab0b831baff50c3b2ea4fbfdd7a107701ad2e9318be084ebdf6796a459"
];

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.access(dirPath);
  } catch {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

async function generateOrderPlacementTransactions(config: BenchmarkConfig): Promise<void> {
  console.log("🚀 Generating ParallelOrderBook Benchmark Transactions\n");
  console.log("=".repeat(70));

  // Ensure output directory exists
  await ensureDirectoryExists(config.outputDir);
  await ensureDirectoryExists(path.join(config.outputDir, "txs"));

  // Use deployed contract address from Arcology DevNet
  const contractAddress = "0x8eC3609497EC136760fbe9067C8aB403A1d110dF";
  console.log("📋 Using deployed contract address from Arcology DevNet");
  console.log(`✅ Contract address: ${contractAddress}`);

  // Create mock contract interface for encoding function data
  const contractInterface = new ethers.Interface([
    "function placeOrder(uint256 baseAmount, uint256 quoteAmount, bool isBuyOrder) external"
  ]);

  const batches: BatchData[] = [];
  let totalEstimatedGas = 0n;

  // Calculate number of batches
  const numBatches = Math.ceil(config.totalTransactions / config.batchSize);

  console.log(`📊 Generating ${config.totalTransactions} transactions in ${numBatches} batches`);
  console.log(`   Batch size: ${config.batchSize}`);
  console.log(`   Base amount: ${config.baseAmount}`);
  console.log(`   Quote amount: ${config.quoteAmount}`);
  console.log(`   Mix buy/sell: ${config.mixBuySell}\n`);

  for (let batchId = 0; batchId < numBatches; batchId++) {
    const batchTransactions: TransactionData[] = [];
    const startIdx = batchId * config.batchSize;
    const endIdx = Math.min(startIdx + config.batchSize, config.totalTransactions);
    let batchGas = 0n;

    console.log(`🔄 Generating batch ${batchId + 1}/${numBatches} (${endIdx - startIdx} transactions)`);

    for (let i = startIdx; i < endIdx; i++) {
      const accountIdx = i % TEST_ACCOUNTS.length;
      const privateKey = PRIVATE_KEYS[accountIdx];
      const signer = new ethers.Wallet(privateKey);

      // Alternate between buy and sell orders if mixBuySell is enabled
      const isBuyOrder = config.mixBuySell ? (i % 2 === 0) : true;

      // Create transaction data
      const txData = contractInterface.encodeFunctionData("placeOrder", [
        config.baseAmount,
        config.quoteAmount,
        isBuyOrder
      ]);

      // Mock gas estimate (typical gas for a contract call)
      const gasEstimate = 100000n; // Mock gas estimate
      batchGas += gasEstimate;

      // Create the transaction (without network calls)
      const tx = {
        to: contractAddress,
        data: txData,
        value: 0,
        gasLimit: gasEstimate,
        nonce: i % 100, // Mock nonce for testing
        chainId: 118 // Arcology DevNet chain ID
      };

      // Sign the transaction
      const signedTx = await signer.signTransaction(tx);

      const transactionData: TransactionData = {
        rawTx: signedTx,
        from: signer.address,
        to: contractAddress,
        data: txData,
        value: "0",
        gasLimit: gasEstimate.toString()
      };

      batchTransactions.push(transactionData);
    }

    const batchData: BatchData = {
      batchId,
      transactions: batchTransactions,
      totalTransactions: batchTransactions.length,
      estimatedGas: batchGas.toString()
    };

    batches.push(batchData);
    totalEstimatedGas += batchGas;

    // Save batch to file
    const batchFilePath = path.join(config.outputDir, "txs", `order-placement-batch-${batchId}.json`);
    await fs.promises.writeFile(
      batchFilePath,
      JSON.stringify(batchData, null, 2)
    );

    console.log(`   ✅ Saved batch ${batchId + 1} to ${batchFilePath}`);
  }

  // Create summary
  const summary = {
    config,
    contractAddress,
    network: "arcologyDevNet", // Updated to reflect Arcology DevNet
    totalBatches: batches.length,
    totalTransactions: config.totalTransactions,
    totalEstimatedGas: totalEstimatedGas.toString(),
    averageGasPerTransaction: (totalEstimatedGas / BigInt(config.totalTransactions)).toString(),
    batches: batches.map(b => ({
      batchId: b.batchId,
      transactionCount: b.totalTransactions,
      estimatedGas: b.estimatedGas
    })),
    generatedAt: new Date().toISOString(),
    description: "Pre-signed transaction data for benchmarking ParallelOrderBook concurrent execution on Arcology DevNet"
  };

  // Save summary
  const summaryPath = path.join(config.outputDir, "summary.json");
  await fs.promises.writeFile(
    summaryPath,
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n🎉 Transaction generation complete!`);
  console.log(`   📁 Output directory: ${config.outputDir}`);
  console.log(`   📄 Summary: ${summaryPath}`);
  console.log(`   📊 Total transactions: ${config.totalTransactions}`);
  console.log(`   ⛽ Total estimated gas: ${totalEstimatedGas.toString()}`);
  console.log(`   📈 Average gas per tx: ${(totalEstimatedGas / BigInt(config.totalTransactions)).toString()}`);

  console.log(`\n🚀 To run the benchmark:`);
  console.log(`   1. Start your Arcology DevNet`);
  console.log(`   2. Use the generated transaction files in ${config.outputDir}/txs/`);
  console.log(`   3. Submit batches concurrently to test parallel execution`);
}

async function main() {
  const config: BenchmarkConfig = {
    totalTransactions: 1000, // Generate 1000 transactions
    batchSize: 50, // 50 transactions per batch (20 batches)
    baseAmount: 1000000, // 1M wei base amount
    quoteAmount: 2000000, // 2M wei quote amount
    mixBuySell: true, // Mix buy and sell orders
    outputDir: "benchmark/order-placement"
  };

  try {
    await generateOrderPlacementTransactions(config);
  } catch (error) {
    console.error("❌ Error generating transactions:", error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { generateOrderPlacementTransactions, BenchmarkConfig };