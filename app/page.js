import { getCatalogItems } from "../lib/catalog.js";
import LandingClient from "./LandingClient";

export default async function LandingPage() {
  let products = [];
  let catalogState = "ready";

  try {
    products = await getCatalogItems();
  } catch {
    catalogState = "error";
  }

  return <LandingClient products={products} catalogState={catalogState} />;
}
