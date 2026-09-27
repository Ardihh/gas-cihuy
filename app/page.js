import { getCatalogItems } from "../lib/catalog.js";
import { getCurrentUser } from "../lib/auth.js";
import LandingClient from "./LandingClient";

export default async function LandingPage() {
  const currentUserPromise = getCurrentUser().catch(() => null);
  let products = [];
  let catalogState = "ready";

  try {
    products = await getCatalogItems();
  } catch {
    catalogState = "error";
  }

  const currentUser = await currentUserPromise;
  const isAuthenticated = currentUser?.status === "authenticated" && Boolean(currentUser.user);

  return (
    <LandingClient
      products={products}
      catalogState={catalogState}
      isAuthenticated={isAuthenticated}
    />
  );
}
