import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth.js";
import { getCatalogGateRedirect } from "../../lib/auth-navigation.mjs";
import { getCatalogItems } from "../../lib/catalog.js";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const currentUser = await getCurrentUser();
  const authRedirect = getCatalogGateRedirect(currentUser);

  if (authRedirect) {
    redirect(authRedirect);
  }

  let products = [];
  let catalogState = "ready";

  try {
    products = await getCatalogItems();
  } catch {
    catalogState = "error";
  }

  return <CatalogClient products={products} catalogState={catalogState} />;
}

