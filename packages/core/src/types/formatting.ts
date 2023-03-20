interface FormattingOptions {
  outputSize: number;
  nullValue: string;
}

export type ProofFormattingOptions = FormattingOptions;
export type PeaksFormattingOptions = FormattingOptions;

export function validateFormattingOptions(options: FormattingOptions) {
  if (!options.nullValue.startsWith("0x")) {
    throw new Error("Formatting options: nullValue must be a hex string");
  }

  if (Number.isNaN(parseInt(options.nullValue, 16))) {
    throw new Error("Formatting options: nullValue must be a hex string");
  }
}

export function formatPeaks(peaks: string[], formattingOpts: PeaksFormattingOptions): string[] {
  if (peaks.length > formattingOpts.outputSize) {
    throw new Error("Formatting: Expected peaks output size is smaller than the actual size");
  }

  const expectedPeaksSizeRemainder = formattingOpts.outputSize - peaks.length;
  const peaksNullValues = Array<string>(expectedPeaksSizeRemainder).fill(formattingOpts.nullValue);
  return peaks.concat(peaksNullValues);
}

export function formatProof(siblingsHashes: string[], formattingOpts: ProofFormattingOptions): string[] {
  if (siblingsHashes.length > formattingOpts.outputSize) {
    throw new Error("Formatting: Expected proof output size is smaller than the actual size");
  }

  const expectedProofSizeRemainder = formattingOpts.outputSize - siblingsHashes.length;
  const proofNullValues = Array<string>(expectedProofSizeRemainder).fill(formattingOpts.nullValue);
  return siblingsHashes.concat(proofNullValues);
}
