import { API_BASE } from "./config";
import type { FileStage, LeadStatus } from "./stages";

const BASE = `${API_BASE}/public`;
const KEY = "voxmith.lead.token";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const getToken = (): string | null => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t: string) => { try { localStorage.setItem(KEY, t); } catch { /* private mode: link still works */ } };
export const clearToken = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

export type Limits = { max_files: number; max_file_mb: number; max_call_minutes: number; types: string[] };
export type LeadFile = { file_id: string; filename: string; size_bytes: number; uploaded: boolean; stage: FileStage; reason: string | null };
export type Status = {
  status: LeadStatus; email: string; company: string; expected_delivery: string;
  delivered_at: string | null; keep_consent: boolean; files: LeadFile[];
};
export type Presign = { file_id: string; upload_url: string; method: "PUT"; headers: Record<string, string>; expires_in_seconds: number };

const FALLBACK: Record<number, string> = {
  400: "That didn't work. Please check and try again.",
  404: "We couldn't find this submission.",
  409: "That isn't possible right now. Please try again.",
  410: "This has expired.",
  422: "Please check the details you entered.",
  429: "Too many attempts. Please wait a little and try again.",
  503: "We're busy right now. Please try again in a while.",
};

/** Human message from an error response: the API's `detail` string if it has one, never raw JSON. */
export function messageFor(status: number, body: unknown): string {
  const d = (body as { detail?: unknown } | null)?.detail;
  if (typeof d === "string" && d) return d;
  return FALLBACK[status] ?? "Something went wrong on our side. Please try again in a moment.";
}

async function req<T>(path: string, method: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers["X-Lead-Token"] = getToken() ?? "";
  let res: Response;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, messageFor(res.status, data));
  return data as T;
}

export const api = {
  async createLead(b: { name: string; email: string; company: string; agent_description?: string; consent_analyse: true; consent_keep: boolean; turnstile_token: string }) {
    const r = await req<{ token: string; limits: Limits }>("/leads", "POST", b, false);
    setToken(r.token);
    return r;
  },
  createFile: (filename: string, size_bytes: number) => req<Presign>("/lead/files", "POST", { filename, size_bytes }),
  refreshUrl: (id: string) => req<Presign>(`/lead/files/${id}/url`, "POST"),
  completeFile: (id: string) => req<{ uploaded: true }>(`/lead/files/${id}/complete`, "POST"),
  deleteFile: (id: string) => req<void>(`/lead/files/${id}`, "DELETE"),
  verify: (code: string) => req<{ verified: true }>("/lead/verify", "POST", { code }),
  resend: (turnstile_token: string) => req<{ sent: true }>("/lead/resend", "POST", { turnstile_token }),
  status: () => req<Status>("/lead/status", "GET"),
  deleteLead: () => req<void>("/lead", "DELETE"),
};

/** PUT raw bytes with exactly the headers the server signed. XHR for upload progress. */
export function putFile(p: Presign, file: File, onProgress: (frac: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", p.upload_url);
    for (const [k, v] of Object.entries(p.headers)) x.setRequestHeader(k, v);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new ApiError(x.status, "The upload was refused. Please retry.")));
    x.onerror = () => reject(new ApiError(0, "The upload was interrupted. Please retry."));
    signal.addEventListener("abort", () => { x.abort(); reject(new ApiError(0, "Cancelled.")); });
    x.send(file);
  });
}
