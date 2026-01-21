export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight text-zinc-100">
            Dashboard
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">
            Welcome back to Auto-Prospect
          </p>
        </div>
      </div>

      {/* Test content card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="font-mono text-xl font-semibold text-zinc-100">
          Layout Test
        </h2>
        <p className="mt-2 text-zinc-400">
          This is a test page to verify the app shell layout is working correctly with:
        </p>
        <ul className="mt-4 space-y-2 text-zinc-400">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Dark theme with amber accents
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Responsive sidebar (collapsible on mobile)
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Header with user menu and org switcher
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Navigation with active state styling
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Auth guard protecting routes
          </li>
        </ul>
      </div>
    </div>
  );
}
