import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth.js";

export default async function DashboardLayout({ children }) {
  const currentUser = await getCurrentUser();

  if (currentUser.status === "unauthenticated") {
    redirect("/login");
  }

  return children;
}
