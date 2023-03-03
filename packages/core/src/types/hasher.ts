export type hash = (data: string) => string;

export type HasherOptions = {
  blockSizeBits: number;
};

export const defaultHasherOptions: HasherOptions = {
  blockSizeBits: 256,
};

export type HexString = string;

export abstract class IHasher {
  constructor(protected readonly options: HasherOptions = defaultHasherOptions) {}

  /**
   *
   * @param data - Array of elements to be hashed, the size of each element should not exceed the block bit-size
   */
  abstract hash(data: HexString[]): HexString;

  public isElementSizeValid = (element: HexString): boolean => IHasher.byteSize(element) <= this.options.blockSizeBits;

  static byteSize = (str: string) => new Blob([str.startsWith("0x") ? str.slice(2) : str]).size;
}
