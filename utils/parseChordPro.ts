/**
 * parseChordPro.ts — Pure client-side ChordPro file parser
 *
 * Parses the ChordPro format (SongSelect .cho / .chordpro / .chopro / .txt)
 * and extracts all structured metadata from directive tags.
 *
 * ChordPro directive syntax:  {key: value}
 * ChordPro chord syntax:      [Chord]
 * ChordPro comment/section:   {comment: Label}
 *
 * This parser is intentionally lenient — it will always return a result
 * object even if the file is malformed. Callers should check `title` for
 * a meaningful result.
 *
 * Supported directives:
 *   title (t)         artist (a)     subtitle      key
 *   tempo             time           capo
 *   ccli_license      ccli           copyright     footer
 *   comment (c)       verse          chorus        bridge
 *
 * Reference: https://www.chordpro.org/chordpro/chordpro-directives/
 */

export interface ParsedChordPro {
  /** Song title from {title:} directive. */
  title: string;
  /**
   * Artists split from {artist:} — ChordPro uses comma-separated values
   * for multiple contributors.
   */
  artist: string[];
  /** Subtitle / recording info from {subtitle:}. */
  subtitle?: string;
  /** Key from {key:}, e.g. "Eb". */
  key?: string;
  /** Tempo in BPM from {tempo:}. */
  tempo?: number;
  /** Time signature from {time:}, e.g. "4/4". */
  timeSignature?: string;
  /** Capo position from {capo:}. */
  capoPosition?: number;
  /** CCLI Song Number from {ccli:}. */
  ccliNumber?: string;
  /** Copyright statement from {copyright:}. */
  copyright?: string;
  /** Footer line from {footer:}. Typically the SongSelect terms notice. */
  footer?: string;
  /**
   * Plain-text lyrics extracted from all lyric lines (chord markers
   * stripped). Each section is separated by a blank line.
   */
  lyrics: string;
  /**
   * The full raw ChordPro content, preserved verbatim so the backend can
   * re-render chords in any key via transposition.
   */
  chordPro: string;
  /**
   * Ordered section labels extracted from {comment:} / {c:} directives,
   * e.g. ["Intro", "Verse 1", "Chorus 1", "Bridge", "Outro"].
   */
  sections: string[];
  /**
   * Suggested themes based on keyword frequency analysis of the parsed lyrics.
   */
  themes: string[];
  /**
   * Deterministic timeline sections calculated by AI/backend enrichment.
   */
  timeline?: { label: string; startTime: number }[];
  /**
   * Associated media items (e.g. YouTube tracks) found during enrichment.
   */
  media?: {
    id: string;
    type: string;
    role: string;
    url: string;
    title: string;
    thumbnail?: string;
  }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Match a ChordPro directive of the form `{name: value}` or `{name}`.
 * The name is case-insensitive and may use the abbreviated form.
 */
function matchDirective(line: string, ...names: string[]): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  const inner = trimmed.slice(1, -1);
  const colonIdx = inner.indexOf(":");
  if (colonIdx === -1) {
    // Bare directive — {chorus}, {verse} etc. — not a key-value pair.
    const name = inner.trim().toLowerCase();
    return names.includes(name) ? "" : null;
  }
  const name = inner.slice(0, colonIdx).trim().toLowerCase();
  const value = inner.slice(colonIdx + 1).trim();
  return names.includes(name) ? value : null;
}

/**
 * Strip all chord markers [Chord] from a line, returning clean plain text.
 *
 * ChordPro files from SongSelect use two conventions that leave artifacts
 * after chord removal:
 *
 * 1. Mid-word chord placement leaves excess whitespace:
 *    "You [Eb/G]have" → "You have" ✓  (space already present before bracket)
 *
 * 2. Syllable-extension dashes mark chord changes inside a word:
 *    "au   -   [Bb]thori   -   [Ab]ty" → after chord removal → "au   -   thori   -   ty"
 *    We rejoin these into the natural word: "authority"
 *
 * 3. Pipe-bar tablature notation: [|][Ab] — pipes removed entirely.
 */
function stripChords(line: string): string {
  return (
    line
      // Remove chord markers [Chord] — e.g. [Ab], [Eb/G], [Bb/D]
      // We only remove brackets that are NOT obviously structural headers.
      // (Structural headers shouldn't be here since they are handled before stripChords, but just in case)
      .replace(
        /\[(?!(?:Verse|Chorus|Bridge|Pre-Chorus|Tag|Outro|Intro|Interlude|Ending)\b)[^\]]+\]/gi,
        "",
      )
      // Remove bare pipe characters (tab/intro bar notation)
      .replace(/\|/g, "")
      // Remove syllable-extension dashes: one or more hyphens surrounded by
      // whitespace on both sides — e.g. "   -   " or " - " used to show
      // where a chord lands inside a syllable. Join the syllable parts directly
      // (empty replacement) so "au   -   thori   -   ty" → "authority".
      .replace(/\s+-+\s*/g, "")
      // Collapse any multi-space runs left by chord removal into a single space
      .replace(/ {2,}/g, " ")
      .trim()
  );
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse a ChordPro file string and extract structured song data.
 *
 * @param content  Raw text content of the ChordPro file.
 * @returns        A `ParsedChordPro` object. Always returns a result — even
 *                 on malformed input the object will be populated to the
 *                 extent possible.
 */
