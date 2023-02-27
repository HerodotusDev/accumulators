import { CoreMMR } from "@merkle-mountain-range/core";
import { MMRInMemoryStore } from "@merkle-mountain-range/memory";
import { StarkPedersenHasher } from "@merkle-mountain-range/hashes";

async function main() {
  const mmr = new CoreMMR(new MMRInMemoryStore(), new StarkPedersenHasher());

  await mmr.append("1");
  await mmr.append("2");
  await mmr.append("3");

  await mmr.bagThePeaks();
}

main();
