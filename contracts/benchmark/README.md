# ParallelOrderBook Transaction Generation for Benchmarking

This script generates transaction data files for benchmarking the ParallelOrderBook contract's concurrent execution capabilities on Arcology DevNet.

## Overview

The `gen-tx-parallel-orderbook.ts` script creates pre-signed transactions that can be submitted to Arcology DevNet in batches to test parallel execution performance. It generates order placement transactions using test accounts from the examples directory.

## Generated Files

```
benchmark/order-placement/
├── summary.json              # Benchmark configuration and metadata
└── txs/
    ├── order-placement-batch-0.json
    ├── order-placement-batch-1.json
    └── ...
```

## Usage

### Generate Transactions

```bash
# Generate 1000 transactions in batches of 50 (default config)
npx hardhat run scripts/gen-tx-parallel-orderbook.ts --network arcologyDevNet
```

### Custom Configuration

Edit the `config` object in the script to customize:

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

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `totalTransactions` | Total number of transactions to generate | 1000 |
| `batchSize` | Number of transactions per batch file | 50 |
| `baseAmount` | Base token amount for orders (wei) | 1000000 |
| `quoteAmount` | Quote token amount for orders (wei) | 2000000 |
| `mixBuySell` | Alternate between buy/sell orders | true |
| `outputDir` | Output directory for generated files | "benchmark/order-placement" |

## Prerequisites

1. **Arcology DevNet Running**: Start your Arcology DevNet on localhost:8545
2. **Test Accounts**: Ensure test accounts from `examples/account/accounts_20.txt` are funded
3. **Network Config**: Configure `arcologyDevNet` network in `hardhat.config.ts`

## Output Files

### summary.json
Contains benchmark metadata and configuration:
```json
{
  "config": { ... },
  "contractAddress": "0x...",
  "network": "arcologyDevNet",
  "totalBatches": 20,
  "totalTransactions": 1000,
  "totalEstimatedGas": "50000000",
  "averageGasPerTransaction": "50000",
  "batches": [...],
  "generatedAt": "2025-10-26T...",
  "description": "..."
}
```

### Batch Files (order-placement-batch-X.json)
Each batch contains pre-signed transactions:
```json
{
  "batchId": 0,
  "transactions": [
    {
      "rawTx": "0x02f8...",
      "from": "0xaB01a3BfC5de6b5Fc481e18F274ADBdbA9B111f0",
      "to": "0x...",
      "data": "0x...",
      "value": "0",
      "gasLimit": "50000"
    }
  ],
  "totalTransactions": 50,
  "estimatedGas": "2500000"
}
```

## Running Benchmarks

1. **Generate Transactions**:
   ```bash
   npx hardhat run scripts/gen-tx-parallel-orderbook.ts --network arcologyDevNet
   ```

2. **Submit Batches Concurrently**:
   Use a script or tool to submit the raw transactions from each batch file simultaneously to test parallel execution.

3. **Measure Performance**:
   - Transaction throughput (tx/s)
   - Block time and finality
   - Gas usage efficiency
   - Conflict rates (should be zero with proper concurrent data structures)

## Test Accounts

The script uses 20 test accounts from `examples/account/accounts_20.txt`:

- Accounts 0-7: Used for transaction generation
- All accounts are pre-funded on Arcology DevNet
- Private keys are included for signing transactions

## Integration with Arcology

This script is designed to work with Arcology's concurrent execution engine:

- **U256Cumulative**: Used in ParallelOrderBook for conflict-free counters
- **Concurrent Arrays**: For storing order books without serialization
- **Parallel Execution**: Multiple order placements execute simultaneously

## Performance Metrics

The generated transactions allow you to measure:

- **Throughput**: Transactions per second during parallel execution
- **Speedup**: Performance improvement vs sequential execution
- **Gas Efficiency**: Gas usage per transaction in concurrent environment
- **Scalability**: How performance scales with transaction batch size

## Troubleshooting

### Contract Deployment Fails
- Ensure Arcology DevNet is running on localhost:8545
- Check that the deployer account has sufficient ETH balance
- Verify network configuration in `hardhat.config.ts`

### Transaction Generation Errors
- Ensure all test accounts are properly funded
- Check network connectivity to Arcology DevNet
- Verify contract artifact is available

### Gas Estimation Issues
- Some networks may not support gas estimation
- Use fixed gas limits if estimation fails
- Monitor actual gas usage during benchmark execution

## Related Files

- `contracts/ParallelOrderBook.sol` - The contract being benchmarked
- `scripts/demo-parallel-execution.ts` - Simulation script for demos
- `examples/account/accounts_20.txt` - Test account data
- `hardhat.config.ts` - Network configuration