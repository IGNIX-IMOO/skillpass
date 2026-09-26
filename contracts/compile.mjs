import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(directory, "TrustRegistry.sol");
const artifactDirectory = path.join(directory, "artifacts");
const artifactPath = path.join(artifactDirectory, "TrustRegistry.json");

export function compileTrustRegistry() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "TrustRegistry.sol": { content: source },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors ?? []).filter(
    (error) => error.severity === "error",
  );
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  }

  const contract = output.contracts["TrustRegistry.sol"].TrustRegistry;
  return {
    contractName: "TrustRegistry",
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  };
}

function main() {
  const artifact = compileTrustRegistry();
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        artifact: artifactPath,
        bytecodeBytes: (artifact.bytecode.length - 2) / 2,
        deployedBytecodeBytes: (artifact.deployedBytecode.length - 2) / 2,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
