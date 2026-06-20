import { redirect } from "next/navigation";

// The space index redirects to its default tab (Board).
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; spaceKey: string }>;
}) {
  const { slug, spaceKey } = await params;
  redirect(`/org/${slug}/spaces/${spaceKey}/board`);
}
