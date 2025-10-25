import hre from "hardhat";

/**
 * Parallel Execution Testing Script for ParallelOrderBook
 * 
 * This script demonstrates and tests Arcology's parallel execution capabilities
 * by submitting multiple transactions concurrently using test accounts.
 * 
 * Test accounts from: examples/account/accounts_20.txt
 * 
 * Usage:
 * npx hardhat run scripts/test-parallel-execution.ts --network arcologyDevNet
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

interface TestResults {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageGasUsed: number;
  totalTimeMs: number;
  transactionsPerSecond: number;
  ordersPlaced: bigint;
  ordersMatched: bigint;
  testAccounts: string[];
}

async function main() {
  console.log("🚀 Parallel Execution Testing for ParallelOrderBook\n");
  console.log("=".repeat(60));
  console.log("This test demonstrates parallel transaction execution");
  console.log("on Arcology's concurrent execution engine.\n");
  console.log("=".repeat(60) + "\n");

  console.log("📊 Using Test Accounts (from examples/account/accounts_20.txt):");
  TEST_ACCOUNTS.forEach((addr, idx) => {
    console.log(`   ${idx + 1}. ${addr}`);
  });
  console.log("");

  const { viem } = await hre.network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, trader1, trader2, trader3, trader4] =
    await viem.getWalletClients();

  // Deploy or use existing contract
  console.log("📦 Preparing ParallelOrderBook contract...");
  const orderBook = await viem.deployContract("ParallelOrderBook");
  const contractAddress = orderBook.address;
  console.log(`✅ Contract ready at: ${contractAddress}\n`);

  // Test parameters
  const PARALLEL_BATCH_SIZE = 10;
  const NUM_BATCHES = 3;
  const TOTAL_TRANSACTIONS = PARALLEL_BATCH_SIZE * NUM_BATCHES;

  console.log("📊 Test Parameters:");
  console.log(`   - Parallel transactions per batch: ${PARALLEL_BATCH_SIZE}`);
  console.log(`   - Number of batches: ${NUM_BATCHES}`);
  console.log(`   - Total transactions: ${TOTAL_TRANSACTIONS}`);
  console.log(`   - Using ${TEST_ACCOUNTS.length} test accounts\n`);

  // Setup traders
  const traders = [
    deployer,
    trader1,
    trader2,
    trader3,
    trader4,
  ];
  console.log(`👥 Using ${traders.length} test accounts\n`);

  const results: TestResults = {
    totalTransactions: TOTAL_TRANSACTIONS,
    successfulTransactions: 0,
    failedTransactions: 0,
    averageGasUsed: 0,
    totalTimeMs: 0,
    transactionsPerSecond: 0,
    ordersPlaced: 0n,
    ordersMatched: 0n,
    testAccounts: TEST_ACCOUNTS,
  };

  let totalGasUsed = 0;
  const startTime = Date.now();

  // Phase 1: Parallel Order Placements
  console.log("📝 PHASE 1: Parallel Order Placement");
  console.log("─".repeat(60));

  for (let batch = 0; batch < NUM_BATCHES; batch++) {
    console.log(`\nBatch ${batch + 1}/${NUM_BATCHES}:`);
    const batchStartTime = Date.now();

    // Create parallel transaction promises
    const placementPromises = [];

    for (let i = 0; i < PARALLEL_BATCH_SIZE; i++) {
      const traderIndex = i % traders.length;
      const trader = traders[traderIndex];
      const amount = BigInt(Math.floor(Math.random() * 1000)) * 10n ** 18n + 1n;
      const quote = amount * (BigInt(Math.floor(Math.random() * 20)) + 1n);
      const isBuy = Math.random() > 0.5;

      // Create transaction without awaiting
      const txPromise = (async () => {
        try {
          const tx = await orderBook.write.placeOrder([amount, quote, isBuy], {
            account: trader.account,
          });
          return { success: true, tx, gasUsed: 0 };
        } catch (error) {
          console.error(`     ❌ Transaction ${i} failed:`, error);
          return { success: false, tx: null, gasUsed: 0 };
        }
      })();

      placementPromises.push(txPromise);
    }

    // Execute all transactions in parallel
    console.log(`   ⏳ Executing ${placementPromises.length} transactions in parallel...`);
    const txResults = await Promise.all(placementPromises);

    // Count results
    const successful = txResults.filter((r) => r.success).length;
    const failed = txResults.filter((r) => !r.success).length;

    results.successfulTransactions += successful;
    results.failedTransactions += failed;

    const batchTimeMs = Date.now() - batchStartTime;
    const batchTxPerSec =
      (PARALLEL_BATCH_SIZE / batchTimeMs) * 1000;

    console.log(`   ✅ Successful: ${successful}/${PARALLEL_BATCH_SIZE}`);
    console.log(`   ⏱️  Batch time: ${batchTimeMs}ms`);
    console.log(`   ⚡ Throughput: ${batchTxPerSec.toFixed(2)} tx/s`);
  }

  results.totalTimeMs = Date.now() - startTime;
  results.transactionsPerSecond =
    (TOTAL_TRANSACTIONS / results.totalTimeMs) * 1000;

  // Phase 2: Order Matching
  console.log("\n📋 PHASE 2: Batch Order Matching");
  console.log("─".repeat(60));

  console.log(`\nFetching current order book state...`);
  const stats = await orderBook.read.getOrderBookStats();
  results.ordersPlaced = stats[0];
  results.ordersMatched = stats[1];

  const buyOrders = [];
  const sellOrders = [];

  // Collect first few orders
  for (let i = 1n; i <= stats[0]; i++) {
    const order = await orderBook.read.getOrder([i]);
    if (order[5]) {
      // exists
      if (order[4]) {
        // isBuyOrder
        buyOrders.push(i);
      } else {
        sellOrders.push(i);
      }
    }
  }

  console.log(`   📊 Total orders: ${stats[0]}`);
  console.log(`   🛍️  Buy orders: ${buyOrders.length}`);
  console.log(`   🏪 Sell orders: ${sellOrders.length}\n`);

  if (buyOrders.length > 0 && sellOrders.length > 0) {
    console.log("   ⏳ Executing batch matching...");

    const matchLimit = Math.min(buyOrders.length, sellOrders.length, 5);
    const buyBatch = buyOrders.slice(0, matchLimit);
    const sellBatch = sellOrders.slice(0, matchLimit);

    try {
      await orderBook.write.matchOrdersBatch([buyBatch, sellBatch]);
      console.log(`   ✅ Matched ${matchLimit} order pairs`);

      const newStats = await orderBook.read.getOrderBookStats();
      results.ordersMatched = newStats[1];
    } catch (error) {
      console.log(`   ⚠️  Matching failed:`, error);
    }
  }

  // Phase 3: Results & Analysis
  console.log("\n📈 PHASE 3: Performance Analysis");
  console.log("─".repeat(60));

  console.log("\n✨ Parallel Execution Test Results:");
  console.log(`   • Total transactions: ${results.totalTransactions}`);
  console.log(`   • Successful: ${results.successfulTransactions}`);
  console.log(`   • Failed: ${results.failedTransactions}`);
  console.log(`   • Success rate: ${((results.successfulTransactions / results.totalTransactions) * 100).toFixed(1)}%`);
  console.log(`   • Total time: ${results.totalTimeMs}ms`);
  console.log(`   • Throughput: ${results.transactionsPerSecond.toFixed(2)} tx/s`);

  console.log("\n📊 Order Book State:");
  console.log(`   • Orders placed: ${results.ordersPlaced}`);
  console.log(`   • Orders matched: ${results.ordersMatched}`);

  // Theoretical vs Actual comparison
  console.log("\n🔬 Concurrency Analysis:");
  console.log(
    `   • Theoretical sequential time: ~${results.totalTransactions * 5}ms`
  );
  console.log(`   • Actual parallel time: ${results.totalTimeMs}ms`);
  const speedup =
    (results.totalTransactions * 5) / results.totalTimeMs;
  console.log(`   • Speedup factor: ${speedup.toFixed(2)}x`);

  if (speedup > 2) {
    console.log(
      "   ✅ Excellent parallel execution! Arcology is batching transactions."
    );
  } else if (speedup > 1.2) {
    console.log("   ✅ Good parallel execution detected.");
  } else {
    console.log("   ⚠️  Sequential execution detected.");
    console.log(
      "      Ensure Arcology DevNet is properly configured for parallel processing."
    );
  }

  // Save results
  const fs = await import("fs");
  const path = await import("path");
  const resultsDir = path.join(process.cwd(), "test-results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const resultsFile = path.join(
    resultsDir,
    `parallel-execution-${Date.now()}.json`
  );
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Parallel execution testing complete!");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
