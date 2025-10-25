import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Generating ParallelOrderBook Benchmark Transactions");

  // Generate transactions with proper ethers v6 syntax
  const transactions = [];
  for (let i = 0; i < 100; i++) {
    const wallet = ethers.Wallet.createRandom();
    transactions.push({
      from: wallet.address,
      to: "0x1234567890123456789012345678901234567890",
      data: `0xbd2d447d${i.toString().padStart(64, '0')}`,
      value: "0",
      privateKey: wallet.privateKey
    });
  }

  // Save to file
  const outputDir = "benchmark/order-placement";
  await fs.promises.mkdir(outputDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(outputDir, "transactions.json"),
    JSON.stringify(transactions, null, 2)
  );

  console.log("✅ Generated 100 benchmark transactions with ethers v6 compatibility");
}

main().catch(console.error);