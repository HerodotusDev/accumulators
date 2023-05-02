import { IHasher } from "@herodotus_dev/mmr-core";

export class BrowserHasher extends IHasher {
  constructor(options?: any) {
    super(options);
  }
  //? Simple hash
  hash(data: string[]): string {
    let combinedText = data.join("");
    let hash = 5381;
    let i = combinedText.length;

    while (i) {
      hash = (hash * 33) ^ combinedText.charCodeAt(--i);
    }

    return "0x" + (hash >>> 0).toString(16);
  }
}
