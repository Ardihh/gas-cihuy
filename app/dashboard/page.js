import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth.js";
import { getMyRentals } from "../../lib/rentals.js";
import { filterReviewsForDashboard, getReviews } from "../../lib/reviews.js";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    redirect("/login");
  }

  let rentals = [];
  let rentalState = "ready";
  let reviews = [];
  let reviewState = "unavailable";

  try {
    rentals = await getMyRentals(currentUser.user.id);
    reviewState = "ready";
  } catch {
    rentalState = "unavailable";
  }

  if (rentalState === "ready") {
    try {
      reviews = filterReviewsForDashboard(
        await getReviews(),
        currentUser.user.id,
        rentals,
      );
    } catch {
      reviewState = "unavailable";
    }
  }

  return (
    <DashboardClient
      currentUser={currentUser.user}
      rentalState={rentalState}
      rentals={rentals}
      reviewState={reviewState}
      reviews={reviews}
    />
  );
}
