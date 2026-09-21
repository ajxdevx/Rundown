import type { Metadata } from "next";
import { LandingPage } from "@/components/landing";

export const metadata: Metadata = {
  title: "Dueso — Projects, made simple.",
  description:
    "Dueso helps freelancers, agencies, studios, consultants, and service businesses manage projects, clients, files, payments, and communication in one place.",
  openGraph: {
    title: "Dueso — Projects, made simple.",
    description:
      "Manage projects, clients, files, payments, and communication — while giving every client a professional portal.",
    type: "website",
    siteName: "Dueso",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dueso — Projects, made simple.",
    description:
      "Manage projects, clients, files, payments, and communication — while giving every client a professional portal.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return <LandingPage />;
}
