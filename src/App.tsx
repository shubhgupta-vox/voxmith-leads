import { type ReactNode, Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Start from "./pages/Start";

// Staff pages (and Clerk) load only when someone opens /staff, so the public bundle stays small.
const Staff = lazy(() => import("./staff/Staff"));

const Page = ({ children }: { children: ReactNode }) => <div className="mx-auto w-full max-w-3xl px-4 py-8">{children}</div>;

function Public() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link to="/" aria-label="VoxMith home"><img src="/brand/wordmark.png" alt="VoxMith" width={185} height={28} className="h-7 w-auto" /></Link>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Page><Start /></Page>} />
          <Route path="/status" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Page><p>Page not found. <Link className="text-brand-dark underline" to="/">Go home</Link></p></Page>} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 text-sm text-slate-600">
          <img src="/brand/mark.png" alt="" width={22} height={20} className="h-5 w-auto" />
          VoxMith conversation analysis
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/staff/*" element={<Suspense fallback={<div className="grid min-h-screen place-items-center" role="status"><img src="/brand/mark.png" alt="VoxMith" width={64} height={58} className="h-14 w-auto animate-pulse" /></div>}><Staff /></Suspense>} />
      <Route path="*" element={<Public />} />
    </Routes>
  );
}
