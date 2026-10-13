import fs from 'fs';
import path from 'path';

export interface VaultTrack {
  id: string;
  syncCode: string;
  title: string;
  artist: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
  uploadedAt: string;
  filePath: string;
  cachedLyrics?: any[];
  cachedStory?: any;
}

const VAULT_DIR = path.resolve(process.cwd(), 'vault_storage');
const INDEX_FILE = path.join(VAULT_DIR, 'index.json');

// Ensure storage directory exists
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

// In-memory cache + disk persistence
let vaultIndex: VaultTrack[] = [];

function loadIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      const data = fs.readFileSync(INDEX_FILE, 'utf-8');
      vaultIndex = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Failed to load vault index:', err);
    vaultIndex = [];
  }
}

function saveIndex() {
  try {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(vaultIndex, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save vault index:', err);
  }
}

loadIndex();

export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getAllVaultTracks(): Omit<VaultTrack, 'filePath'>[] {
  return vaultIndex.map(({ filePath, ...rest }) => rest);
}

export function getVaultTrackById(id: string): VaultTrack | undefined {
  return vaultIndex.find((t) => t.id === id);
}

export function getVaultTrackBySyncCode(code: string): VaultTrack | undefined {
  const normalized = code.trim().toUpperCase();
  return vaultIndex.find((t) => t.syncCode === normalized);
}

export async function saveVaultTrack(options: {
  title: string;
  artist?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  duration?: number;
  syncCode?: string;
}): Promise<VaultTrack> {
  const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const syncCode = (options.syncCode || generateSyncCode()).toUpperCase();
  const fileExt = path.extname(options.fileName) || (options.mimeType.includes('wav') ? '.wav' : '.mp3');
  const diskFileName = `${id}${fileExt}`;
  const diskPath = path.join(VAULT_DIR, diskFileName);

  fs.writeFileSync(diskPath, options.buffer);

  const track: VaultTrack = {
    id,
    syncCode,
    title: options.title || path.basename(options.fileName, fileExt) || 'Untitled Track',
    artist: options.artist || 'Unknown Artist',
    fileName: options.fileName,
    mimeType: options.mimeType || 'audio/mpeg',
    size: options.buffer.length,
    duration: options.duration || 60,
    uploadedAt: new Date().toISOString(),
    filePath: diskPath,
  };

  // Prepend so newest is first
  vaultIndex.unshift(track);
  saveIndex();

  return track;
}

export function updateVaultTrackMetadata(id: string, updates: Partial<VaultTrack>): VaultTrack | null {
  const idx = vaultIndex.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  vaultIndex[idx] = { ...vaultIndex[idx], ...updates };
  saveIndex();
  return vaultIndex[idx];
}

export function deleteVaultTrack(id: string): boolean {
  const idx = vaultIndex.findIndex((t) => t.id === id);
  if (idx === -1) return false;

  const track = vaultIndex[idx];
  try {
    if (fs.existsSync(track.filePath)) {
      fs.unlinkSync(track.filePath);
    }
  } catch (e) {
    console.warn('Failed to delete file on disk:', e);
  }

  vaultIndex.splice(idx, 1);
  saveIndex();
  return true;
}
