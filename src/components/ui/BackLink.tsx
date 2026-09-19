import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type BackLinkProps = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
