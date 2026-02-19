"use client";

import { pages } from "@/config/routes";
import {
  ChatBubbleBottomCenterTextIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: pages.dashboard, icon: HomeIcon },
  { name: "Hunts", href: pages.hunts.list, icon: MagnifyingGlassIcon },
  { name: "Pipeline", href: pages.pipeline, icon: Squares2X2Icon },
  {
    name: "Templates",
    href: pages.templates.list,
    icon: ChatBubbleBottomCenterTextIcon,
  },
  { name: "Settings", href: pages.settings, icon: Cog6ToothIcon },
  { name: "Credits", href: pages.credits, icon: CurrencyDollarIcon },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-800 bg-[var(--sidebar-bg)] transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10">
              <span className="font-mono text-sm font-bold text-amber-500">
                AP
              </span>
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-tight text-zinc-100">
                AUTO-PROSPECT
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                v1.0.0
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()} // Close sidebar on mobile after navigation
                className={`
                  group relative flex items-center gap-3 rounded px-3 py-2.5 font-mono text-sm transition-all
                  ${
                    isActive
                      ? "bg-amber-500/10 text-amber-500 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "slideIn 0.3s ease-out forwards",
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-amber-500" />
                )}

                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium tracking-wide">{item.name}</span>

                {/* Hover glow effect */}
                <div className="absolute inset-0 -z-10 rounded bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 blur transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </nav>

        {/* Footer - System status */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2 rounded bg-zinc-900/50 px-3 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-xs text-zinc-500">
              SYSTEM ONLINE
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
    </>
  );
}
