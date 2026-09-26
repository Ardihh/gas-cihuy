import { redirect } from "next/navigation";

import { getLoginHref } from "../../lib/auth-navigation.mjs";
import { getCurrentUser } from "../../lib/auth.js";

export default async function DashboardLayout({ children }) {
  const currentUser = await getCurrentUser();

  if (currentUser.status === "unauthenticated") {
    redirect(getLoginHref("/dashboard"));
  }

  return children;
}
