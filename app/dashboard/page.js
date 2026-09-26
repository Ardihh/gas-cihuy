import { redirect } from "next/navigation";

import { getLoginHref } from "../../lib/auth-navigation.mjs";
import { getCurrentUser } from "../../lib/auth.js";
import { getCatalogItems } from "../../lib/catalog.js";
import { getMyRentals, getRentals } from "../../lib/rentals.js";
import { getAllRentals, getOwnerStats } from "../../lib/owner.js";
import { filterReviewsForDashboard, getReviews } from "../../lib/reviews.js";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (currentUser.status !== "authenticated" || !currentUser.user) {
    redirect(getLoginHref("/dashboard"));
  }

  const isOwner = currentUser.user.role === "admin";

  // ── OWNER / ADMIN PATH ──────────────────────────────────────
  if (isOwner) {
    let rentals = [];
    let rentalState = "ready";
    let items = [];
    let itemsState = "ready";
    let reviews = [];
    let reviewState = "ready";
    let stats = { total: 0, pending: 0, ongoing: 0, returned: 0, approved: 0, totalRevenue: 0 };

    try {
      rentals = await getAllRentals();
      stats = await getOwnerStats(rentals);
    } catch {
      rentalState = "unavailable";
    }

    try {
      items = await getCatalogItems();
    } catch {
      itemsState = "unavailable";
    }

    try {
      reviews = await getReviews();
    } catch {
      reviewState = "unavailable";
    }

    return (
      <DashboardClient
        userName={currentUser.user.name}
        role="admin"
        rentalState={rentalState}
        rentals={rentals}
        stats={stats}
        items={items}
        itemsState={itemsState}
        reviewState={reviewState}
        reviews={reviews}
      />
    );
  }

  // ── CUSTOMER PATH ────────────────────────────────────────────
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
      userName={currentUser.user.name}
      role="customer"
      rentalState={rentalState}
      rentals={rentals}
      reviewState={reviewState}
      reviews={reviews}
    />
  );
}
