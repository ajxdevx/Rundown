import { redirect } from "next/navigation";

/** Legacy `/category/[slug]` → `/categories/[slug]`. */
export default async function CategoryRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/categories/${slug}`);
}
