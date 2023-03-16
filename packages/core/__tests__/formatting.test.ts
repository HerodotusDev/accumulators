import CoreMMR, { AppendResult } from "../src";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";
import MMRInMemoryStore from "@herodotus_dev/mmr-memory";

describe("Core: formatting", () => {
  let mmr: CoreMMR;

  beforeAll(async () => {
    mmr = new CoreMMR(new MMRInMemoryStore(), new StarkPedersenHasher());
    await mmr.append("1");
    await mmr.append("2");
    await mmr.append("3");
    await mmr.append("4");
    await mmr.append("5");
  });

  it("Should properly format the proof", async () => {
    const proof = await mmr.getProof(4);

    const actualProofSiblingsHashesLength = proof.siblingsHashes.length;
    const actualProofPeaksLength = proof.peaksHashes.length;

    const nullValue = "0xffff";
    const expectedFormattedProofSiblingHashesLength = 4;
    const expectedFormattedProofPeaksLength = 4;

    const proofFormatted = await mmr.getProof(4, {
      proof: {
        outputSize: expectedFormattedProofSiblingHashesLength,
        nullValue,
      },
      peaks: {
        outputSize: expectedFormattedProofPeaksLength,
        nullValue,
      },
    });

    const expectedNullValuesInProofSiblingsHashes =
      proofFormatted.siblingsHashes.length - actualProofSiblingsHashesLength;
    const expectedNullValuesInProofPeaks = proofFormatted.peaksHashes.length - actualProofPeaksLength;

    const nullSiblingsHashesInProofFormatted = proofFormatted.siblingsHashes.filter((hash) => hash === nullValue);
    expect(nullSiblingsHashesInProofFormatted.length).toBe(expectedNullValuesInProofSiblingsHashes);

    const nullPeaksInProofFormatted = proofFormatted.peaksHashes.filter((hash) => hash === nullValue);
    expect(nullPeaksInProofFormatted.length).toBe(expectedNullValuesInProofPeaks);
  });

  it("Should properly format the peaks", async () => {
    const peaks = await mmr.getPeaks();

    const actualPeaksLength = peaks.length;
    const nullValue = "0xffff";
    const expectedFormattedPeaksLength = 4;

    const peaksFormatted = await mmr.getPeaks({
      outputSize: expectedFormattedPeaksLength,
      nullValue,
    });

    const expectedNullValuesInPeaks = peaksFormatted.length - actualPeaksLength;
    const nullPeaksInPeaksFormatted = peaksFormatted.filter((hash) => hash === nullValue);
    expect(nullPeaksInPeaksFormatted.length).toBe(expectedNullValuesInPeaks);
  });

  it("Should succesfully verify a formatted proof", async () => {
    const formattingOptions = {
      nullValue: "0xffff",
      outputSize: 4,
    };

    const proof = await mmr.getProof(4, { peaks: formattingOptions, proof: formattingOptions });

    // TODO explain why 3 is the value
    const isValid = await mmr.verifyProof(proof, "3", { peaks: formattingOptions, proof: formattingOptions });
    expect(isValid).toBe(true);
  });
});
