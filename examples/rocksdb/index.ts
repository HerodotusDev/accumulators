import CoreMMR from "@herodotus_dev/mmr-core";
import MMRRocksDBStore from "@herodotus_dev/mmr-rocksdb";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";

async function main() {
  const rocksdbStore = new MMRRocksDBStore("./rocksdb_data");
  await rocksdbStore.init();
  const mmr = new CoreMMR(rocksdbStore, new StarkPedersenHasher());
  await mmr.append("1");
  await mmr.append("2");
  await mmr.append("4");
  await mmr.append("5");
  const result = await mmr.append("6");
  console.log("Result:", result);

  const peaks = await mmr.bagThePeaks();
  console.log("Root hash:", peaks);

  const proof5 = await mmr.getProof(5);
  console.log("Proof 5:", proof5, "is valid", await mmr.verifyProof(proof5, "5"));

  const proof6 = await mmr.getProof(result.leafIndex);
  console.log("Proof 6:", proof6, "is valid", await mmr.verifyProof(proof6, "6"));

  const result2 = await mmr.append("9");
  const proof7 = await mmr.getProof(result2.leafIndex);
  console.log("Proof 7:", proof7, "is valid", await mmr.verifyProof(proof7, "9"));
}

main();
