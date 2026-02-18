"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-[var(--header-bg)]/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - hamburger menu (mobile) + breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Hamburger menu button - only visible on mobile */}
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden cursor-pointer rounded p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Breadcrumb / Page title */}
          <div className="flex items-center gap-2 font-mono text-sm text-zinc-500">
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-100">Dashboard</span>
          </div>
        </div>

        {/* Right side - controls */}
        <div className="flex items-center gap-4">
          {/* account switcher placeholder */}
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 font-mono text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-900"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>My account</span>
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-zinc-800" />

          {/* User menu */}
          <UserMenu />
        </div>
      </div>

      {/* Animated grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
    </header>
  );
}
