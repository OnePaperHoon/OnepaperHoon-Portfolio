/**
 * English copy for /en. Keyed by work id (src/content/work/<id>.md).
 * Korean stays the source of truth; this is a short summary layer for visitors arriving from GitHub / npm.
 */
export type WorkEn = { kind: string; summary: string; paper: string };

export const worksEn: Record<string, WorkEn> = {
  feedline: {
    kind: "Live directory",
    summary: "A live directory that brings Korean and international marketing RSS feeds, their original sources, daily briefings and source health into one reading system.",
    paper: "Today's flow first, trustworthy originals always.",
  },
  "roulette-side": {
    kind: "Idea slot machine",
    summary: "Cuts the time spent wondering what to build. Spin three reels (what · for whom · using what) and save the combination as a PNG card.",
    paper: "Deciding what to make should take seconds, not evenings.",
  },
  yenwatch: {
    kind: "Always-on monitor",
    summary: "A JPY/KRW exchange-rate monitor running 24/7 on a Raspberry Pi. One-minute data, shown quietly by editing a single Discord message instead of posting new ones.",
    paper: "Status must stay current without becoming noise.",
  },
  "claude-code-alert": {
    kind: "Developer tool",
    summary: "A cross-platform CLI that adds sound and toast notifications to Claude Code hook events. Windows and macOS. Interactive installer, preview before writing, clean uninstall.",
    paper: "A tool should speak only at the moment you need it.",
  },
  "codex-alert": {
    kind: "Developer tool",
    summary: "The same idea for OpenAI Codex CLI: sound and toast notifications on lifecycle hook events, with Codex's extra trust step handled.",
    paper: "Same promise, different host: notify once, stay quiet otherwise.",
  },
  lyrcing: {
    kind: "Desktop app",
    summary: "A Windows lyric visualizer that draws whatever you are playing as beat-synced scenes: constellations, magazine, handwriting, falling letters. Follows any player.",
    paper: "Lyrics are not text to read but a picture moving at the song's speed.",
  },
  sobok: {
    kind: "3D snow map",
    summary: "Snow on the ground now (observations) stitched to snow to come (forecast) from Korea Meteorological Administration data, shown as a nationwide toy diorama and neighborhood-level 3D maps.",
    paper: "Snow is not a number; it is a surface that piles up differently in every neighborhood.",
  },
};

export const statusEn = { live: "Live", shipped: "Shipped", wip: "In progress" } as const;
