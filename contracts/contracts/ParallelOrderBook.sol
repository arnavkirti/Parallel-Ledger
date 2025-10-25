// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@arcologynetwork/concurrentlib/lib/U256Cumulative.sol";
import "@arcologynetwork/concurrentlib/lib/Bool.sol";

contract ParallelOrderBook {
    using U256Cumulative for U256Cumulative.Counter;
    using Bool for Bool.Container;

    // Concurrent order tracking
    U256Cumulative.Counter private _orderCount;
    mapping(uint256 => Bool.Container) private _orderExists;

    // Order data storage
    mapping(uint256 => address) public orderTrader;
    mapping(uint256 => uint256) public orderBaseAmount;
    mapping(uint256 => uint256) public orderQuoteAmount;
    mapping(uint256 => bool) public orderIsBuy;

    event OrderPlaced(address indexed trader, uint256 orderId, uint256 baseAmount, uint256 quoteAmount, bool isBuyOrder);

    function placeOrder(uint256 baseAmount, uint256 quoteAmount, bool isBuyOrder) external {
        uint256 orderId = _orderCount.current();
        _orderCount.increment();
        _orderExists[orderId].set(true);

        orderTrader[orderId] = msg.sender;
        orderBaseAmount[orderId] = baseAmount;
        orderQuoteAmount[orderId] = quoteAmount;
        orderIsBuy[orderId] = isBuyOrder;

        emit OrderPlaced(msg.sender, orderId, baseAmount, quoteAmount, isBuyOrder);
    }

    function getOrderCount() external view returns (uint256) {
        return _orderCount.current();
    }

    function orderExists(uint256 orderId) external view returns (bool) {
        return _orderExists[orderId].get();
    }
}