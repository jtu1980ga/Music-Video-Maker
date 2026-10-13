/**
 * Utility functions for audio file handling, base64 conversion, duration extraction,
 * and generating synthetic preview audio when needed.
 */

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data:*/*;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export function formatTime(seconds: number, includeMs = false): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');

  if (includeMs) {
    const msStr = ms.toString().padStart(2, '0');
    return `${mStr}:${sStr}.${msStr}`;
  }
  return `${mStr}:${sStr}`;
}

export function parseTimestamp(timeStr: string): number {
  // Parses "01:23.45" or "83.4" into seconds
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Generates an evocative 45-second acoustic piano/ambient song preview as a WAV Blob,
 * complete with chord progression reminiscent of iconic acoustic pop ballads (like The Fray).
 */
export function generateDemoAcousticSong(): Promise<{ blob: Blob; url: string; base64: string; duration: number }> {
  return new Promise((resolve) => {
    const sampleRate = 44100;
    const duration = 40; // 40 seconds demo
    const numFrames = sampleRate * duration;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    const buffer = audioCtx.createBuffer(2, numFrames, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Chords progression (Bb - F - Gm - Eb reminiscent of How to Save a Life style)
    // Frequencies in Hz
    const chords = [
      [233.08, 293.66, 349.23], // Bb major
      [174.61, 220.00, 261.63], // F major
      [196.00, 233.08, 293.66], // G minor
      [155.56, 196.00, 233.08], // Eb major
    ];

    const chordDuration = 5; // 5 seconds per chord

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const chordIndex = Math.floor(t / chordDuration) % chords.length;
      const currentChord = chords[chordIndex];

      // Piano-like repeating pulse (quarter notes)
      const pulseT = (t * 2) % 1;
      const attackDecay = Math.exp(-pulseT * 5);

      // Low bass note
      const bassFreq = currentChord[0] / 2;
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * Math.exp(-((t % chordDuration) * 0.8)) * 0.25;

      // Harmony
      let harmony = 0;
      for (let note = 0; note < currentChord.length; note++) {
        const freq = currentChord[note];
        // fundamental + overtone
        harmony += Math.sin(2 * Math.PI * freq * t) * 0.15;
        harmony += Math.sin(2 * Math.PI * freq * 2 * t) * 0.05;
      }
      harmony *= attackDecay;

      // Soft tape hiss & warmth
      const hiss = (Math.random() * 2 - 1) * 0.008;

      const master = (bass + harmony + hiss) * 0.6;
      left[i] = master;
      right[i] = master * 0.98 + (Math.sin(2 * Math.PI * currentChord[1] * t) * 0.03 * attackDecay);
    }

    // Convert AudioBuffer to WAV Blob
    const wavBlob = audioBufferToWav(buffer);
    const url = URL.createObjectURL(wavBlob);

    // Also get base64
    const reader = new FileReader();
    reader.readAsDataURL(wavBlob);
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ blob: wavBlob, url, base64, duration });
    };
  });
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}
