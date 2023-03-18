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
  return <HomePage quotes={quotes} />;
}
