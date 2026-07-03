import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-kn-bg text-kn-ink-0">
      {/* Form column */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between h-16 px-5 sm:px-7">
          <Logo variant="marketing" href="/" />
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      {/* Brand panel */}
      <div className="hidden lg:block">
        <AuthBrandPanel />
      </div>
    </div>
  );
}
