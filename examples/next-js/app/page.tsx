// Import your Client Component
import CoreMMR from "@herodotus_dev/mmr-core/lib/core";
import MMRInMemoryStore from "@herodotus_dev/mmr-memory";
import { Quote } from "../types";
import HomePage from "./home-page";

async function getQuotes() {
  const res = await fetch("https://dummyjson.com/quotes", {
    next: { revalidate: 10 },
  });
  const payload = (await res.json()) as { quotes: Quote[] };
  return payload?.quotes;
}

export default async function Page() {
  const quotes = await getQuotes();
  // const mmr = new CoreMMR(new MMRInMemoryStore(), await PoseidonHasher.create());
  // Fetch data directly in a Server Component
  // for (const quote of quotes) {
  //   mmr.append(quote.quote);
  // }
  // const root = await mmr.bagThePeaks();
  // Forward fetched data to your Client Component
  return <HomePage quotes={quotes} root={"root"} />;
}
