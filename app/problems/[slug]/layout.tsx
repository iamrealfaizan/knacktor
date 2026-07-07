// Problem page is the flagship no-scroll teaching loop: it owns the full
// viewport (its own TopBar replaces the global Nav, which hides on this route).
export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desktop = canonical no-scroll loop (h-screen). Below lg the engine renders
  // the stacked mobile layout (D14): h-dvh tracks mobile browser chrome so the
  // pinned ControlDock never sits under the URL bar.
  return <div className="h-dvh lg:h-screen overflow-hidden">{children}</div>;
}
