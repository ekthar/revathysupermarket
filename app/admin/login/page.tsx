import { redirect } from "next/navigation";

// Redirect old admin login URL to hidden staff portal
export default function AdminLoginRedirect() {
  redirect("/staff/portal");
}
