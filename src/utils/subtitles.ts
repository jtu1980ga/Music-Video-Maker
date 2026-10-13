import { TimestampLine } from '../types';

export function exportToSRT(lines: TimestampLine[]): string {
  return lines
    .map((line, idx) => {
      const start = formatSrtTime(line.startTime);
      const end = formatSrtTime(line.endTime);
      return `${idx + 1}\n${start} --> ${end}\n${line.text}\n`;
    })
    .join('\n');
}

export function exportToLRC(lines: TimestampLine[], title = 'Untitled', artist = 'Unknown'): string {
  let lrc = `[ti:${title}]\n[ar:${artist}]\n[al:7clouds Lyric Video]\n[by:AI Video Studio]\n\n`;
  for (const line of lines) {
    const mins = Math.floor(line.startTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(line.startTime % 60).toString().padStart(2, '0');
    const ms = Math.floor((line.startTime % 1) * 100).toString().padStart(2, '0');
    lrc += `[${mins}:${secs}.${ms}]${line.text}\n`;
  }
  return lrc;
}

function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${hrs}:${mins}:${secs},${ms}`;
}
