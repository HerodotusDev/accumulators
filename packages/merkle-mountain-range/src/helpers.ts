// Find the peaks (if any) of a tree of size `num`.
export const findPeaks = (elementsCount: number): number[] => {
  if (elementsCount === 0) return [];

  // Check for siblings without parents
  if (getHeight(elementsCount + 1) > getHeight(elementsCount)) return [];

  let top = 1;
  while (top - 1 <= elementsCount) {
    top <<= 1;
  }
  top = (top >> 1) - 1;
  if (top === 0) {
    return [1];
  }

  const peaks = [top];
  let peak = top;
  let outer = true;
  while (outer) {
    peak = bintreeJumpRightSibling(peak);
    while (peak > elementsCount) {
      peak = bintreeMoveDownLeft(peak);
      if (peak === 0) {
        outer = false;
        break;
      }
    }
    if (outer) peaks.push(peak);
  }
  return peaks;
};

// Returns true if a specified index `num` is also the index of a peak inside `peaks`.
export const isPeak = (elementIndex: number, peaks: number[]): boolean => peaks.indexOf(elementIndex) !== -1;

// Returns the number of bits in num
export function bitLength(num: number): number {
  return num.toString(2).length;
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

// Get the offset to the next sibling from `height`
export const siblingOffset = (height: number): number => {
  return parentOffset(height) - 1;
};

// Get the offset to the next parent from `height`
export const parentOffset = (height: number): number => {
  return 2 << height;
};

// Jump to the next right sibling from `elementIndex`
const bintreeJumpRightSibling = (elementIndex: number) => {
  const height = getHeight(elementIndex);
  return elementIndex + (1 << (height + 1)) - 1;
};

// Jump down left from `elementIndex`
const bintreeMoveDownLeft = (elementIndex: number) => {
  const height = getHeight(elementIndex);
  if (height === 0) {
    return 0;
  }
  return elementIndex - (1 << height);
};
