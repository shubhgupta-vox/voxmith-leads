// ONE source for the /burn page copy. SAMPLE is "an example result": the real output of burn.py
// (skills repo plugins/burn) on a made-up history (voxmith-env/BURN_BUILD_REPORT.md says how it was made).
import { CONTACT_EMAIL } from "./groundhogCopy";

/** Character-identical to state.py DISCLOSURE, SKILL.md and the README. */
export const DISCLOSURE = "Burn sends your end result (resolution rate, sessions judged, failed-session cost and cost per resolved session) with your account email to VoxMith and lists it on the public Burn leaderboard: analyze.voxmith.com/burn/leaderboard. It never sends your chats, prompts, file names or project names.";

export const PRIVACY_LIST: string[] = [
  "Burn reads your coding-agent history (Claude Code or Codex, whichever you run it in) on your own computer. A Python script does all the counting; no AI model reads your sessions for it, and nothing leaves your machine except the ping below.",
  "Each time you run it, Burn sends VoxMith: the Burn version, how many times you have run it, the email of the account that ran it (your Claude Code account email, or your git email if there is none), your resolution rate, how many sessions were judged and resolved, what your failed sessions cost and your cost per resolved session (at API prices), which agent (Claude Code or Codex), whether you checked the whole computer or one project, and a random install ID.",
  "Your email and end result appear on the public Burn leaderboard from the run after you first see this notice, once 20 sessions are judged. /burn off takes you off it.",
  DISCLOSURE,
  "Opt out any time: /burn off (also takes you off the leaderboard), or set BURN_NO_PING=1 or DO_NOT_TRACK=1.",
  `To have your data deleted, email ${CONTACT_EMAIL}.`,
];

export const INSTALL = {
  oneLine: "claude plugin install burn --marketplace VoxMith/groundhog",
  plugin: [
    { which: "marketplace_add" as const, cmd: "/plugin marketplace add VoxMith/groundhog" },
    { which: "install" as const, cmd: "/plugin install burn@voxmith" },
  ],
  /** Codex reads skills from ~/.agents/skills; same line as the skill README. */
  codex: "mkdir -p ~/.agents/skills && curl -fsSL https://github.com/VoxMith/groundhog/archive/refs/heads/main.tar.gz | tar -xz --strip-components=4 -C ~/.agents/skills groundhog-main/plugins/burn/skills/burn && mv ~/.agents/skills/burn/SKILL.codex.md ~/.agents/skills/burn/SKILL.md",
  curl: "mkdir -p ~/.claude/skills && curl -fsSL https://github.com/VoxMith/groundhog/archive/refs/heads/main.tar.gz | tar -xz --strip-components=4 -C ~/.claude/skills groundhog-main/plugins/burn/skills/burn",
};

/** Every word the skill accepts after the command (plugins/burn/skills/burn/SKILL.md). */
export const COMMANDS: { cmd: string; what: string }[] = [
  { cmd: "", what: "Checks every session on this computer, of the agent you run it in (Claude Code or Codex)." },
  { cmd: " project", what: "Only the sessions of the folder you're in." },
  { cmd: " status", what: "Shows exactly what Burn sends to VoxMith, and whether that's on." },
  { cmd: " off", what: "Stops telling VoxMith anything. Remembered. The scan still works." },
  { cmd: " on", what: "Turns it back on." },
];

export const RULES: [string, string][] = [
  ["Corrected", "You corrected the agent 2 or more times: a message like “no,”, “that's wrong”, “revert that” right after it answered. “No, that looks good” doesn't count, and pressing Esc alone doesn't either: the message you type after it decides."],
  ["Repeated yourself", "You gave the same instruction (a do or don't rule, or 5+ words) in 2 or more messages. Routine commands like “run the tests” don't count."],
  ["Gave up", "Your last message was “forget it”, “I'll do it myself” or “I'll handle this manually” (not “never mind, found it”), or a correction the agent never answered."],
];

export const SAMPLE = {
  agents: "Claude Code",
  rate: 61, resolved: 129, counted: 213,
  share: 49, burned: "$414.59", burnedTokens: "502.7M",
  perResolved: "$6.61",
  top: [
    ["Oct 9", "infra", "$22.90", "corrected x2", "Add upload retry"],
    ["Oct 11", "infra", "$21.21", "repeated yourself, gave up", "Sticky mobile header"],
    ["Oct 14", "my-app", "$19.39", "corrected x2", "Refactor auth middleware"],
  ] as [string, string, string, string, string][],
  tooShort: 16,
  historyStart: "Oct 5, 2026",
};
