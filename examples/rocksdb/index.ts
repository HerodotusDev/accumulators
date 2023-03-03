import CoreMMR from "@herodotus_dev/mmr-core";
import MMRRocksDBStore from "@herodotus_dev/mmr-rocksdb";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";

async function main() {
  const rocksdbStore = new MMRRocksDBStore("./rocksdb_data");
  await rocksdbStore.init(true);
  const mmr = new CoreMMR(rocksdbStore, new StarkPedersenHasher());
  await mmr.append("1");
  await mmr.append("2");
  await mmr.append("4");
  await mmr.append("5");
  const result = await mmr.append("8");
  console.log("Result:", result);

  const peaks = await mmr.bagThePeaks();
  console.log("Root hash:", peaks);

  const proof4 = await mmr.getProof(5);
  console.log("Proof 5:", proof4, "is valid", await mmr.verifyProof(5, "5", proof4));

  const proof5 = await mmr.getProof(8);
  console.log("Proof 8:", proof5, "is valid", await mmr.verifyProof(8, "8", proof5));
}

main();
