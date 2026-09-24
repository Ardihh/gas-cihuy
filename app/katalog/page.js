import { getCatalogItems } from "../../lib/catalog.js";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  let products = [];
  let catalogState = "ready";

  try {
    products = await getCatalogItems();
  } catch {
    catalogState = "error";
  }

  return <CatalogClient products={products} catalogState={catalogState} />;
}

