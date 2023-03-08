export type AppendResult = {
  leavesCount: number;
  leafIdx: number;
  rootHash: string;
  lastPos: number; // == tree size.
};
