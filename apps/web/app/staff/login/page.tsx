import { redirect } from "next/navigation";

export default async function StaffLoginAliasPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const query = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
  redirect(`/admin/login${query}`);
}
