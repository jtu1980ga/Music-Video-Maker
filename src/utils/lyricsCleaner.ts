/**
 * Universal lyric line cleaner & timestamped lyric parser.
 * Removes hallucinated AI chatter, background noise annotations, and YouTube metadata,
 * leaving pure song lyrics and musical chord changes.
 */

export interface ParsedLyricLine {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
  section?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
  chords?: string[];
}

// Patterns of garbage, hallucinations, subtitles noise, and AI chatter that must be eliminated
const HALLUCINATION_PATTERNS: RegExp[] = [
  /subtitles by/i,
  /transcribed by/i,
  /sync by/i,
  /closed captions by/i,
  /thank you for watching/i,
  /thanks for watching/i,
  /please like and subscribe/i,
  /don't forget to subscribe/i,
  /visit our website/i,
  /copyright disclaimer/i,
  /all rights reserved/i,
  /amara\.org/i,
  /screencast/i,
  /automatic speech recognition/i,
  /whisper/i,
  /music playing/i,
  /cheering and applause/i,
  /applause/i,
  /laughter/i,
  /sighs/i,
  /screaming/i,
  /snickers/i,
  /groan/i,
  /cough/i,
  /silence/i,
  /unintelligible/i,
  /inaudible/i,
  /\[music\]/i,
  /\(music\)/i,
  /♪+/g,
  /♫+/g,
];

/**
 * Clean a single lyric string:
 * - strips unwanted sound effect brackets (unless they represent chords like (G))
 * - eliminates repetitive chatter
 * - normalizes whitespace and punctuation
 */
