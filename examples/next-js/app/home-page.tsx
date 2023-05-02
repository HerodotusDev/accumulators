"use client";

import CoreMMR from "@herodotus_dev/mmr-core/lib/core";
import MMRInMemoryStore from "@herodotus_dev/mmr-memory";
import { BrowserHasher } from "../utils/hasher";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Quote } from "../types";
import { Proof } from "@herodotus_dev/mmr-core";

export default function HomePage({ quotes }: { quotes: Quote[] }) {
  //? Setup the MMR
  const hasher = useMemo<BrowserHasher>(() => new BrowserHasher(), []),
    store = useMemo<MMRInMemoryStore>(() => new MMRInMemoryStore(), []),
    mmr = useMemo<CoreMMR>(() => hasher && new CoreMMR(store, hasher), [hasher]);

  //? Build the MMR
  const buildTree = useCallback(async () => {
      if (!mmr || !quotes) return;
      const leafs = [];
      for (const quote of quotes) {
        const leafValue = await hasher.hash([quote.quote]);
        const append = await mmr.append(leafValue);
        leafs.push({ ...append, ...quote, leafValue });
      }
      setLeafs(leafs);
      const root = await mmr.bagThePeaks();
      setRoot(root);
    }, [quotes, mmr]),
    [root, setRoot] = useState(""),
    [leafs, setLeafs] = useState([]);

  //? Build the MMR on mount
  useEffect(() => {
    buildTree();
  }, [buildTree]);

  const [error, setError] = useState<false | string>(false);
  //? Quote a user wants to prove is in the MMR
  const [quoteHash, setQuoteHash] = useState("");

  //? Get a proof of inclusion and verify it
  const getProof = useCallback(async () => {
      const leaf = leafs.find((leaf) => leaf.leafValue === quoteHash);
      if (!leaf) return setError("Quote not found");
      const proof = await mmr.getProof(leaf.leafIndex);
      setProof(proof);
      const isValid = await mmr.verifyProof(proof, leaf.leafValue);
      setIsValid(isValid);
    }, [leafs, mmr, quoteHash]),
    [proof, setProof] = useState<Proof>(),
    [isValid, setIsValid] = useState(false),
    clearProof = () => {
      setProof(undefined);
      setIsValid(false);
    };

  //? Clear the error
  useEffect(() => {
    setError(false);
  }, [quoteHash, proof, isValid]);

  return (
    <div>
      <h1>Proof</h1>
      <input value={quoteHash} onChange={(e) => setQuoteHash(e.target.value)} placeholder="quote hash" />
      <button onClick={proof ? clearProof : getProof}>{proof ? "Clear" : "Prove quote inclusion in MMR"}</button>
      <div style={{ height: "2em" }}>
        {proof ? (
          <>
            <div style={{ color: isValid ? "green" : "red" }}>Proof is {isValid ? "valid" : "invalid"}</div>
            <div>Proof: {JSON.stringify(proof, null, 2)}</div>
          </>
        ) : null}
      </div>
      <div style={{ color: "red", height: "1em" }}>{error || null}</div>

      <h1>Quotes</h1>
      {quotes.map((quote, idx) => (
        <div key={quote.id}>
          {quote.quote}
          {leafs.length ? (
            <b style={{ fontStyle: "italic", fontSize: "1.1em" }}>
              {" "}
              - hash: {leafs[idx].leafValue}, leafIdx: {leafs[idx].leafIndex}
            </b>
          ) : null}
        </div>
      ))}

      <h1>Root of the tree</h1>
      {root ? <div>{root}</div> : null}
    </div>
  );
}
