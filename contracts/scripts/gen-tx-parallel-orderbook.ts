import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Generating ParallelOrderBook Benchmark Transactions");

  // Generate 100 mock transactions
  const transactions = [];
  for (let i = 0; i < 100; i++) {
    transactions.push({
      from: `0x${i.toString().padStart(40, '0')}`,
      to: "0x1234567890123456789012345678901234567890",
      data: `0xbd2d447d${i.toString().padStart(64, '0')}`,
      value: "0"
    });
  }

  // Save to file
  const outputDir = "benchmark/order-placement";
  await fs.promises.mkdir(outputDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(outputDir, "transactions.json"),
    JSON.stringify(transactions, null, 2)
  );

  console.log("✅ Generated 100 benchmark transactions");
}

main().catch(console.error);