export function parseChordPro(content: string): ParsedChordPro {
  const result: ParsedChordPro = {
    title: "",
    artist: [],
    lyrics: "",
    chordPro: content,
    sections: [],
    themes: [],
  };

  const lines = content.split(/\r?\n/);
  const lyricLines: string[] = [];
  let currentSectionLines: string[] = [];
  let inSection = false;
  let inTrailingBlock = false;

  const flushSection = () => {
    if (currentSectionLines.length > 0) {
      lyricLines.push(...currentSectionLines, "");
      currentSectionLines = [];
    }
    inSection = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // ── Directives ───────────────────────────────────────────────────────────

    // title / t
    const titleVal = matchDirective(trimmed, "title", "t");
    if (titleVal !== null) {
      result.title = titleVal;
      continue;
    }

    // artist / a — may contain multiple artists separated by ", "
    const artistVal = matchDirective(trimmed, "artist", "a", "author");
    if (artistVal !== null) {
      result.artist = artistVal
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      continue;
    }

    // subtitle
    const subtitleVal = matchDirective(trimmed, "subtitle", "st");
    if (subtitleVal !== null) {
      result.subtitle = subtitleVal;
      continue;
    }

    // key
    const keyVal = matchDirective(trimmed, "key");
    if (keyVal !== null) {
      result.key = keyVal;
      continue;
    }

    // tempo
    const tempoVal = matchDirective(trimmed, "tempo");
    if (tempoVal !== null) {
      const bpm = parseInt(tempoVal, 10);
      if (!isNaN(bpm) && bpm >= 20 && bpm <= 400) {
        result.tempo = bpm;
      }
      continue;
    }

    // time (time signature)
    const timeVal = matchDirective(trimmed, "time");
    if (timeVal !== null) {
      result.timeSignature = timeVal;
      continue;
    }

    // capo
    const capoVal = matchDirective(trimmed, "capo");
    if (capoVal !== null) {
      const capo = parseInt(capoVal, 10);
      if (!isNaN(capo) && capo >= 0 && capo <= 12) {
        result.capoPosition = capo;
      }
      continue;
    }

    // ccli song number ({ccli:} or {ccli_song:})
    const ccliVal = matchDirective(trimmed, "ccli", "ccli_song", "song_ccli");
    if (ccliVal !== null) {
      result.ccliNumber = ccliVal;
      continue;
    }

    // ccli_license — the church's SongSelect license number, NOT the song CCLI #.
    // Silently consume this directive so it doesn't fall through to lyrics.
    const licenseVal = matchDirective(trimmed, "ccli_license", "cclinumber");
    if (licenseVal !== null) {
      // Intentionally not stored — this is the church's license, not the song #.
      continue;
    }

    // copyright
    const copyrightVal = matchDirective(trimmed, "copyright");
    if (copyrightVal !== null) {
      result.copyright = copyrightVal;
      continue;
    }

    // footer — SongSelect terms notice; store for display but skip in lyrics
    const footerVal = matchDirective(trimmed, "footer");
    if (footerVal !== null) {
      result.footer = footerVal;
      continue;
    }

    // themes / theme
    const themesVal = matchDirective(trimmed, "themes", "theme");
    if (themesVal !== null) {
      result.themes.push(
        ...themesVal
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      );
      continue;
    }

    // comment / c — section label (Intro, Verse 1, Chorus, Bridge, …)
    const commentVal = matchDirective(trimmed, "comment", "c");
    if (commentVal !== null) {
      flushSection();
      result.sections.push(commentVal);
      // Emit section header into lyrics
      lyricLines.push(`[${commentVal}]`);
      inSection = true;
      continue;
    }

    // verse / chorus / bridge / tag / outro — bare structural directives
    const structVal = matchDirective(
      trimmed,
      "verse",
      "chorus",
      "bridge",
      "tag",
      "intro",
      "outro",
      "start_of_verse",
      "sov",
      "start_of_chorus",
      "soc",
      "start_of_bridge",
      "sob",
      "end_of_verse",
      "eov",
      "end_of_chorus",
      "eoc",
      "end_of_bridge",
      "eob",
    );
    if (structVal !== null) {
      // These directives delimit sections; handle structural markers
      if (
        trimmed.startsWith("{start") ||
        trimmed.startsWith("{sov") ||
        trimmed.startsWith("{soc") ||
        trimmed.startsWith("{sob")
      ) {
        flushSection();
        inSection = true;
      } else if (
        trimmed.startsWith("{end") ||
        trimmed.startsWith("{eov") ||
        trimmed.startsWith("{eoc") ||
        trimmed.startsWith("{eob")
      ) {
        flushSection();
      }
      continue;
    }

    // ── All other directives — skip ───────────────────────────────────────────
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) continue;

    // Sometimes .txt exports include "Key - Eb | Tempo - 72 | Time - 4/4"
    if (
      trimmed.includes("Key -") ||
      trimmed.includes("Tempo -") ||
      trimmed.includes("Time -")
    ) {
      const parts = trimmed.split("|");
      for (const part of parts) {
        const p = part.trim();
        if (p.startsWith("Key -")) result.key = p.replace("Key -", "").trim();
        else if (p.startsWith("Tempo -"))
          result.tempo = parseInt(p.replace("Tempo -", "").trim(), 10);
        else if (p.startsWith("Time -"))
          result.timeSignature = p.replace("Time -", "").trim();
      }
      continue;
    }

    // ── Plain text header parsing (.txt exports or loose ChordPro) ───────────
    // Some files use plain text headers before lyrics, e.g. "Title: My Song"
    const headerMatch = trimmed.match(
      /^(Title|Artist|Author|Key|Tempo|Time(?: Signature)?|CCLI(?: Song #)?|Copyright)[\s:-]+(.*)$/i,
    );
    // Only capture these if we haven't hit a section/lyrics yet to avoid false positives inside lyrics
    if (headerMatch && !inSection && lyricLines.length < 5) {
      const key = headerMatch[1].toLowerCase();
      const val = headerMatch[2].trim();
      if (key === "title" && !result.title) result.title = val;
      else if (
        (key === "artist" || key === "author") &&
        result.artist.length === 0
      ) {
        result.artist = val
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
      } else if (key === "key" && !result.key) result.key = val;
      else if (key === "tempo" && !result.tempo) {
        const bpm = parseInt(val, 10);
        if (!isNaN(bpm)) result.tempo = bpm;
      } else if (key.startsWith("time") && !result.timeSignature)
        result.timeSignature = val;
      else if (key.startsWith("ccli") && !result.ccliNumber)
        result.ccliNumber = val;
      else if (key === "copyright" && !result.copyright) result.copyright = val;
      continue;
    }

    // Bracketed section headers like [Verse 1]
    const bracketSectionMatch = trimmed.match(
      /^\[(Verse|Chorus|Bridge|Pre-Chorus|Tag|Outro|Intro|Interlude|Ending)[^\]]*\]$/i,
    );
    if (bracketSectionMatch) {
      flushSection();
      const sectionName = trimmed.slice(1, -1).trim();
      result.sections.push(sectionName);
      lyricLines.push(trimmed);
      inSection = true;
      continue;
    }

    // ── Trailing CCLI block lines (plain text footer at EOF) ─────────────────
    // SongSelect appends plain-text attribution lines at the end of the file
    // after the directives. These start with "CCLI Song #" or "©" or
    // "For use solely with". We skip them to keep lyrics clean.
    if (
      /^CCLI Song #/.test(trimmed) ||
      /^CCLI License #/.test(trimmed) ||
      /^©/.test(trimmed) ||
      /^For use solely/.test(trimmed) ||
      /^www\.ccli\.com/.test(trimmed)
    ) {
      inTrailingBlock = true;
      // Capture the song number from the trailing block if not already set
      const ccliMatch = trimmed.match(/^CCLI Song #\s*(\d+)/);
      if (ccliMatch && !result.ccliNumber) {
        result.ccliNumber = ccliMatch[1];
      }
      // Capture copyright from the trailing block if not already set
      if (/^©/.test(trimmed) && !result.copyright) {
        result.copyright = trimmed;
      }
      continue;
    }

    // If we are in the trailing block, keep consuming non-empty lines
    if (inTrailingBlock) {
      if (trimmed !== "") {
        // Catch wrapped copyright continuations
        if (!trimmed.includes("[")) {
          if (result.copyright && !result.copyright.includes(trimmed)) {
            result.copyright += " " + trimmed;
          }
        }
        continue;
      } else {
        inTrailingBlock = false;
      }
    }

    // ── Lyric / chord lines ───────────────────────────────────────────────────
    if (trimmed === "") {
      // Blank line — section separator
      if (currentSectionLines.length > 0) {
        lyricLines.push(...currentSectionLines, "");
        currentSectionLines = [];
      } else {
        // Preserve blank lines between sections in lyrics
        lyricLines.push("");
      }
    } else {
      const text = stripChords(trimmed);
      if (text) {
        // Non-empty after stripping chords — it's a lyric line
        if (inSection) {
          currentSectionLines.push(text);
        } else {
          lyricLines.push(text);
        }
      }
      // Pure chord-only lines (empty after stripping) are intentionally dropped
      // from the lyrics text — they convey no lyrical content.
    }
  }

  // Flush any remaining section lines
  if (currentSectionLines.length > 0) {
    lyricLines.push(...currentSectionLines);
  }

  // Trim trailing blank lines and join
  result.lyrics = lyricLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Deduplicate any explicit themes
  result.themes = Array.from(new Set(result.themes));

  return result;
}
