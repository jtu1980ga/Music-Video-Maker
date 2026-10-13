import { TimestampLine, ScenePrompt, VideoStyleSettings, StoryTreatment } from '../types';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  alpha: number;
  pulseSpeed: number;
}

// Particle system state
let particles: Particle[] = [];
function initParticles(count: number, width: number, height: number) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.6 - 0.2, // Drifting upwards like dust motes in 7clouds
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    });
  }
}

// Cached image elements for scene visuals
const imageCache: Map<string, HTMLImageElement> = new Map();

export function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(img); // Resolve anyway to prevent hanging
    };
  });
}

/**
 * Draws a single frame of the 7clouds lyric video at given currentTime.
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  totalDuration: number,
  scenes: ScenePrompt[],
  lyrics: TimestampLine[],
  story: StoryTreatment | null,
  settings: VideoStyleSettings
) {
  // Initialize particles if empty
  if (particles.length === 0) {
    initParticles(50, width, height);
  }

  // Clear canvas
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, width, height);

  // 0. Thumbnail Flash Intro: First split-second of video displays full-screen viral thumbnail
  const flashDur = settings.thumbnailFlashDuration ?? 0.25;
  if (settings.flashThumbnailIntro && settings.thumbnailUrl && currentTime < flashDur) {
    let thumbImg = imageCache.get(settings.thumbnailUrl);
    if (!thumbImg) {
      preloadImage(settings.thumbnailUrl);
    }
    if (thumbImg && thumbImg.complete && thumbImg.naturalWidth > 0) {
      const imgAspect = thumbImg.naturalWidth / thumbImg.naturalHeight;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
      } else {
        drawW = width;
        drawH = width / imgAspect;
      }
      ctx.drawImage(thumbImg, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
      return; // Pure thumbnail image on frame 0
    }
  }

  // 1. Find active scene
  const activeSceneIndex = scenes.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const activeScene = activeSceneIndex !== -1 ? scenes[activeSceneIndex] : scenes[0];
  const nextScene = activeSceneIndex !== -1 && activeSceneIndex + 1 < scenes.length ? scenes[activeSceneIndex + 1] : null;

  // Render Background (with Ken Burns effect and crossfade)
  const sceneVisualUrl = activeScene?.userVideoUrl || activeScene?.imageUrl;
  if (activeScene && sceneVisualUrl) {
    const sceneDuration = Math.max(1, activeScene.endTime - activeScene.startTime);
    const sceneProgress = Math.min(1, Math.max(0, (currentTime - activeScene.startTime) / sceneDuration));

    // Ken Burns zoom & subtle pan
    const zoomScale = settings.kenBurnsEffect ? 1.0 + sceneProgress * 0.12 : 1.0;
    const panOffset = settings.kenBurnsEffect ? (sceneProgress - 0.5) * 40 : 0;

    let img = imageCache.get(sceneVisualUrl);
    if (!img) {
      preloadImage(sceneVisualUrl);
    }

    if (img && img.complete && img.naturalWidth > 0) {
      const isVertical = height > width;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;

      let drawW = width;
      let drawH = height;
      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
      } else {
        drawW = width;
        drawH = width / imgAspect;
      }

      ctx.save();
      ctx.translate(width / 2 + panOffset, height / 2);
      ctx.scale(zoomScale, zoomScale);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      // Atmospheric fallback gradient
      drawFallbackGradient(ctx, width, height, activeScene.sceneNumber);
    }

    // Smooth 0.8s crossfade to next scene at boundary
    const timeRemaining = activeScene.endTime - currentTime;
    if (timeRemaining < 0.8 && nextScene && nextScene.imageUrl) {
      const crossfadeAlpha = (0.8 - timeRemaining) / 0.8;
      const nextImg = imageCache.get(nextScene.imageUrl);
      if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
        const nextImgAspect = nextImg.naturalWidth / nextImg.naturalHeight;
        const canvasAspect = width / height;
        let nW = width;
        let nH = height;
        if (nextImgAspect > canvasAspect) {
          nH = height;
          nW = height * nextImgAspect;
        } else {
          nW = width;
          nH = width / nextImgAspect;
        }
        ctx.save();
        ctx.globalAlpha = crossfadeAlpha;
        ctx.drawImage(nextImg, (width - nW) / 2, (height - nH) / 2, nW, nH);
        ctx.restore();
      }
    }
  } else {
    drawFallbackGradient(ctx, width, height, 1);
  }

  // 2. Darkening & Vignette Overlay for 7clouds mood & contrast
  ctx.save();
  // Radial vignette
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.75);
  vignette.addColorStop(0, `rgba(0, 0, 0, ${(settings.backgroundDim / 100) * 0.5})`);
  vignette.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.95, (settings.backgroundDim / 100) * 0.95 + 0.2)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Soft bottom-to-top subtle gradient for text readability
  const bottomGlow = ctx.createLinearGradient(0, height * 0.4, 0, height);
  bottomGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomGlow.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 3. Floating 7clouds Dust Motes / Bokeh Particles
  if (settings.floatingParticles) {
    ctx.save();
    for (const p of particles) {
      p.x += p.speedX * settings.particleSpeed;
      p.y += p.speedY * settings.particleSpeed;
      p.alpha += Math.sin(currentTime * 3 + p.pulseSpeed) * 0.005;

      if (p.y < 0) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(0.8, p.alpha))})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = settings.glowColor;
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Subtle Film Grain
  if (settings.filmGrain) {
    drawSubtleNoise(ctx, width, height);
  }

  // 5. Intro Title Card (First 4-5 seconds)
  const isIntroCard = settings.showTitleCard && currentTime < settings.titleCardDuration;
  if (isIntroCard && story) {
    const cardProgress = currentTime / settings.titleCardDuration;
    let cardAlpha = 1;
    if (cardProgress < 0.2) cardAlpha = cardProgress / 0.2;
    else if (cardProgress > 0.8) cardAlpha = (1 - cardProgress) / 0.2;

    ctx.save();
    ctx.globalAlpha = cardAlpha;
    ctx.textAlign = 'center';

    // Artist name
    ctx.font = `600 ${Math.round(height * 0.03)}px "${settings.fontFamily}", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.letterSpacing = '6px';
    ctx.fillText((story.artist || '7CLOUDS PRESENTS').toUpperCase(), width / 2, height * 0.42);

    // Song Title
    ctx.font = `900 ${Math.round(height * 0.065)}px "${settings.fontFamily}", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = settings.glowIntensity * 0.7;
    ctx.shadowColor = settings.glowColor;
    ctx.fillText((story.title || 'How to Save a Life').toUpperCase(), width / 2, height * 0.50);

    // Subtitle badge "(Lyrics)"
    ctx.font = `500 ${Math.round(height * 0.024)}px "${settings.fontFamily}", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.letterSpacing = '4px';
    ctx.fillText('(LYRICS)', width / 2, height * 0.56);
    ctx.restore();
  }

  // 6. Burned-in 7clouds Synchronized Lyrics
  const activeLyricIndex = lyrics.findIndex(
    (l) => currentTime >= l.startTime && currentTime <= l.endTime
  );
  const activeLyric = activeLyricIndex !== -1 ? lyrics[activeLyricIndex] : null;

  // Determine next line for aesthetic preview
  let nextLyric: TimestampLine | null = null;
  if (activeLyricIndex !== -1 && activeLyricIndex + 1 < lyrics.length) {
    nextLyric = lyrics[activeLyricIndex + 1];
  } else if (!activeLyric) {
    // If between lines, find upcoming line
    nextLyric = lyrics.find((l) => l.startTime > currentTime) || null;
  }

  // Determine Y position & scaling based on 16:9 vs 9:16 orientation
  const isVertical = height > width;
  const baseCenterY = isVertical
    ? (settings.textPosition === 'center' ? height * 0.48 : height * 0.62)
    : (settings.textPosition === 'center' ? height * 0.52 : height * 0.76);

  const effectiveFontSize = isVertical
    ? Math.round(settings.fontSize * (width / 1080) * 1.35)
    : Math.round(settings.fontSize * (height / 1080));

  if (activeLyric) {
    ctx.save();
    ctx.textAlign = 'center';

    // Active line pop animation
    const lineDuration = Math.max(0.5, activeLyric.endTime - activeLyric.startTime);
    const lineElapsed = currentTime - activeLyric.startTime;
    const entryRatio = Math.min(1, lineElapsed / 0.35); // smooth 0.35s ease in
    const activeScale = 0.96 + entryRatio * 0.04;

    ctx.translate(width / 2, baseCenterY);
    ctx.scale(activeScale, activeScale);

    // Outer glow pass (signature 7clouds halo)
    ctx.font = `800 ${effectiveFontSize}px "${settings.fontFamily}", sans-serif`;
    ctx.shadowBlur = settings.glowIntensity;
    ctx.shadowColor = settings.glowColor;
    ctx.fillStyle = settings.textColor;

    // Split long lines into max 2 lines if needed (tighter for vertical)
    const maxTextWidth = isVertical ? width * 0.88 : width * 0.82;
    const rawText = activeLyric.text || '';
    const textToDraw = settings.showChordsInVideo
      ? rawText
      : rawText.replace(/\([A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus\d?|\d)?\)\s*/g, '');
    const linesToDraw = wrapText(ctx, textToDraw, maxTextWidth);
    const lineHeight = settings.fontSize * 1.35 * (height / 1080);
    const startY = -((linesToDraw.length - 1) * lineHeight) / 2;

    linesToDraw.forEach((lineText, i) => {
      // First pass for intense glow
      ctx.fillText(lineText, 0, startY + i * lineHeight);
      // Second pass for razor sharp white center
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText(lineText, 0, startY + i * lineHeight);
    });

    ctx.restore();

    // Upcoming lyric preview (dimmed below)
    if (nextLyric && !isIntroCard) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `600 ${Math.round(settings.fontSize * 0.65 * (height / 1080))}px "${settings.fontFamily}", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';

      const nextRaw = nextLyric.text || '';
      const nextClean = settings.showChordsInVideo
        ? nextRaw
        : nextRaw.replace(/\([A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus\d?|\d)?\)\s*/g, '');
      const nextLines = wrapText(ctx, nextClean, width * 0.75);
      const nextY = baseCenterY + (linesToDraw.length * settings.fontSize * 0.8) + 30;
      nextLines.forEach((lText, idx) => {
        ctx.fillText(lText, width / 2, nextY + idx * 24);
      });
      ctx.restore();
    }
  } else if (!isIntroCard && nextLyric) {
    // In instrumental gap, preview next lyric gently
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `600 ${Math.round(settings.fontSize * 0.75 * (height / 1080))}px "${settings.fontFamily}", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const gapRaw = nextLyric.text || '';
    const gapClean = settings.showChordsInVideo
      ? gapRaw
      : gapRaw.replace(/\([A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus\d?|\d)?\)\s*/g, '');
    ctx.fillText(gapClean, width / 2, baseCenterY);
    ctx.restore();
  }

  // 7. Watermark / 7clouds badge
  if (settings.showWatermark) {
    ctx.save();
    ctx.font = `600 ${Math.round(height * 0.02)}px "${settings.fontFamily}", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'right';
    ctx.fillText(settings.watermarkText || '7clouds Lyrics', width - 40, height - 35);

    // Subtle cloud icon aesthetic
    ctx.font = `500 ${Math.round(height * 0.018)}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'left';
    ctx.fillText(`SCENE ${(activeScene?.sceneNumber || 1).toString().padStart(2, '0')}`, 40, height - 35);
    ctx.restore();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawFallbackGradient(ctx: CanvasRenderingContext2D, width: number, height: number, sceneNum: number) {
  const palettes = [
    ['#0F172A', '#1E1B4B', '#312E81', '#F43F5E'],
    ['#18181B', '#27272A', '#0284C7', '#38BDF8'],
    ['#09090B', '#1C1917', '#78350F', '#F59E0B'],
    ['#0F172A', '#064E3B', '#047857', '#34D399'],
  ];
  const p = palettes[(sceneNum - 1) % palettes.length];
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, p[0]);
  grad.addColorStop(0.4, p[1]);
  grad.addColorStop(0.8, p[2]);
  grad.addColorStop(1, p[3]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawSubtleNoise(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Ultra-light procedural noise to emulate 35mm film
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, 1.5, 1.5);
  }
  ctx.restore();
}

