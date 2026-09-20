import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth.js";
import { getMyRentals } from "../../lib/rentals.js";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    redirect("/login");
  }

  let rentals = [];
  let rentalState = "ready";

  try {
    rentals = await getMyRentals(currentUser.user.id);
  } catch {
    rentalState = "unavailable";
  }

  return (
    <DashboardClient
      currentUser={currentUser.user}
      rentalState={rentalState}
      rentals={rentals}
    />
  );
}
