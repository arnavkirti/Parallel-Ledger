# Parallel-Ledger

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.0.9-yellow.svg)](https://hardhat.org/)
[![Arcology](https://img.shields.io/badge/Arcology-DevNet-orange.svg)](https://arcology.network/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

A high-performance **parallel order book** implementation leveraging **Arcology's concurrent execution** environment. This project demonstrates how to build conflict-free, parallel-safe smart contracts using Arcology's concurrent data structures.

## 🚀 Overview

Parallel-Ledger implements a decentralized exchange order book that can process multiple orders simultaneously without conflicts, thanks to Arcology's parallel execution technology. Traditional blockchain order books suffer from serialization bottlenecks, but this implementation uses concurrent data structures to enable true parallel processing.

### Key Features

- ⚡ **Parallel Order Execution** - Process multiple orders simultaneously
- 🔒 **Conflict-Free Operations** - Uses U256Cumulative counters for thread safety
- 📊 **Real-Time Analytics** - Comprehensive benchmarking and performance monitoring
- 🧪 **Comprehensive Testing** - Automated test suites for parallel execution
- 🔧 **Developer Tools** - Transaction generation and batch processing scripts

## 🏗️ Architecture

### Core Components

```
contracts/
├── ParallelOrderBook.sol          # Main order book contract
├── Counter.sol                    # Reference counter contract
└── Counter.t.sol                  # Counter test suite

scripts/
├── deploy-arcology.ts             # Arcology deployment script
├── gen-tx-parallel-orderbook.ts   # Transaction generation for benchmarking
├── demo-parallel-execution.ts     # Parallel execution demonstration
└── test-parallel-execution.ts     # Parallel execution tests

benchmark/
├── order-placement/               # Generated benchmark transactions
└── README.md                      # Benchmarking documentation

test/
├── ParallelOrderBook.ts           # Contract test suite
└── Counter.ts                     # Counter contract tests
```

### Concurrent Data Structures

The contract leverages Arcology's concurrent library:

- **`U256Cumulative`** - Conflict-free counters for order tracking
- **`Bool Arrays`** - Thread-safe boolean state management
- **Dual Mapping Storage** - Optimized storage layout for parallel access

## 📋 Prerequisites

- **Node.js** >= 18.0.0 (Node.js 23.x not supported by Hardhat)
- **npm** or **yarn**
- **Arcology DevNet** access (for parallel execution testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arnavkirti/Parallel-Ledger.git
   cd Parallel-Ledger
   ```

2. **Install dependencies**
   ```bash
   cd contracts
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   # For Arcology DevNet deployment
   export ARCOLOGY_DEVNET_RPC_URL="http://your-arcology-devnet:8545"
   export ARCOLOGY_PRIVATE_KEY="your-private-key"
   ```

## 🚀 Quick Start

### 1. Compile Contracts

```bash
npx hardhat compile
```

### 2. Run Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/ParallelOrderBook.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### 3. Deploy to Arcology DevNet

```bash
# Deploy ParallelOrderBook contract
npx hardhat run scripts/deploy-arcology.ts --network arcologyDevNet
```

### 4. Generate Benchmark Transactions

```bash
# Generate 1000 pre-signed transactions for benchmarking
npx hardhat run scripts/gen-tx-parallel-orderbook.ts
```

### 5. Test Parallel Execution

```bash
# Run parallel execution demonstration
npx hardhat run scripts/demo-parallel-execution.ts --network arcologyDevNet
```

## 📊 Benchmarking & Performance Testing

The project includes comprehensive benchmarking tools to measure parallel execution performance:

### Transaction Generation

```bash
# Generate transactions with custom configuration
npx hardhat run scripts/gen-tx-parallel-orderbook.ts --network arcologyDevNet
```

**Generated Files:**
- `benchmark/order-placement/summary.json` - Configuration and metadata
- `benchmark/order-placement/txs/order-placement-batch-{0-19}.json` - Transaction batches

### Performance Metrics

The benchmarking suite measures:
- **Transaction Throughput** - Orders processed per second
- **Gas Efficiency** - Gas usage per parallel operation
- **Conflict Resolution** - Success rate of parallel executions
- **Latency** - Time to process transaction batches

### Running Benchmarks

```bash
# Submit generated transactions concurrently
npx hardhat run scripts/test-parallel-execution.ts --network arcologyDevNet
```

## 🔧 Configuration

### Hardhat Networks

The project supports multiple networks configured in `hardhat.config.ts`:

```typescript
networks: {
  arcologyDevNet: {
    url: process.env.ARCOLOGY_DEVNET_RPC_URL || "http://$localip:8545",
    accounts: [process.env.ARCOLOGY_PRIVATE_KEY || defaultTestKey]
  },
  arcologyTestNet: {
    url: process.env.ARCOLOGY_TESTNET_RPC_URL || "https://testnet.arcology.network:8545",
    accounts: [process.env.ARCOLOGY_PRIVATE_KEY || defaultTestKey]
  }
}
```

### Benchmark Configuration

Customize benchmarking parameters in `gen-tx-parallel-orderbook.ts`:

```typescript
const config: BenchmarkConfig = {
  totalTransactions: 1000,    // Total transactions to generate
  batchSize: 50,             // Transactions per batch
  baseAmount: 1000000,       // Base token amount (wei)
  quoteAmount: 2000000,      // Quote token amount (wei)
  mixBuySell: true,          // Mix buy/sell orders
  outputDir: "benchmark/order-placement"
};
```

## 📖 API Reference

### ParallelOrderBook Contract

#### Functions

```solidity
// Place a new order
function placeOrder(
    uint256 baseAmount,
    uint256 quoteAmount,
    bool isBuyOrder
) external returns (uint256 orderId)

// Get order details
function getOrder(uint256 orderId) external view returns (
    address trader,
    uint256 baseAmount,
    uint256 quoteAmount,
    uint256 timestamp,
    bool isBuyOrder
)

// Get trader's order count
function getTraderOrderCount(address trader) external view returns (uint256)

// Get total order count
function getTotalOrderCount() external view returns (uint256)
```

#### Events

```solidity
event OrderPlaced(
    address indexed trader,
    uint256 indexed orderId,
    uint256 baseAmount,
    uint256 quoteAmount,
    bool isBuyOrder
);

event OrderMatched(
    uint256 indexed buyOrderId,
    uint256 indexed sellOrderId,
    uint256 matchedAmount
);
```

## 🧪 Testing Strategy

### Unit Tests

```bash
# Run contract unit tests
npx hardhat test test/ParallelOrderBook.ts
```

### Integration Tests

```bash
# Test parallel execution
npx hardhat run scripts/test-parallel-execution.ts --network arcologyDevNet
```

### Gas Optimization Tests

```bash
# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** and add tests
4. **Run the test suite**: `npm test`
5. **Submit a pull request**

### Development Guidelines

- Follow Solidity style guide
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure gas optimization for all changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Arcology Network** - For the concurrent execution environment
- **Hardhat** - For the development framework
- **OpenZeppelin** - For secure smart contract patterns

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/arnavkirti/Parallel-Ledger/issues)
- **Discussions**: [GitHub Discussions](https://github.com/arnavkirti/Parallel-Ledger/discussions)
- **Documentation**: [Arcology Docs](https://docs.arcology.network/)

---

**Built with ❤️ for the future of decentralized trading**
