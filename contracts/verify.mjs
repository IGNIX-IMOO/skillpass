import assert from "node:assert/strict";
import ganache from "ganache";
import {
  BrowserProvider,
  ContractFactory,
  id,
  zeroPadValue,
} from "ethers";
import { compileTrustRegistry } from "./compile.mjs";

const provider = new BrowserProvider(
  ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 31337 },
    wallet: { deterministic: true },
  }),
);

const signer = await provider.getSigner(0);
const outsider = await provider.getSigner(1);
const artifact = compileTrustRegistry();
const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
const registry = await factory.deploy(await signer.getAddress());
await registry.waitForDeployment();
const registryAddress = await registry.getAddress();

async function expectRevert(promise, expected) {
  try {
    await promise;
    assert.fail(`Expected revert containing: ${expected}`);
  } catch (error) {
    const text =
      error?.info?.error?.message ??
      error?.info?.error?.data?.reason ??
      error?.shortMessage ??
      String(error);
    assert.match(text, new RegExp(expected));
  }
}

const passportId = id("passport:research_to_story");
const licenseId = id("license:controlled_demo_buyer");
const serviceId = id("service:research_to_story");
const receiptId = id("receipt:controlled_demo_1");
const operatorAgentId = id("agent:imoo_operator");
const buyerAgentId = id("agent:controlled_demo_buyer");
const creatorProof = id("creator:controlled_demo");

await (
  await registry.createPassport(
    passportId,
    id("namespace:ignix.skillpass.demo"),
    id("skill:research_to_story"),
    id("version:1.0.0"),
    creatorProof,
    await signer.getAddress(),
    serviceId,
    1,
  )
).wait();

await (
  await registry.issueLicense(
    licenseId,
    passportId,
    buyerAgentId,
    0,
    3,
    0,
  )
).wait();

await (
  await registry.bindService(
    serviceId,
    passportId,
    operatorAgentId,
    id("endpoint:controlled-demo"),
    true,
  )
).wait();

await (await registry.recordQuotaStep(licenseId, 2, receiptId)).wait();
await (
  await registry.recordReceipt(
    receiptId,
    passportId,
    licenseId,
    serviceId,
    buyerAgentId,
    id("request:demo"),
    id("result:demo"),
    zeroPadValue("0x37", 32),
    2,
    1,
  )
).wait();

const passport = await registry.getPassport(passportId);
const license = await registry.getLicense(licenseId);
const service = await registry.getService(serviceId);
const receipt = await registry.getReceipt(receiptId);

assert.equal(passport.owner, await signer.getAddress());
assert.equal(passport.capabilityCircuitId, 1n);
assert.equal(license.quotaRemaining, 2n);
assert.equal(license.status, 0n);
assert.equal(service.available, true);
assert.equal(receipt.quotaStateOut, 2n);
assert.equal(receipt.status, 1n);

await (await registry.revokeLicense(licenseId)).wait();
await expectRevert(
  registry.recordQuotaStep(licenseId, 1, id("receipt:after_revoke")),
  "license inactive",
);

await expectRevert(
  registry.connect(outsider).setController(await outsider.getAddress(), true),
  "not owner",
);

await (await registry.setController(await outsider.getAddress(), true)).wait();
assert.equal(await registry.controllers(await outsider.getAddress()), true);

console.log(
  JSON.stringify(
    {
      registryAddress,
      passportId,
      licenseId,
      serviceId,
      receiptId,
      checks: 9,
    },
    null,
    2,
  ),
);
