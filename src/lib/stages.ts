export type LeadStatus = "awaiting_verification" | "processing" | "in_review" | "delivered";
export type FileStage = "not_started" | "received" | "transcribing" | "analysing" | "analysed" | "failed" | "rejected";

const FILE_LABELS: Record<FileStage, string> = {
  not_started: "Waiting to start",
  received: "Received",
  transcribing: "Transcribing",
  analysing: "Analysing",
  analysed: "Analysed, waiting for review",
  failed: "Could not be analysed",
  rejected: "Rejected",
};

export function fileLabel(stage: FileStage, uploaded: boolean): string {
  if (!uploaded && stage === "not_started") return "Not uploaded";
  return FILE_LABELS[stage] ?? stage;
}

export const isBad = (s: FileStage) => s === "failed" || s === "rejected";
