export type LeadStatus = "awaiting_verification" | "processing" | "in_review" | "delivered";
export type FileStage = "not_started" | "received" | "transcribing" | "analysing" | "analysed" | "failed" | "rejected";

/** Honest wording per lead status. Never claims a report exists before `delivered`. */
export function leadMessage(status: LeadStatus, expected: string, anyAnalysed = true): { title: string; body: string } {
  switch (status) {
    case "awaiting_verification":
      return { title: "Confirm your email to start", body: "We only start analysing your calls after you confirm your email." };
    case "processing":
      return { title: "Analysing your calls", body: `Your calls are being transcribed and analysed. Nothing is ready to read yet. Expected ${expected}.` };
    case "in_review":
      if (!anyAnalysed) return { title: "We could not analyse your calls", body: "None of your calls could be analysed automatically, so there is no report to review. Details are listed below." };
      return { title: "A person is reviewing the analysis", body: `The automatic analysis is done and our team is checking it before anything is sent. Expected ${expected}.` };
    case "delivered":
      return { title: "Your report has been sent", body: "We emailed the PDF report to you. Check your inbox and spam folder." };
    default:
      return { title: "Status unknown", body: "We could not read the status of your submission. Try reloading." };
  }
}

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
