// Problem page is the flagship no-scroll teaching loop: it owns the full
// viewport (its own TopBar replaces the global Nav, which hides on this route).
export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen overflow-hidden">{children}</div>;
}