export function cleanLyricText(raw: string): string {
  if (!raw) return '';
  let text = String(raw).trim();

  // If the whole line is a known hallucination, eliminate it
  for (const pat of HALLUCINATION_PATTERNS) {
    if (pat.test(text)) {
      // If it's pure music symbols or pure subtitle attribution, clear
      text = text.replace(pat, '').trim();
    }
  }

  // Remove speaker labels like "Singer:", "Vocalist:", "Man:", "Narrator:"
  text = text.replace(/^(?:singer|vocalist|man|woman|narrator|person|vocal|lead):\s*/i, '');

  // Remove sound annotations in brackets like [Applause], [Upbeat music], [Guitar solo], etc.
  // BUT preserve chords like [G] or (G)
  text = text.replace(/\[(?![A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus\d?|\d)?(?:[\/\\][A-Ga-g][#b]?)?\])[^\]]{3,}\]/gi, '');

  // Remove timestamps that might be accidentally embedded inside text
  text = text.replace(/\[\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\]/g, '');
  text = text.replace(/\b\d{1,2}:\d{2}\b/g, '');

  // Normalize quotes and spaces
  text = text.replace(/[\u2018\u2019]/g, "'");
  text = text.replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Filter and clean an entire array of timestamped lines
 */
export function sanitizeLyricLines(lines: any[], totalDuration = 60): ParsedLyricLine[] {
  if (!Array.isArray(lines)) return [];

  const cleaned: ParsedLyricLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const rawText = typeof raw === 'string' ? raw : (raw.text || '');
    const cleanText = cleanLyricText(rawText);

    // Skip empty lines or pure punctuation
    if (!cleanText || /^[-—–._\s:;]+$/.test(cleanText)) {
      continue;
    }

    // Skip if line is just 1 single character (unless a single valid word like 'I' or 'A')
    if (cleanText.length === 1 && !/^[iaIA]$/.test(cleanText)) {
      continue;
    }

    let startTime = parseFloat(raw.startTime ?? raw.start) || 0;
    let endTime = parseFloat(raw.endTime ?? raw.end) || 0;

    if (endTime <= startTime) {
      endTime = Math.min(totalDuration, startTime + 3.5);
    }

    // Extract embedded chords like (G), (Em), [C]
    const chordMatches = cleanText.match(/(?:(?<=\()|\b)[A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus\d?|\d)?(?:[\/\\][A-Ga-g][#b]?)?(?=\))/g);
    const chords = chordMatches ? Array.from(new Set(chordMatches)) : undefined;

    // Detect section
    let section: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' = raw.section || 'verse';
    if (i === 0 && startTime > 4) section = 'intro';
    else if (i >= lines.length - 2) section = 'outro';

    cleaned.push({
      id: raw.id || `line-${cleaned.length + 1}`,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(endTime.toFixed(2)),
      text: cleanText,
      originalText: cleanText,
      section,
      chords,
    });
  }

  // Ensure times are chronologically ascending without negative spans
  for (let i = 0; i < cleaned.length; i++) {
    if (i > 0 && cleaned[i].startTime < cleaned[i - 1].startTime) {
      cleaned[i].startTime = parseFloat((cleaned[i - 1].endTime + 0.1).toFixed(2));
      cleaned[i].endTime = parseFloat((cleaned[i].startTime + 3.0).toFixed(2));
    }
  }

  return cleaned;
}

/**
 * Universal Parser for any external lyrics source:
 * - LRC files with timestamps: [00:14.20] Step one, you say...
 * - SRT subtitle files with timestamps: 00:00:14,200 --> 00:00:18,500 \n Step one...
 * - Tab/Chord sheets: (G) Step one, you say we (C) need to talk
 * - Plain lyrics from Genius, AZLyrics, Spotify, Google Lyrics (automatically spaced across duration)
 */
export function parseExternalLyrics(
  rawText: string,
  totalDuration = 76
): { lines: ParsedLyricLine[]; detectedFormat: string } {
  if (!rawText || !rawText.trim()) {
    return { lines: [], detectedFormat: 'empty' };
  }

  const text = rawText.trim();

  // 1. Check for SRT format: 00:00:12,000 --> 00:00:16,000
  if (text.includes('-->') && /\d{2}:\d{2}:\d{2}/.test(text)) {
    return {
      lines: parseSrtFormat(text, totalDuration),
      detectedFormat: 'SRT Subtitles',
    };
  }

  // 2. Check for LRC format: [01:23.45] or [01:23]
  if (/\[\d{1,2}:\d{2}(?:\.\d+)?\]/.test(text)) {
    return {
      lines: parseLrcFormat(text, totalDuration),
      detectedFormat: 'LRC Timestamped Lyrics',
    };
  }

  // 3. Plain lyrics or Chord-embedded lyrics from Genius, AZLyrics, Ultimate Guitar
  return {
    lines: parsePlainOrChordLyrics(text, totalDuration),
    detectedFormat: 'Plain / Chord Lyrics',
  };
}

function parseSrtFormat(srtContent: string, totalDuration: number): ParsedLyricLine[] {
  const blocks = srtContent.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const result: ParsedLyricLine[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const startTime = parseSrtTimestamp(startStr);
    const endTime = parseSrtTimestamp(endStr);

    const textLines = lines.filter((l) => !l.includes('-->') && !/^\d+$/.test(l));
    const rawText = textLines.join(' ');
    const cleanText = cleanLyricText(rawText);

    if (cleanText) {
      result.push({
        id: `line-${result.length + 1}`,
        startTime: parseFloat(startTime.toFixed(2)),
        endTime: parseFloat(Math.max(startTime + 0.5, endTime).toFixed(2)),
        text: cleanText,
        originalText: cleanText,
        section: result.length === 0 ? 'intro' : 'verse',
      });
    }
  }

  return sanitizeLyricLines(result, totalDuration);
}

function parseLrcFormat(lrcContent: string, totalDuration: number): ParsedLyricLine[] {
  const lines = lrcContent.replace(/\r\n/g, '\n').split('\n');
  const temp: { startTime: number; text: string }[] = [];

  for (const line of lines) {
    const timeMatch = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d+))?\]/);
    if (!timeMatch) continue;

    const mins = parseInt(timeMatch[1], 10);
    const secs = parseInt(timeMatch[2], 10);
    const ms = timeMatch[3] ? parseFloat(`0.${timeMatch[3]}`) : 0;
    const startTime = mins * 60 + secs + ms;

    const rawText = line.replace(/\[\d{1,2}:\d{2}(?:\.\d+)?\]/g, '').trim();
    const cleanText = cleanLyricText(rawText);

    if (cleanText) {
      temp.push({ startTime, text: cleanText });
    }
  }

  // Sort by startTime
  temp.sort((a, b) => a.startTime - b.startTime);

  const result: ParsedLyricLine[] = temp.map((item, idx) => {
    const nextItem = temp[idx + 1];
    const endTime = nextItem ? Math.max(item.startTime + 0.5, nextItem.startTime - 0.1) : Math.min(totalDuration, item.startTime + 4.0);

    return {
      id: `line-${idx + 1}`,
      startTime: parseFloat(item.startTime.toFixed(2)),
      endTime: parseFloat(endTime.toFixed(2)),
      text: item.text,
      originalText: item.text,
      section: idx === 0 && item.startTime > 3 ? 'intro' : 'verse',
    };
  });

  return sanitizeLyricLines(result, totalDuration);
}

function parsePlainOrChordLyrics(plainText: string, totalDuration: number): ParsedLyricLine[] {
  const rawLines = plainText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const cleanedLines: { text: string; section?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' }[] = [];
  let currentSection: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' = 'verse';

  for (const line of rawLines) {
    // Check if line is a section header like [Chorus], [Verse 1], [Bridge], [Intro]
    const headerMatch = line.match(/^\[?(intro|verse|chorus|bridge|outro|hook|refrain)[^\]]*\]?$/i);
    if (headerMatch) {
      const tag = headerMatch[1].toLowerCase();
      if (tag === 'intro') currentSection = 'intro';
      else if (tag === 'chorus' || tag === 'hook' || tag === 'refrain') currentSection = 'chorus';
      else if (tag === 'bridge') currentSection = 'bridge';
      else if (tag === 'outro') currentSection = 'outro';
      else currentSection = 'verse';
      continue;
    }

    const clean = cleanLyricText(line);
    if (clean) {
      cleanedLines.push({ text: clean, section: currentSection });
    }
  }

  const count = Math.max(1, cleanedLines.length);
  // Reserve 4 seconds for intro if duration > 30s
  const introDelay = totalDuration > 30 ? 4.0 : 0.0;
  const availableDur = Math.max(10, totalDuration - introDelay);
  const timePerLine = availableDur / count;

  const result: ParsedLyricLine[] = cleanedLines.map((item, idx) => {
    const startTime = introDelay + idx * timePerLine;
    const endTime = Math.min(totalDuration, startTime + timePerLine * 0.95);

    return {
      id: `line-${idx + 1}`,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(Math.max(startTime + 0.5, endTime).toFixed(2)),
      text: item.text,
      originalText: item.text,
      section: item.section || 'verse',
    };
  });

  return sanitizeLyricLines(result, totalDuration);
}

function parseSrtTimestamp(ts: string): number {
  if (!ts) return 0;
  const parts = ts.replace(',', '.').split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(ts) || 0;
}

/**
 * Align pasted external plain lyrics to existing transcribed audio timestamps.
 * Takes the exact clean lyrics provided by the user (from Genius / Spotify / AZLyrics)
 * and anchors them to the audio timestamps discovered from transcription!
 */
export function alignExternalLyricsToExistingTimestamps(
  plainText: string,
  existingLines: ParsedLyricLine[],
  totalDuration = 76
): ParsedLyricLine[] {
  const rawLines = plainText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const cleanedExternal: { text: string; section?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' }[] = [];
  let currentSection: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' = 'verse';

  for (const line of rawLines) {
    const headerMatch = line.match(/^\[?(intro|verse|chorus|bridge|outro|hook|refrain)[^\]]*\]?$/i);
    if (headerMatch) {
      const tag = headerMatch[1].toLowerCase();
      if (tag === 'intro') currentSection = 'intro';
      else if (tag === 'chorus' || tag === 'hook' || tag === 'refrain') currentSection = 'chorus';
      else if (tag === 'bridge') currentSection = 'bridge';
      else if (tag === 'outro') currentSection = 'outro';
      else currentSection = 'verse';
      continue;
    }

    const clean = cleanLyricText(line);
    if (clean) {
      cleanedExternal.push({ text: clean, section: currentSection });
    }
  }

  if (cleanedExternal.length === 0) return existingLines || [];

  if (!existingLines || existingLines.length === 0) {
    return parsePlainOrChordLyrics(plainText, totalDuration);
  }

  // Exact count match: perfect 1-to-1 timing map
  if (cleanedExternal.length === existingLines.length) {
    return existingLines.map((existing, idx) => ({
      ...existing,
      text: cleanedExternal[idx].text,
      originalText: cleanedExternal[idx].text,
      section: cleanedExternal[idx].section || existing.section,
    }));
  }

  // If line count differs, map along audio timeline bounds
  const firstStart = existingLines[0]?.startTime ?? 0;
  const lastEnd = existingLines[existingLines.length - 1]?.endTime ?? totalDuration;
  const totalSpan = Math.max(5, lastEnd - firstStart);
  const timePerExternal = totalSpan / cleanedExternal.length;

  const result: ParsedLyricLine[] = cleanedExternal.map((item, idx) => {
    const nearestExistingIdx = Math.min(
      existingLines.length - 1,
      Math.floor((idx / cleanedExternal.length) * existingLines.length)
    );
    const nearest = existingLines[nearestExistingIdx];

    const startTime = firstStart + idx * timePerExternal;
    const endTime = Math.min(totalDuration, startTime + timePerExternal * 0.95);

    return {
      id: `line-${idx + 1}`,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(Math.max(startTime + 0.5, endTime).toFixed(2)),
      text: item.text,
      originalText: item.text,
      section: item.section || nearest?.section || 'verse',
    };
  });

  return sanitizeLyricLines(result, totalDuration);
}

