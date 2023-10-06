import { findPeaks, elementsCountToLeafCount, elementIndexToLeafIndex, findSiblings } from "../src/helpers";

describe("helpers", () => {
  it("findPeaks", async () => {
    const correct: Record<number, number[]> = {
      // invalid sizes
      0: [],
      2: [],
      5: [],
      6: [],
      9: [],
      12: [],
      13: [],
      14: [],

      // valid sizes
      1: [1],
      3: [3],
      4: [3, 4],
      7: [7],
      8: [7, 8],
      10: [7, 10],
      11: [7, 10, 11],
      15: [15],
    };
    for (const i in correct) {
      const input = parseInt(i);
      expect(findPeaks(input)).toEqual(correct[input]);
    }
  });

  it("elementsCountToLeafCount", async () => {
    const leafCount = [0, 1, null, 2, 3, null, null, 4, 5, null, 6, 7, null, null, null, 8];

    for (let i = 0; i < leafCount.length; i++) {
      const expected = leafCount[i];
      if (expected !== null) {
        expect(elementsCountToLeafCount(i)).toEqual(expected);
      } else {
        expect(() => elementsCountToLeafCount(i)).toThrow();
      }
    }
  });

  it("elementIndexToLeafIndex", async () => {
    const leafIndex = [null, 0, 1, null, 2, 3, null, null, 4, 5, null, 6, 7, null, null, null];

    for (let i = 0; i < leafIndex.length; i++) {
      const expected = leafIndex[i];
      if (expected !== null) {
        expect(elementIndexToLeafIndex(i)).toEqual(expected);
      } else {
        expect(() => elementIndexToLeafIndex(i)).toThrow();
      }
    }
  });

  it("findSiblings", async () => {
    const tests = {
      // `mmrSize:elementIndex`: path
      "1:1": [],
      "3:1": [2],
      "3:2": [1],
      "4:1": [2],
      "4:2": [1],
      "4:4": [],
      "7:1": [2, 6],
      "7:2": [1, 6],
      "7:4": [5, 3],
      "7:5": [4, 3],
      "15:1": [2, 6, 14],
      "15:2": [1, 6, 14],
      "15:4": [5, 3, 14],
      "15:5": [4, 3, 14],
      "15:8": [9, 13, 7],
      "15:9": [8, 13, 7],
      "15:11": [12, 10, 7],
      "15:12": [11, 10, 7],
      "49:33": [32, 37, 45],
    };
    for (const test in tests) {
      const [mmrSize, elementIndex] = test.split(":").map((x) => parseInt(x));
      const expected = tests[test];
      console.log(findSiblings(elementIndex, mmrSize));
      expect(findSiblings(elementIndex, mmrSize)).toEqual(expected);
    }
  });
});
