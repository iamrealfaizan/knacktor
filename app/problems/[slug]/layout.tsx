// Problem page is no-scroll: fixed-height panels below the 3.5rem nav
export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100svh-3.5rem)] overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
