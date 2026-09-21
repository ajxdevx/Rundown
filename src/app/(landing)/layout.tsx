export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-root min-h-dvh bg-background text-ink">
      {children}
    </div>
  );
}
