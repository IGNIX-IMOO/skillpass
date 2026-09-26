import { spawnSync } from "node:child_process";
import {
  Interface,
  concat,
  getAddress,
  getCreate2Address,
  id,
  keccak256,
} from "ethers";
import { compileTrustRegistry } from "./compile.mjs";

const owner =
  process.argv[2] ?? "0x60fda8130b7341027147a1b88cd4c2a1af44ecd0";
const create2Proxy = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const artifact = compileTrustRegistry();
const iface = new Interface(artifact.abi);
const deploymentData = `${artifact.bytecode}${iface
  .encodeDeploy([getAddress(owner)])
  .slice(2)}`;
const salt = id("skillpass:trust-registry:v1:imoo");
const inputData = concat([salt, deploymentData]);
const predictedAddress = getCreate2Address(
  create2Proxy,
  salt,
  keccak256(deploymentData),
);

console.log(
  JSON.stringify(
    {
      create2Proxy,
      salt,
      predictedAddress,
      deploymentBytes: (inputData.length - 2) / 2,
    },
    null,
    2,
  ),
);

const result = spawnSync(
  "onchainos",
  [
    "wallet",
    "contract-call",
    "--chain",
    "xlayer",
    "--to",
    create2Proxy,
    "--input-data",
    inputData,
    "--biz-type",
    "dapp",
    "--strategy",
    "skillpass-trust-registry-deploy",
  ],
  {
    encoding: "utf8",
    env: process.env,
  },
);

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
