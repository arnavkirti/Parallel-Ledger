import { expect } from "chai";
import { ethers } from "hardhat";

describe("ParallelOrderBook", function () {
  it("Should place an order correctly", async function () {
    const ParallelOrderBook = await ethers.getContractFactory("ParallelOrderBook");
    const orderBook = await ParallelOrderBook.deploy();

    await orderBook.deployed();

    const tx = await orderBook.placeOrder(1000, 2000, true);
    await tx.wait();

    expect(await orderBook.getOrderCount()).to.equal(1);
  });
});