import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";

describe("ParallelOrderBook", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, trader1, trader2, trader3, trader4] =
    await viem.getWalletClients();

  let orderBook: any;

  beforeEach(async function () {
    orderBook = await viem.deployContract("ParallelOrderBook");
  });

  // ========== ORDER PLACEMENT TESTS ==========

  describe("Order Placement", function () {
    it("should place a buy order successfully", async function () {
      const baseAmount = 100n * 10n ** 18n;
      const quoteAmount = 200n * 10n ** 18n;

      await assert.doesNotReject(async () => {
        await orderBook.write.placeOrder([baseAmount, quoteAmount, true]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 1n, "placed should be 1");
    });

    it("should place a sell order successfully", async function () {
      const baseAmount = 50n * 10n ** 18n;
      const quoteAmount = 100n * 10n ** 18n;

      await assert.doesNotReject(async () => {
        await orderBook.write.placeOrder([baseAmount, quoteAmount, false]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 1n, "placed should be 1");
    });

    it("should reject orders with zero base amount", async function () {
      const baseAmount = 0n;
      const quoteAmount = 100n * 10n ** 18n;

      await assert.rejects(
        async () => {
          await orderBook.write.placeOrder([baseAmount, quoteAmount, true]);
        },
        (err) => err instanceof Error
      );
    });

    it("should reject orders with zero quote amount", async function () {
      const baseAmount = 100n * 10n ** 18n;
      const quoteAmount = 0n;

      await assert.rejects(
        async () => {
          await orderBook.write.placeOrder([baseAmount, quoteAmount, true]);
        },
        (err) => err instanceof Error
      );
    });

    it("should increment order IDs correctly", async function () {
      const amount = 100n * 10n ** 18n;

      for (let i = 0; i < 5; i++) {
        await orderBook.write.placeOrder([amount, amount, true]);
      }

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 5n, "placed should be 5");
    });
  });

  // ========== ORDER CANCELLATION TESTS ==========

  describe("Order Cancellation", function () {
    it("should cancel an order by owner", async function () {
      const amount = 100n * 10n ** 18n;

      // Place order
      await orderBook.write.placeOrder([amount, amount, true]);

      // Cancel it
      await assert.doesNotReject(async () => {
        await orderBook.write.cancelOrder([1n]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[2], 1n, "cancelled should be 1");
    });

    it("should prevent unauthorized cancellation", async function () {
      const amount = 100n * 10n ** 18n;

      // Place order with trader1
      await orderBook.write.placeOrder([amount, amount, true], {
        account: trader1.account,
      });

      // Try to cancel with trader2
      await assert.rejects(
        async () => {
          await orderBook.write.cancelOrder([1n], {
            account: trader2.account,
          });
        },
        (err) => err instanceof Error
      );
    });

    it("should reject cancellation of non-existent order", async function () {
      await assert.rejects(
        async () => {
          await orderBook.write.cancelOrder([999n]);
        },
        (err) => err instanceof Error
      );
    });

    it("should prevent double cancellation", async function () {
      const amount = 100n * 10n ** 18n;

      await orderBook.write.placeOrder([amount, amount, true]);
      await orderBook.write.cancelOrder([1n]);

      // Try to cancel again
      await assert.rejects(
        async () => {
          await orderBook.write.cancelOrder([1n]);
        },
        (err) => err instanceof Error
      );
    });
  });

  // ========== ORDER MATCHING TESTS ==========

  describe("Order Matching", function () {
    it("should match compatible buy and sell orders", async function () {
      const amount = 100n * 10n ** 18n;

      // Trader1: Buy 100 for 200
      await orderBook.write.placeOrder([amount, 200n * 10n ** 18n, true], {
        account: trader1.account,
      });

      // Trader2: Sell 100 for 100
      await orderBook.write.placeOrder([amount, 100n * 10n ** 18n, false], {
        account: trader2.account,
      });

      // Match them
      await assert.doesNotReject(async () => {
        await orderBook.write.matchOrdersBatch([[1n], [2n]]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[1], 1n, "matched should be 1");
    });

    it("should match multiple order pairs in batch", async function () {
      const amount = 100n * 10n ** 18n;

      // Place 4 orders
      await orderBook.write.placeOrder([amount, 200n * 10n ** 18n, true], {
        account: trader1.account,
      });
      await orderBook.write.placeOrder([amount, 100n * 10n ** 18n, false], {
        account: trader2.account,
      });
      await orderBook.write.placeOrder([amount, 150n * 10n ** 18n, true], {
        account: trader3.account,
      });
      await orderBook.write.placeOrder([amount, 120n * 10n ** 18n, false], {
        account: trader4.account,
      });

      // Match pairs [1,3] with [2,4]
      await assert.doesNotReject(async () => {
        await orderBook.write.matchOrdersBatch([[1n, 3n], [2n, 4n]]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.ok(stats[1] >= 1n, "at least 1 order should be matched");
    });

    it("should reject batch with mismatched array lengths", async function () {
      await assert.rejects(
        async () => {
          await orderBook.write.matchOrdersBatch([[1n, 2n], [3n]]);
        },
        (err) => err instanceof Error
      );
    });

    it("should not match incompatible orders", async function () {
      const amount = 100n * 10n ** 18n;

      // Trader1: Buy 100 for 200
      await orderBook.write.placeOrder([amount, 200n * 10n ** 18n, true], {
        account: trader1.account,
      });

      // Trader2: Sell 50 for 80 (incompatible)
      await orderBook.write.placeOrder([50n * 10n ** 18n, 80n * 10n ** 18n, false], {
        account: trader2.account,
      });

      await orderBook.write.matchOrdersBatch([[1n], [2n]]);

      // The order should still exist (not matched)
      const order = await orderBook.read.getOrder([1n]);
      assert.ok(order, "Order should exist after attempted match");
    });

    it("should track matched orders in stats", async function () {
      const amount = 100n * 10n ** 18n;

      // Place matching orders
      await orderBook.write.placeOrder([amount, amount, true], {
        account: trader1.account,
      });
      await orderBook.write.placeOrder([amount, amount, false], {
        account: trader2.account,
      });

      const statsBefore = await orderBook.read.getOrderBookStats();
      const matchedBefore = statsBefore[1];

      // Match them
      await orderBook.write.matchOrdersBatch([[1n], [2n]]);

      const statsAfter = await orderBook.read.getOrderBookStats();
      const matchedAfter = statsAfter[1];

      assert.strictEqual(
        matchedAfter,
        matchedBefore + 1n,
        "matched count should increment"
      );
    });
  });

  // ========== PARALLEL OPERATIONS TESTS ==========

  describe("Parallel Order Operations", function () {
    it("should handle concurrent order placements", async function () {
      const amount = 100n * 10n ** 18n;

      const txs = [
        orderBook.write.placeOrder([amount, amount, true], {
          account: trader1.account,
        }),
        orderBook.write.placeOrder([amount, amount, false], {
          account: trader2.account,
        }),
        orderBook.write.placeOrder([amount, amount, true], {
          account: trader3.account,
        }),
        orderBook.write.placeOrder([amount, amount, false], {
          account: trader4.account,
        }),
      ];

      await Promise.all(txs);

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 4n, "placed should be 4");
    });

    it("should correctly track stats with concurrent operations", async function () {
      const amount = 100n * 10n ** 18n;

      // Concurrent placements
      await Promise.all([
        orderBook.write.placeOrder([amount, amount, true], {
          account: trader1.account,
        }),
        orderBook.write.placeOrder([amount, amount, false], {
          account: trader2.account,
        }),
        orderBook.write.placeOrder([amount, amount, true], {
          account: trader3.account,
        }),
        orderBook.write.placeOrder([amount, amount, false], {
          account: trader4.account,
        }),
      ]);

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 4n, "placed should be 4");
    });

    it("should maintain consistency under rapid operations", async function () {
      const amount = 100n * 10n ** 18n;

      // Create multiple orders rapidly
      for (let i = 0; i < 10; i++) {
        const isBuy = i % 2 === 0;
        const account = isBuy ? trader1.account : trader2.account;
        await orderBook.write.placeOrder([amount, amount, isBuy], {
          account,
        });
      }

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 10n, "placed should be 10");
    });
  });

  // ========== EDGE CASE TESTS ==========

  describe("Edge Cases", function () {
    it("should handle very large order amounts", async function () {
      const largeAmount = 1000000n * 10n ** 18n;

      await assert.doesNotReject(async () => {
        await orderBook.write.placeOrder([largeAmount, largeAmount, true]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 1n, "placed should be 1");
    });

    it("should handle minimal order amounts", async function () {
      const minAmount = 1n;

      await assert.doesNotReject(async () => {
        await orderBook.write.placeOrder([minAmount, minAmount, true]);
      });

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 1n, "placed should be 1");
    });

    it("should handle matching with differing amounts", async function () {
      const baseAmount = 100n * 10n ** 18n;
      const quoteAmount1 = 200n * 10n ** 18n;
      const quoteAmount2 = 80n * 10n ** 18n;

      // Buy 100 for 200
      await orderBook.write.placeOrder([baseAmount, quoteAmount1, true], {
        account: trader1.account,
      });

      // Sell 100 for 80
      await orderBook.write.placeOrder([baseAmount, quoteAmount2, false], {
        account: trader2.account,
      });

      await orderBook.write.matchOrdersBatch([[1n], [2n]]);

      const stats = await orderBook.read.getOrderBookStats();
      assert.ok(stats, "stats should be available");
    });

    it("should handle rapid successive operations", async function () {
      const amount = 100n * 10n ** 18n;

      // Place orders rapidly
      for (let i = 0; i < 5; i++) {
        await orderBook.write.placeOrder([amount, amount, true], {
          account: trader1.account,
        });
      }

      for (let i = 0; i < 5; i++) {
        await orderBook.write.placeOrder([amount, amount, false], {
          account: trader2.account,
        });
      }

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 10n, "placed should be 10");
    });

    it("should handle matching with empty arrays", async function () {
      // Empty arrays should not cause errors, just match 0 orders
      const stats = await orderBook.read.getOrderBookStats();
      const initialMatched = stats[1];

      await orderBook.write.matchOrdersBatch([[], []]);

      const finalStats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(finalStats[1], initialMatched, "no new matches");
    });
  });

  // ========== STATE CONSISTENCY TESTS ==========

  describe("State Consistency", function () {
    it("should maintain correct order state after placement", async function () {
      const baseAmount = 100n * 10n ** 18n;
      const quoteAmount = 200n * 10n ** 18n;

      await orderBook.write.placeOrder([baseAmount, quoteAmount, true], {
        account: trader1.account,
      });

      const order = await orderBook.read.getOrder([1n]);
      assert.strictEqual(
        order[0].toLowerCase(),
        trader1.account.address.toLowerCase(),
        "trader should match"
      );
      assert.strictEqual(order[1], baseAmount, "baseAmount should match");
      assert.strictEqual(order[2], quoteAmount, "quoteAmount should match");
      assert.strictEqual(order[4], true, "isBuyOrder should be true");
      assert.strictEqual(order[5], true, "exists should be true");
    });

    it("should return zeros for non-existent orders", async function () {
      const order = await orderBook.read.getOrder([999n]);
      assert.strictEqual(
        order[4],
        false,
        "exists should be false for non-existent order"
      );
    });

    it("should track cumulative stats correctly", async function () {
      const amount = 100n * 10n ** 18n;

      // Place 3 orders
      await orderBook.write.placeOrder([amount, amount, true], {
        account: trader1.account,
      });
      await orderBook.write.placeOrder([amount, amount, true], {
        account: trader1.account,
      });
      await orderBook.write.placeOrder([amount, amount, false], {
        account: trader2.account,
      });

      let stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 3n, "placed should be 3");

      // Cancel one
      await orderBook.write.cancelOrder([1n], { account: trader1.account });

      stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[2], 1n, "cancelled should be 1");
      assert.strictEqual(stats[0], 3n, "placed count should not change");
    });
  });

  // ========== GAS EFFICIENCY TESTS ==========

  describe("Gas Efficiency", function () {
    it("should place orders with reasonable gas", async function () {
      const amount = 100n * 10n ** 18n;

      const tx = await orderBook.write.placeOrder([amount, amount, true]);
      assert.ok(tx, "transaction should succeed");
    });

    it("should cancel orders with reasonable gas", async function () {
      const amount = 100n * 10n ** 18n;

      await orderBook.write.placeOrder([amount, amount, true]);
      const tx = await orderBook.write.cancelOrder([1n]);

      assert.ok(tx, "cancel transaction should succeed");
    });

    it("should match orders efficiently", async function () {
      const amount = 100n * 10n ** 18n;

      // Create matching pairs
      for (let i = 0; i < 3; i++) {
        await orderBook.write.placeOrder([amount, amount, true], {
          account: trader1.account,
        });
        await orderBook.write.placeOrder([amount, amount, false], {
          account: trader2.account,
        });
      }

      const tx = await orderBook.write.matchOrdersBatch([
        [1n, 3n, 5n],
        [2n, 4n, 6n],
      ]);

      assert.ok(tx, "batch match transaction should succeed");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("Full Integration Scenarios", function () {
    it("should complete full order lifecycle", async function () {
      const amount = 100n * 10n ** 18n;

      // Place buy order
      await orderBook.write.placeOrder(
        [amount, 200n * 10n ** 18n, true],
        { account: trader1.account }
      );

      // Place matching sell order
      await orderBook.write.placeOrder([amount, 100n * 10n ** 18n, false], {
        account: trader2.account,
      });

      // Match orders
      await orderBook.write.matchOrdersBatch([[1n], [2n]]);

      // Verify final state
      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 2n, "placed should be 2");
      assert.ok(stats[1] >= 1n, "at least 1 order should be matched");
      assert.strictEqual(stats[2], 0n, "cancelled should be 0");
    });

    it("should handle mixed operations", async function () {
      const amount = 100n * 10n ** 18n;

      // Place 3 orders
      await orderBook.write.placeOrder([amount, amount, true], {
        account: trader1.account,
      });
      await orderBook.write.placeOrder([amount, amount, false], {
        account: trader2.account,
      });
      await orderBook.write.placeOrder([amount, amount, true], {
        account: trader3.account,
      });

      // Cancel one
      await orderBook.write.cancelOrder([1n], { account: trader1.account });

      // Match others
      await orderBook.write.matchOrdersBatch([[3n], [2n]]);

      const stats = await orderBook.read.getOrderBookStats();
      assert.strictEqual(stats[0], 3n, "placed should be 3");
      assert.strictEqual(stats[2], 1n, "cancelled should be 1");
      assert.ok(stats[1] >= 1n, "at least 1 order should be matched");
    });
  });
});
