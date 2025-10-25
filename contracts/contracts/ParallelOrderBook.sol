// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ParallelOrderBook {
    // Basic order book structure
    struct Order {
        address trader;
        uint256 baseAmount;
        uint256 quoteAmount;
        bool isBuyOrder;
        uint256 timestamp;
    }

    Order[] public orders;

    event OrderPlaced(address indexed trader, uint256 baseAmount, uint256 quoteAmount, bool isBuyOrder);

    function placeOrder(uint256 baseAmount, uint256 quoteAmount, bool isBuyOrder) external {
        orders.push(Order({
            trader: msg.sender,
            baseAmount: baseAmount,
            quoteAmount: quoteAmount,
            isBuyOrder: isBuyOrder,
            timestamp: block.timestamp
        }));

        emit OrderPlaced(msg.sender, baseAmount, quoteAmount, isBuyOrder);
    }

    function getOrderCount() external view returns (uint256) {
        return orders.length;
    }
}