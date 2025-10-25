import { ethers } from "hardhat";

async function main() {
  const ParallelOrderBook = await ethers.getContractFactory("ParallelOrderBook");
  const orderBook = await ParallelOrderBook.deploy();

  await orderBook.deployed();

  console.log("ParallelOrderBook deployed to:", orderBook.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });