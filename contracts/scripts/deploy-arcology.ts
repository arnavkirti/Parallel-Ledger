import hre from "hardhat";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";

async function main() {
  console.log("🚀 Deploying ParallelOrderBook to Arcology...");

  // Connect to Arcology DevNet
  const rpcUrl = "http://localhost:8545";
  const provider = new JsonRpcProvider(rpcUrl);

  // Deploy contract
  const artifact = await hre.artifacts.readArtifact("ParallelOrderBook");
  const factory = new ContractFactory(artifact.abi, artifact.bytecode);
  const wallet = new Wallet(process.env.PRIVATE_KEY || "0x...", provider);

  const contract = await factory.connect(wallet).deploy();
  await contract.waitForDeployment();

  console.log("✅ ParallelOrderBook deployed to:", await contract.getAddress());
}

main().catch(console.error);