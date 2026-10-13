export interface TimestampLine {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  originalText?: string;
  chords?: string[];
  section?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
}

export interface SongHarmonyInfo {
  key: string;
  bpm: number;
  chords: string[];
  progression: string;
}

export interface StoryTreatment {
  title: string;
  artist: string;
  logline: string;
  theme: string;
  visualStyle: string;
  colorPalette: string[];
  synopsis: string;
  characters: string[];
  keyMotifs: string[];
}

export interface ScenePrompt {
  id: string;
  sceneNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  lyricsExcerpt: string;
  narrativeBeat: string;
  videoPrompt: string;
  cameraMotion: string;
  lighting: string;
  mood: string;
  imageUrl?: string;
  videoUrl?: string;
  userVideoUrl?: string;
  userVideoFileName?: string;
  isGenerating?: boolean;
}

export type AspectRatio = '16:9' | '9:16';
export type VideoDurationMode = 'full' | '30s' | '60s' | 'custom';

export interface VidIqTag {
  tag: string;
  rank?: string;
  volume: 'Very High' | 'High' | 'Medium';
  score: number;
}

export interface VidIqTitleOption {
  title: string;
  ctrScore: number;
  badge: string;
}

export interface VidIqThumbnailConcept {
  id: string;
  prompt: string;
  textOverlay: string;
  mood: string;
  imageUrl?: string;
}

export interface VidIqSeoResult {
  seoScore: number;
  scoreBreakdown: {
    titleScore: number;
    tagsScore: number;
    descriptionScore: number;
    competitorRank: number;
  };
  titles: VidIqTitleOption[];
  tags: VidIqTag[];
  thumbnailConcepts: VidIqThumbnailConcept[];
  hashtags: string[];
}

export interface VideoStyleSettings {
  preset: '7clouds_classic' | 'the_fray_moody' | 'cinematic_warm' | 'neon_twilight' | 'monochrome_film';
  fontFamily: string;
  fontSize: number;
  textPosition: 'center' | 'lower_third';
  textColor: string;
  glowColor: string;
  glowIntensity: number;
  karaokeHighlight: boolean;
  backgroundDim: number; // percentage
  floatingParticles: boolean;
  particleSpeed: number;
  filmGrain: boolean;
  kenBurnsEffect: boolean;
  showTitleCard: boolean;
  titleCardDuration: number;
  showWatermark: boolean;
  watermarkText: string;
  aspectRatio: AspectRatio;
  flashThumbnailIntro: boolean; // Flash thumbnail image for split second at video start
  thumbnailFlashDuration: number; // in seconds (e.g. 0.25s)
  thumbnailUrl?: string; // High-CTR Thumbnail URL to flash
  showChordsInVideo: boolean; // Display chord brackets in video text or clean lyrics
}

export interface AudioTrackInfo {
  fileName: string;
  fileSize: number;
  duration: number;
  audioUrl: string;
  base64Data?: string;
  mimeType: string;
}

export interface YouTubeUploadConfig {
  title: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'unlisted' | 'private';
  category: string;
  aspectRatio: AspectRatio;
  durationMode: VideoDurationMode;
  customStartTime: number;
  customEndTime: number;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema?: any;
}

export interface McpConnectionStatus {
  connected: boolean;
  serverUrl: string;
  apiKeyConfigured: boolean;
  tools: McpTool[];
  protocolVersion: string;
  lastConnectedAt?: string;
  latencyMs?: number;
  message?: string;
}

export type VidIqAuthMethod = 'oauth' | 'api_key';

export interface VidIqAuthState {
  connected: boolean;
  method: VidIqAuthMethod;
  accountEmail?: string;
  channelName?: string;
  subscriberCount?: string;
  plan?: string;
  token?: string;
  connectedAt?: string;
}

export interface YouTubeAuthState {
  connected: boolean;
  channelTitle?: string;
  channelId?: string;
  avatarUrl?: string;
  accessToken?: string;
}

export interface VaultTrackInfo {
  id: string;
  syncCode: string;
  title: string;
  artist: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
  uploadedAt: string;
  audioUrl?: string;
  base64Data?: string;
  cachedLyrics?: TimestampLine[];
  cachedStory?: StoryTreatment;
}

