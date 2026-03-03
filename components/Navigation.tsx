"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanFace, Database, History } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Comparar", icon: ScanFace },
  { href: "/database", label: "Base de datos", icon: Database },
  { href: "/history", label: "Historial", icon: History },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-3 sm:gap-8 h-13 sm:h-14">
        {/* Logo */}
        <div className="flex items-center gap-2 text-blue-400 font-semibold shrink-0">
          <ScanFace className="w-5 h-5" />
          <span className="text-slate-100 hidden sm:inline">Biometría</span>
          <span className="text-blue-400 hidden sm:inline">Facial</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 sm:gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
