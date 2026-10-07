import { Link, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Start from "./pages/Start";
import Status from "./pages/Status";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-brand">VoxMith</Link>
          <Link to="/status" className="text-sm text-slate-700 underline">Check my status</Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Start />} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<p>Page not found. <Link className="underline" to="/">Go home</Link></p>} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-600">VoxMith call analysis</footer>
    </div>
  );
}
