import { type ReactNode, Suspense, lazy, useEffect } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Start from "./pages/Start";

// Staff pages (and Clerk) load only when someone opens /staff, so the public bundle stays small.
const Staff = lazy(() => import("./staff/Staff"));
const Groundhog = lazy(() => import("./pages/Groundhog"));
const Burn = lazy(() => import("./pages/Burn"));
const BurnLeaderboard = lazy(() => import("./pages/BurnLeaderboard"));

/** A new page starts at the top (the router keeps the old scroll position otherwise). In-page #links are left alone. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

const Page = ({ children }: { children: ReactNode }) => <div className="mx-auto w-full max-w-3xl px-4 py-8">{children}</div>;

function Public() {
  // The leaderboard's table is wider than the other pages; the header and footer line up with it there.
  const wide = useLocation().pathname.startsWith("/burn/leaderboard") ? "max-w-5xl" : "max-w-3xl";
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <header className="border-b border-slate-200 bg-white">
        <div className={`mx-auto flex ${wide} items-center gap-2 px-4 py-3 sm:gap-4`}>
          <Link to="/" aria-label="VoxMith home" className="shrink-0"><img src="/brand/wordmark.png" alt="VoxMith" width={185} height={28} className="h-5 w-auto sm:h-7" /></Link>
          <nav aria-label="Free tools" className="ml-auto flex min-w-0 flex-wrap justify-end gap-0.5 text-[13px] sm:gap-1 sm:text-sm">
            {[["Free analysis", "/analyze", "Analysis"], ["Burn", "/burn", "Burn"], ["Groundhog", "/groundhog", "Groundhog"]].map(([label, to, short]) => (
              <NavLink key={to} to={to} aria-label={label} className={({ isActive }) => `whitespace-nowrap rounded px-1.5 py-1.5 font-medium sm:px-2 ${isActive ? "bg-brand-50 text-brand-dark" : "text-slate-700 hover:bg-slate-100"}`}><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span></NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Landing />} />
          <Route path="/start" element={<Page><Start /></Page>} />
          <Route path="/groundhog" element={<Suspense fallback={<p className="p-8" role="status">Loading...</p>}><Groundhog /></Suspense>} />
          <Route path="/burn" element={<Suspense fallback={<p className="p-8" role="status">Loading...</p>}><Burn /></Suspense>} />
          <Route path="/burn/leaderboard" element={<Suspense fallback={<p className="p-8" role="status">Loading...</p>}><BurnLeaderboard /></Suspense>} />
          <Route path="/status" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Page><p>Page not found. <Link className="text-brand-dark underline" to="/">Go home</Link></p></Page>} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 py-5">
        <div className={`mx-auto flex ${wide} items-center justify-center gap-2 px-4 text-sm text-slate-600`}>
          <img src="/brand/mark.png" alt="" width={22} height={20} className="h-5 w-auto" />
          VoxMith: free tools for AI agent teams
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/staff/*" element={<Suspense fallback={<div className="grid min-h-screen place-items-center" role="status"><img src="/brand/mark.png" alt="VoxMith" width={64} height={58} className="h-14 w-auto animate-pulse" /></div>}><Staff /></Suspense>} />
      <Route path="*" element={<Public />} />
    </Routes>
    </>
  );
}
