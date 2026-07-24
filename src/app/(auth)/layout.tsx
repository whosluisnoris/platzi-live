import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";

// Layout de las páginas de acceso: tarjeta centrada, marca arriba, toggle de tema.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-display text-lg font-black tracking-tight brand-text">
          {SITE_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="glass w-full max-w-md rounded-2xl p-7 backdrop-blur-md sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
