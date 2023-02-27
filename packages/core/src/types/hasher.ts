export type hash = (data: string) => string;

type HasherOptions = {
  blockSizeBits: number;
};

const defaultHasherOptions: HasherOptions = {
  blockSizeBits: 256,
};

type HexString = string;

export abstract class IHasher {
  constructor(protected readonly options: HasherOptions = defaultHasherOptions) {}

  /**
   *
   * @param data - Array of elements to be hashed, the size of each element should not exceed the block bit-size
   */
  abstract hash(data: HexString[]): HexString;

  public isElementSizeValid(element: HexString): boolean {
    const isPrefixed = element.startsWith("0x");
    return (isPrefixed ? element.length - 2 : element.length) * 2 * 8 <= this.options.blockSizeBits;
  }
}
