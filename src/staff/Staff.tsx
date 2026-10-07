import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Button, ErrorNote } from "../components/ui";
import { ApiError } from "../lib/api";
import { CLERK_KEY } from "../lib/config";
import { type Me, setTokenGetter, staffApi } from "../lib/staffApi";
import Call from "./Call";
import Lead from "./Lead";
import Queue from "./Queue";

// Dev-only bypass: `VITE_STAFF_AUTH_STUB=1` skips Clerk and sends no token. `import.meta.env.DEV`
// is false in production builds, so the condition folds to false and this path is dropped.
const STUB = import.meta.env.DEV && import.meta.env.VITE_STAFF_AUTH_STUB === "1";

export const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext)!;

/** Loads data with human error wording; `reload` refetches without clearing what is shown. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => fn().then((d) => { setData(d); setError(null); }, (e: unknown) => setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.")), deps);
  useEffect(() => { setData(null); void reload(); }, [reload]);
  return { data, error, reload };
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/staff" className="text-lg font-bold text-brand">VoxMith <span className="font-normal text-slate-600">staff</span></Link>
          {STUB ? <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">dev auth stub</span> : <UserButton />}
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

/** Asks the API who we are: 403 = signed in but not on the allowlist. */
function Gate() {
  const { data: me, error, reload } = useLoad(() => staffApi.me(), []);
  const [denied, setDenied] = useState(false);
  useEffect(() => { if (error === "Staff only.") setDenied(true); }, [error]);
  if (denied) return (
    <Shell>
      <h1 className="text-2xl font-bold">You are not authorised for staff</h1>
      <p className="mt-2 max-w-prose">You are signed in, but your email address is not on the staff list. If you should have access, ask an admin to add it, then reload this page.</p>
      <p className="mt-2 max-w-prose text-sm text-slate-600">Admins: the session token must carry an <code>email</code> claim, and the address must be in <code>STAFF_EMAILS</code>.</p>
    </Shell>
  );
  if (error) return <Shell><ErrorNote>{error}</ErrorNote><Button className="mt-3" variant="secondary" onClick={() => void reload()}>Try again</Button></Shell>;
  if (!me) return <Shell><p role="status">Checking your access...</p></Shell>;
  return (
    <MeContext.Provider value={me}>
      <Shell>
        <Routes>
          <Route index element={<Queue />} />
          <Route path="leads/:id" element={<Lead />} />
          <Route path="calls/:cid" element={<Call />} />
          <Route path="*" element={<p>Page not found. <Link className="underline" to="/staff">Back to the queue</Link></p>} />
        </Routes>
      </Shell>
    </MeContext.Provider>
  );
}

function WithClerkToken() {
  const { getToken } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => { setTokenGetter(() => getToken()); setReady(true); }, [getToken]);
  return ready ? <Gate /> : null;
}

export default function Staff() {
  if (STUB) return <Gate />;
  if (!CLERK_KEY) return <Shell><ErrorNote>Staff sign-in is not configured: set VITE_CLERK_PUBLISHABLE_KEY and rebuild.</ErrorNote></Shell>;
  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/staff">
      <SignedOut>
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4">
          <h1 className="text-xl font-bold">VoxMith staff sign-in</h1>
          <SignIn routing="virtual" />
        </main>
      </SignedOut>
      <SignedIn><WithClerkToken /></SignedIn>
    </ClerkProvider>
  );
}
