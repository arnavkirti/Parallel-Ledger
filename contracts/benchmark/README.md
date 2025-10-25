# ParallelOrderBook Benchmarking

## Overview
This directory contains benchmarking tools for testing the ParallelOrderBook contract's concurrent execution capabilities on Arcology DevNet.

## Generated Files
- `order-placement/transactions.json` - Pre-signed transactions for benchmarking
- `order-placement/summary.json` - Benchmark configuration and results

## Usage
1. Start Arcology DevNet
2. Deploy ParallelOrderBook contract
3. Run benchmark transactions concurrently
4. Analyze performance metrics

## Performance Expectations
- Concurrent execution should show significant throughput improvements
- U256Cumulative counters enable conflict-free operations
- Bool arrays provide thread-safe state management