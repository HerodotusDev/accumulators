export type AppendResult = {
  leavesCount: number;
  leafIndex: number;
  rootHash: string;
  lastPos: number; // == tree size.
};
