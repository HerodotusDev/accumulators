"use client";

import { Quote } from "../types";

export default function HomePage({ quotes, root }: { quotes: Quote[]; root: string }) {
  return (
    <div>
      {quotes.map((quote) => (
        <div key={quote.id}>{quote.quote}</div>
      ))}
    </div>
  );
}
