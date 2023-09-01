export type AppendResult = {
  leavesCount: number;
  elementsCount: number;
  /**
   * The index of the appended element
   */
  elementIndex: number;
  rootHash: string;
};
