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

  // TODO: Make our MMR work with Next.js
  // const hasher = ;
  // const mmr = new CoreMMR(new MMRInMemoryStore(), hasher);

  // for (const quote of quotes) {
  //   console.log(quote.quote);
  //   const authHash = await hasher.hash([quote.author]);
  //   console.log(authHash);
  //   const append = await mmr.append(authHash);
  //   console.log(append)
  // }
  // const root = await mmr.bagThePeaks();
  // console.log(root);

  // Forward fetched data to your Client Component
  return <HomePage quotes={quotes} root={"root"} />;
}
