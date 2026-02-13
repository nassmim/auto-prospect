"use client";

import { SWRProvider } from "@/providers/swr-provider";
import { customFormatDate } from "@/utils/general.utils";
import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { WhatsAppDisconnectionBanner } from "./whatsapp-disconnection-banner";

type AppLayoutClientProps = {
  children: React.ReactNode;
  whatsappDisconnected: boolean;
};

export function AppLayoutClient({
  children,
  whatsappDisconnected,
}: AppLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getTodayDate = () => new Date();

  return (
    <SWRProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        {/* Sidebar */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col md:pl-64">
          {/* Header */}
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

          {/* Global WhatsApp Disconnection Warning */}
          <WhatsAppDisconnectionBanner isDisconnected={whatsappDisconnected} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-6">
              {/* Animated grid background */}
              <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

              {/* Content with fade-in animation */}
              <div className="relative animate-fadeIn">{children}</div>
            </div>
          </main>

          {/* Status bar */}
          <footer className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-2">
              <div className="flex items-center gap-4 font-mono text-xs text-zinc-500">
                <span>Auto-Prospect v1.0.0</span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <div className="font-mono text-xs text-zinc-600">
                {customFormatDate({
                  dateToFormat: getTodayDate(),
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </footer>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
        `}</style>
      </div>
    </SWRProvider>
  );
}
