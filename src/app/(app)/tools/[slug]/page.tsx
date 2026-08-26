import type { Metadata } from "next";
import ToolPageClient from "./ToolPageClient";
import { fetchActiveToolBySlug } from "@/data/tools";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tool } = await fetchActiveToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool not found",
      description: "This tool is missing or no longer active.",
    };
  }

  const description =
    tool.description?.trim() ||
    tool.fullDescription?.trim() ||
    `${tool.name} on Rundown`;

  const title = `${tool.name} - ${description}`;

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(tool.logoUrl ? { images: [{ url: tool.logoUrl }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(tool.logoUrl ? { images: [tool.logoUrl] } : {}),
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  return <ToolPageClient slug={slug} />;
}
