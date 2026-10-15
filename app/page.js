import { getCatalogItems } from "../lib/catalog.js";
import { getCurrentUser } from "../lib/auth.js";
import LandingClient from "./LandingClient";
import LandingContent from "./landing/LandingContent";

const LANDING_PREVIEW_LIMIT = 8;

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
      isAuthenticated={isAuthenticated}
    >
      <LandingContent
        products={products.slice(0, LANDING_PREVIEW_LIMIT)}
        catalogState={catalogState}
      />
    </LandingClient>
  );
}
