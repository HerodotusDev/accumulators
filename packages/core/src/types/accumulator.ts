export type AppendResult = {
  leavesCount: number;
  leafIdx: string;
  rootHash: string | undefined;
  lastPos: number; // == tree size.
};
