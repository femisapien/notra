import {
  SITE_BUILD_LOG_FRAME_FOLD_MIN,
  SITE_BUILD_LOG_NOISE_FOLD_MIN,
  SITE_BUILD_LOG_NOISE_KEEP,
} from "@/constants/sites";
import type {
  SiteBuildLogEntry,
  SiteBuildLogLine,
  SiteBuildLogTagParts,
  SiteBuildLogTone,
} from "@/types/sites";
import { stripAnsi } from "@/utils/site-deployments";

/** Astro and the Notra builder start lines with `HH:MM:SS`. */
const TIMESTAMP_PREFIX = /^(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?) (.*)$/;
const ERROR_LINE = /\[error\]|\berror\b|\bERR!|✘|✖/i;
const WARNING_LINE = /\[warn\]|\bwarn(?:ing)?\b/i;
const SUCCESS_LINE = /[✓✔]/;
/** Code frames and hints that tools print under a warning or error. */
const CONTINUATION_LINE = /^[\s│╭╰─┬┴├└┌]/;
const LINE_BREAK = /\r?\n/;

function toneOf(text: string): SiteBuildLogTone {
  if (ERROR_LINE.test(text)) {
    return "error";
  }
  if (WARNING_LINE.test(text)) {
    return "warning";
  }
  if (SUCCESS_LINE.test(text)) {
    return "success";
  }
  return "default";
}

/** Splits a raw build log into display lines: ANSI stripped, timestamps split off, tones detected. */
export function parseBuildLog(log: string): SiteBuildLogLine[] {
  const rawLines = stripAnsi(log).replace(/\s+$/, "").split(LINE_BREAK);
  const lines: SiteBuildLogLine[] = [];
  let blockTone: SiteBuildLogTone = "default";
  for (const [index, raw] of rawLines.entries()) {
    const match = TIMESTAMP_PREFIX.exec(raw);
    const timestamp = match?.[1] ?? null;
    const text = match ? (match[2] ?? "") : raw;
    const insideBlock: boolean =
      blockTone !== "default" &&
      timestamp === null &&
      text.trim().length > 0 &&
      CONTINUATION_LINE.test(text);
    const tone: SiteBuildLogTone = insideBlock ? blockTone : toneOf(text);
    if (!insideBlock) {
      blockTone = tone === "warning" || tone === "error" ? tone : "default";
    }
    lines.push({
      number: index + 1,
      timestamp,
      text,
      tone,
      continued: insideBlock,
    });
  }
  return lines;
}

export function countLogLines(
  lines: readonly SiteBuildLogLine[],
  tone: SiteBuildLogTone
): number {
  let count = 0;
  for (const line of lines) {
    if (line.tone === tone && !line.continued) {
      count += 1;
    }
  }
  return count;
}

/** Case-insensitive match ranges of `query` in `text`. */
export function findMatches(
  text: string,
  query: string
): Array<[start: number, end: number]> {
  if (!query) {
    return [];
  }
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let from = haystack.indexOf(needle);
  while (from !== -1) {
    ranges.push([from, from + needle.length]);
    from = haystack.indexOf(needle, from + needle.length);
  }
  return ranges;
}

/** Route trees and stack frames: useful once, noise at length. */
const NOISE_LINE = /^\s*(?:[├└│]|at\s)/;
/** A tool tag such as `[build]` or `[vite]` at the start of a line. */
const TAG_PREFIX = /^(\[[\w:@/-]+\])\s?(.*)$/;
const CLOCK = /^(\d{2}):(\d{2}):(\d{2})/;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

const STACK_FRAME = /^\s+at\s/;

/** The lines from `start` on that match, up to the first that doesn't. */
function takeRun(
  lines: readonly SiteBuildLogLine[],
  start: number,
  matches: (line: SiteBuildLogLine) => boolean
): SiteBuildLogLine[] {
  const run: SiteBuildLogLine[] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (!(line && matches(line))) {
      break;
    }
    run.push(line);
  }
  return run;
}

function lineEntries(lines: readonly SiteBuildLogLine[]): SiteBuildLogEntry[] {
  return lines.map((line) => ({ kind: "line", line }));
}

