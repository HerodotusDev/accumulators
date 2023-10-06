import { findPeaks, elementsCountToLeafCount } from "../src/helpers";

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

  it("elemenetsCountToLeafCount", async () => {
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
});