/**
 * High-quality Video Renderer to MP4 / WebM with burned-in 7clouds lyrics & real audio.
 */
export async function renderVideoToBlob(
  audioElement: HTMLAudioElement,
  totalDuration: number,
  scenes: ScenePrompt[],
  lyrics: TimestampLine[],
  story: StoryTreatment | null,
  settings: VideoStyleSettings,
  resolution: { width: number; height: number } = { width: 1920, height: 1080 },
  onProgress?: (progressPercent: number, currentTime: number) => void,
  timeRange?: { startTime: number; endTime: number }
): Promise<{ blob: Blob; url: string; mimeType: string; format: string }> {
  // Preload all scene images first
  for (const scene of scenes) {
    if (scene.imageUrl) {
      await preloadImage(scene.imageUrl);
    }
  }

  // Create offscreen export canvas
  const canvas = document.createElement('canvas');
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  const ctx = canvas.getContext('2d')!;

  // Determine best supported video mime type
  const mimeTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  let selectedMimeType = '';
  for (const mt of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mt)) {
      selectedMimeType = mt;
      break;
    }
  }

  if (!selectedMimeType) {
    selectedMimeType = 'video/webm';
  }

  // Set up audio destination
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sourceNode = audioCtx.createMediaElementSource(audioElement);
  const destNode = audioCtx.createMediaStreamDestination();
  sourceNode.connect(destNode);
  sourceNode.connect(audioCtx.destination); // Keep audible for preview/sync

  // Stream from canvas (30 FPS)
  const canvasStream = canvas.captureStream(30);
  const audioTracks = destNode.stream.getAudioTracks();
  if (audioTracks.length > 0) {
    canvasStream.addTrack(audioTracks[0]);
  }

  const recorder = new MediaRecorder(canvasStream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 8000000, // 8 Mbps high quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const startT = timeRange ? Math.max(0, timeRange.startTime) : 0;
  const endT = timeRange ? Math.min(totalDuration, timeRange.endTime) : totalDuration;
  const clipDuration = Math.max(1, endT - startT);

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: selectedMimeType });
      const finalUrl = URL.createObjectURL(finalBlob);
      const isMp4 = selectedMimeType.includes('mp4');
      resolve({
        blob: finalBlob,
        url: finalUrl,
        mimeType: selectedMimeType,
        format: isMp4 ? 'mp4' : 'webm',
      });
    };

    recorder.onerror = (err) => reject(err);

    // Seek audio to chosen start time
    audioElement.currentTime = startT;
    await audioCtx.resume();
    await audioElement.play();

    recorder.start(500); // 500ms chunk slices

    const frameRate = 30;
    const intervalMs = 1000 / frameRate;

    const renderLoop = setInterval(() => {
      const currentTime = audioElement.currentTime;
      const elapsed = Math.max(0, currentTime - startT);
      const progress = Math.min(100, Math.round((elapsed / clipDuration) * 100));

      if (onProgress) {
        onProgress(progress, currentTime);
      }

      // Draw current frame
      drawVideoFrame(
        ctx,
        resolution.width,
        resolution.height,
        currentTime,
        totalDuration,
        scenes,
        lyrics,
        story,
        settings
      );

      // Check if finished
      if (currentTime >= endT || audioElement.ended) {
        clearInterval(renderLoop);
        audioElement.pause();
        setTimeout(() => {
          recorder.stop();
        }, 600);
      }
    }, intervalMs);
  });
}
