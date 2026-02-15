"use client";

import { useState } from "react";
import { signOut } from "@/actions/auth.actions";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="relative">
      {/* User button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
      >
        {/* Avatar */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 font-mono text-xs font-bold text-zinc-950">
          U
        </div>
        <div className="text-left">
          <p className="font-mono text-xs font-medium text-zinc-100">User Account</p>
          <p className="font-mono text-[10px] text-zinc-500">user@example.com</p>
        </div>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-slideDown rounded border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
            {/* User info */}
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="font-mono text-sm font-medium text-zinc-100">User Account</p>
              <p className="font-mono text-xs text-zinc-500">user@example.com</p>
            </div>

            {/* Menu items */}
            <div className="p-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded px-3 py-2 font-mono text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded px-3 py-2 font-mono text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>

              <div className="my-1 h-px bg-zinc-800" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 font-mono text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
