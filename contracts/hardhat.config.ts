import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    arcologyDevNet: {
      type: "http",
      chainType: "l1",
      url: process.env.ARCOLOGY_DEVNET_RPC_URL || "http://192.168.1.6:8545",
      accounts: process.env.ARCOLOGY_PRIVATE_KEY
        ? [process.env.ARCOLOGY_PRIVATE_KEY]
        : ["0x5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e7"], // Test account #1 from examples/account/accounts_20.txt
    },
    arcologyTestNet: {
      type: "http",
      chainType: "l1",
      url: process.env.ARCOLOGY_TESTNET_RPC_URL || "https://testnet.arcology.network:8545",
      accounts: process.env.ARCOLOGY_TESTNET_PRIVATE_KEY
        ? [process.env.ARCOLOGY_TESTNET_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
