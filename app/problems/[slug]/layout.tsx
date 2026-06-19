// Problem page is the flagship no-scroll teaching loop: it owns the full
// viewport (its own TopBar replaces the global Nav, which hides on this route).
export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desktop = canonical no-scroll loop. Below lg the content column scrolls
  // (D14); the controller stays pinned by the engine's flex layout.
  return <div className="h-screen lg:overflow-hidden overflow-hidden">{children}</div>;
}
