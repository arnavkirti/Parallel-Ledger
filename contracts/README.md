# Parallel Order Book

A concurrent order book implementation for Arcology DevNet using conflict-free replicated data types.

## Features
- **Concurrent Execution**: Uses U256Cumulative and Bool arrays for conflict-free operations
- **Parallel Processing**: Multiple orders can be processed simultaneously
- **Arcology Integration**: Optimized for Arcology's concurrent execution model

## Quick Start
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Arcology
npx hardhat run scripts/deploy-arcology.ts --network arcologyDevNet

# Generate benchmark transactions
npx hardhat run scripts/gen-tx-parallel-orderbook.ts
```

## Architecture
- `contracts/ParallelOrderBook.sol` - Main contract with concurrent data structures
- `scripts/` - Deployment and benchmarking scripts
- `benchmark/` - Generated transaction data for performance testing