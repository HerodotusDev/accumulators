import { CoreMMR } from "@merkle-mountain-range/core";
import { MMRRocksDBStore } from "@merkle-mountain-range/rocksdb";
import { StarkPedersenHasher } from "@merkle-mountain-range/hashes";

async function main() {
  const rocksdbStore = new MMRRocksDBStore("./rocksdb");
  await rocksdbStore.init(true);
  const mmr = new CoreMMR(rocksdbStore, new StarkPedersenHasher());
  await mmr.append("1");
}

main();