function foldEntry(
  lines: SiteBuildLogLine[],
  tone: SiteBuildLogTone
): SiteBuildLogEntry {
  return { kind: "fold", id: `fold-${lines[0]?.number}`, lines, tone };
}

const isStackFrame = (line: SiteBuildLogLine) => STACK_FRAME.test(line.text);

/** Keeps an error's message and hints; three or more stack frames fold after the first. */
function foldStackFrames(
  run: readonly SiteBuildLogLine[]
): SiteBuildLogEntry[] {
  const entries: SiteBuildLogEntry[] = [];
  let index = 0;
  while (index < run.length) {
    const line = run[index];
    if (!line) {
      break;
    }
    if (!isStackFrame(line)) {
      entries.push({ kind: "line", line });
      index += 1;
      continue;
    }
    const frames = takeRun(run, index, isStackFrame);
    index += frames.length;
    const rest = frames.slice(1);
    entries.push(
      { kind: "line", line },
      ...(rest.length >= SITE_BUILD_LOG_FRAME_FOLD_MIN - 1
        ? [foldEntry(rest, "error")]
        : lineEntries(rest))
    );
  }
  return entries;
}

/**
 * Folds the noise in a build log: code frames under warnings and errors,
 * and long runs of route trees or stack frames (the first two lines stay).
 */
export function groupBuildLog(
  lines: readonly SiteBuildLogLine[]
): SiteBuildLogEntry[] {
  const entries: SiteBuildLogEntry[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line) {
      break;
    }
    if (line.continued) {
      const run = takeRun(lines, index, (candidate) => candidate.continued);
      index += run.length;
      if (line.tone === "error") {
        // An error's frame is the point of the log: keep it, fold only its stack.
        entries.push(...foldStackFrames(run));
      } else if (run.length >= SITE_BUILD_LOG_FRAME_FOLD_MIN) {
        entries.push(foldEntry(run, line.tone));
      } else {
        entries.push(...lineEntries(run));
      }
      continue;
    }
    if (NOISE_LINE.test(line.text)) {
      const run = takeRun(
        lines,
        index,
        (candidate) => !candidate.continued && NOISE_LINE.test(candidate.text)
      );
      index += run.length;
      const kept =
        run.length > SITE_BUILD_LOG_NOISE_FOLD_MIN
          ? SITE_BUILD_LOG_NOISE_KEEP
          : run.length;
      entries.push(...lineEntries(run.slice(0, kept)));
      if (kept < run.length) {
        entries.push(foldEntry(run.slice(kept), "default"));
      }
      continue;
    }
    entries.push({ kind: "line", line });
    index += 1;
  }
  return entries;
}

/** Splits `[build] Collecting…` into its tool tag and the message. */
export function splitLogTag(text: string): SiteBuildLogTagParts {
  const match = TAG_PREFIX.exec(text);
  return match
    ? { tag: match[1] ?? null, rest: match[2] ?? "" }
    : { tag: null, rest: text };
}

function clockSeconds(timestamp: string): number | null {
  const match = CLOCK.exec(timestamp);
  if (!match) {
    return null;
  }
  return (
    Number(match[1]) * SECONDS_PER_HOUR +
    Number(match[2]) * SECONDS_PER_MINUTE +
    Number(match[3])
  );
}

/**
 * Seconds since the first timestamped line, as `m:ss`, only where it changes:
 * the log reads against the build's own clock instead of a wall of times.
 */
export function logOffsets(
  lines: readonly SiteBuildLogLine[]
): Map<number, string> {
  const offsets = new Map<number, string>();
  let start: number | null = null;
  let previous: string | null = null;
  for (const line of lines) {
    const seconds = line.timestamp ? clockSeconds(line.timestamp) : null;
    if (seconds === null) {
      continue;
    }
    start ??= seconds;
    let elapsed = seconds - start;
    if (elapsed < 0) {
      elapsed += SECONDS_PER_DAY;
    }
    const minutes = Math.floor(elapsed / SECONDS_PER_MINUTE);
    const rest = String(elapsed % SECONDS_PER_MINUTE).padStart(2, "0");
    const label = `${minutes}:${rest}`;
    if (label !== previous) {
      offsets.set(line.number, label);
      previous = label;
    }
  }
  return offsets;
}
