// Convert number of elements in the MMR to number of leaves.
// If `elementsCount` is invalid, it throws an error.
export function elementsCountToLeafCount(elementsCount: number): number {
  let leafCount = 0;
  let mountainLeafCount = 1 << bitLength(elementsCount);
  while (mountainLeafCount > 0) {
    const mountainElementsCount = 2 * mountainLeafCount - 1;
    if (mountainElementsCount <= elementsCount) {
      leafCount += mountainLeafCount;
      elementsCount -= mountainElementsCount;
    }
    mountainLeafCount >>= 1;
  }
  if (elementsCount > 0) {
    throw new Error(`Invalid elements count`);
  }
  return leafCount;
}

export function elementIndexToLeafIndex(elementIndex: number): number {
  if (elementIndex <= 0) {
    throw new Error(`Invalid element index`);
  }
  try {
    return elementsCountToLeafCount(elementIndex - 1);
  } catch (e) {
    throw new Error(`Invalid element index`);
  }
}

// For a given node with `elementIndex`, find its siblings on the path to the peak if tree size is `elementsCount`.
// If elementIndex is not a leaf, it throws an error.
export function findSiblings(elementIndex: number, elementsCount: number): number[] {
  let leafIndex = elementIndexToLeafIndex(elementIndex);
  let height = 0;
  const siblings = [];
  while (elementIndex <= elementsCount) {
    const siblingsOffset = (2 << height) - 1;
    if (leafIndex % 2) {
      // right child
      siblings.push(elementIndex - siblingsOffset);
      elementIndex++;
    } else {
      // left child
      siblings.push(elementIndex + siblingsOffset);
      elementIndex += siblingsOffset + 1;
    }
    leafIndex = Math.floor(leafIndex / 2);
    height++;
  }
  siblings.pop();
  return siblings;
}

// Find the peaks of a tree of size `elementsCount`.
// If `elementsCount` is invalid, it returns an empty array.
export function findPeaks(elementsCount: number): number[] {
  let mountainElementsCount = (1 << bitLength(elementsCount)) - 1;
  let mountainIndexShift = 0;
  const peaks: number[] = [];
  while (mountainElementsCount > 0) {
    if (mountainElementsCount <= elementsCount) {
      mountainIndexShift += mountainElementsCount;
      peaks.push(mountainIndexShift);
      elementsCount -= mountainElementsCount;
    }
    mountainElementsCount >>= 1;
  }
  if (elementsCount > 0) {
    return [];
  }
  return peaks;
}

// Returns true if a specified index `num` is also the index of a peak inside `peaks`.
export function isPeak(elementIndex: number, peaks: number[]): boolean {
  return peaks.indexOf(elementIndex) !== -1;
}

// peak index, peak height
export function getPeakInfo(elementsCount: number, elementIndex: number): [number, number] {
  let mountainHeight = bitLength(elementsCount);
  let mountainElementsCount = (1 << mountainHeight) - 1;
  let mountainIndex = 0;
  while (true) {
    if (mountainElementsCount <= elementsCount) {
      if (elementIndex <= mountainElementsCount) {
        return [mountainIndex, mountainHeight - 1];
      }
      elementsCount -= mountainElementsCount;
      elementIndex -= mountainElementsCount;
      mountainIndex++;
    }
    mountainElementsCount >>= 1;
    mountainHeight--;
  }
}

// For a given number of leaves, calculates how many additional nodes will be created by hashing their children after one append (not including the appended node itself).
export function leafCountToAppendNoMerges(leafCount: number): number {
  return countTrailingOnes(leafCount);
}

// Returns the number of bits in num
export function bitLength(num: number): number {
  return num.toString(2).length;
}

// Returns the number of 1 bits in binary representation of num
export function countOnes(num: number): number {
  let count = 0;
  while (num) {
    num &= num - 1;
    count++;
  }
  return count;
}

// Returns the number of trailing 1 bits in binary representation of num
export function countTrailingOnes(num: number): number {
  let count = 0;
  while (num && num & 1) {
    num >>= 1;
    count++;
  }
  return count;
}

// Number with all bits 1 with the same length as num
export function allOnes(num: number) {
  return (1 << bitLength(num)) - 1 == num;
}

// Returns the number of leading zeros of a uint64.
export function leadingZeros(num: number) {
  return num === 0 ? 64 : 64 - bitLength(num);
}

// Get the peak map height.
// @notice this fn has a uint64 size limit
export function peakMapHeight(size: number) {
  if (size === 0) {
    return [0, 0];
  }
  let peak_size =
    // uint64 size
    BigInt("18446744073709551615") >> BigInt(leadingZeros(size));
  let peak_map = 0;
  while (peak_size != BigInt(0)) {
    peak_map <<= 1;
    if (size >= peak_size) {
      size -= Number(peak_size);
      peak_map |= 1;
    }
    peak_size >>= BigInt(1);
  }
  return [peak_map, size];
}

// Assuming the first position starts with index 1
// the height of a node correspond to the number of 1 digits (in binary)
// on the leftmost branch of the tree, minus 1
// To travel left on a tree we can subtract the position by it's MSB, minus 1
export const getHeight = (elementIndex: number): number => {
  let h = elementIndex;
  // Travel left until reaching leftmost branch (all bits 1)
  while (!allOnes(h)) {
    h = h - ((1 << (bitLength(h) - 1)) - 1);
  }

  return bitLength(h) - 1;
};

// Removes all duplicates from an array (order is not preserved)
export function arrayDeduplicate<T>(array: T[]) {
  const set = new Set(array);
  return [...set];
}
