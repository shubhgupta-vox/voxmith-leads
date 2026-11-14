// ONE source for the /groundhog page copy. The sample card is built from SAMPLE below, which mirrors step 6 of
// voxmith-env/GROUNDHOG_SPEC.md (made-up data). Change it here and the card follows.

// The owner must confirm this address (privacy contact and "Contact us"). One place only.
export const CONTACT_EMAIL = "hello@voxmith.com";
export const APP_URL = "https://app.voxmith.com";

/** Character-identical to the sentence in SKILL.md and the README. */
export const DISCLOSURE = "Groundhog tells VoxMith that you ran it, with your account email and a count. It never sends your chats or what you said.";
export const PRIVACY_SHORT = "Your chats never leave your machine. VoxMith only gets a run count and the account that ran it. Turn it off any time: /groundhog off.";

export const PRIVACY_LIST: string[] = [
  "Groundhog reads your Claude Code history on your own computer. The grouping step is done by this same Claude session, which already sees your conversation. Your chats and the instructions it finds are never sent to VoxMith.",
  "Each time you run it, Groundhog sends VoxMith: the Groundhog version, how many times you have run it, the email of the account that ran it (your Claude Code account email, or your git email if there is none), one number (how many times your top instruction came up), which scope you chose (session, project or all), and a random install ID.",
  DISCLOSURE,
  "We use it to count how many people use Groundhog.",
  "Turn it off: /groundhog off, or set GROUNDHOG_NO_PING=1.",
  `To have your data deleted, email ${CONTACT_EMAIL}.`,
];

export const INSTALL = {
  plugin: [
    { which: "marketplace_add" as const, cmd: "/plugin marketplace add VoxMith/groundhog" },
    { which: "install" as const, cmd: "/plugin install groundhog@voxmith" },
  ],
  curl: "mkdir -p ~/.claude/skills && curl -fsSL https://github.com/VoxMith/groundhog/archive/refs/heads/main.tar.gz | tar -xz --strip-components=2 -C ~/.claude/skills groundhog-main/skills/groundhog",
};

export const TOO_OLD = "Needs a recent Claude Code. In a terminal run: claude update. Or use the 'just /groundhog' install, which works on older versions.";

export const BAR_BLOCKS = 20;
/** Spec rule: bar length = count / top count x 20 blocks, rounded, at least 1. */
export const barLen = (count: number, top: number) => Math.max(1, Math.round((count / top) * BAR_BLOCKS));
export const bar = (n: number) => "█".repeat(n);

/** Every command and option the skill accepts (skills/groundhog/SKILL.md). Plugin users type
 * /groundhog:groundhog, plain-install users type /groundhog: the words after it are the same. */
export const COMMANDS: { cmd: string; what: string }[] = [
  { cmd: "", what: "Asks what to check: all your sessions (recommended), this project only, or this session only." },
  { cmd: " all", what: "Check every session on this computer. Skips the question." },
  { cmd: " project", what: "Only the sessions of the project you're in." },
  { cmd: " session", what: "Only the session you're in now." },
  { cmd: " 30", what: "Only the last 30 days (any number works; default is 90). Mix with a scope: all 30." },
  { cmd: " status", what: "Shows exactly what Groundhog sends to VoxMith, and whether that's on." },
  { cmd: " off", what: "Stops telling VoxMith anything. Remembered. The scan still works." },
  { cmd: " on", what: "Turns it back on." },
];

export const SAMPLE = {
  since: "Sep 18",
  count: 23,
  quote: "Don't add comments to code I didn't ask you about",
  told: "Told 23 times across 4 projects since Sep 18 (last: Nov 12, 2 days ago).",
  sessions: "That's 14 sessions out of 212.",
  cost: { minutes: 12, messages: 46, detail: "(23 from you, 23 replies you didn't need)", assumption: "Assumes 30 seconds each time you repeated yourself and one redo reply from the agent. Your real number could be higher or lower." },
  weekly: { range: "Week by week, Sep 15 to Nov 10:", spark: "▁▃▄▅█▂▁·▁", peak: "peak: week of Oct 13, 6 times" },
  top: [
    ["Don't add comments I didn't ask for", 23, 14], ["Use the existing helper, don't write a new one", 19, 12], ["Don't use `any`", 14, 9],
    ["Keep answers short", 11, 8], ["Run the tests before saying it's done", 8, 6], ["Ask before deleting files", 6, 5],
    ["Use pnpm, not npm", 5, 4], ["Don't restart the dev server", 4, 4], ["Show me the diff before committing", 4, 3], ["Stop apologising", 3, 3],
  ] as [string, number, number][],
  // Blocks are written out as in the spec (the spec does not give a formula for this section).
  projects: [["my-app", 12, 11], ["billing-api", 7, 7], ["docs-site", 3, 3], ["scripts", 2, 2]] as [string, number, number][],
  lines: [
    "Do not add code comments unless I ask for them.",
    "Reuse existing helpers before writing new ones.",
    "Never use the TypeScript type any; use a specific type or unknown.",
    "Keep answers short.",
    "Run the tests before saying a task is done.",
  ],
};
