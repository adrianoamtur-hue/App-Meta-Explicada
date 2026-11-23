import type { CheckInEntry, SleepEntry } from '../types';
import {
  DEFAULT_LOGO_PATH,
  TOTAL_PROJECT_DAYS,
  formatDurationHoursMin,
  formatPtDate,
  formatSleepBlocksSummary,
  getSleepEntryTotalMinutes,
} from './logic';

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -3)}...`;
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderStoryCanvas(
  canvas: HTMLCanvasElement,
  entry: CheckInEntry,
  sleepLog: SleepEntry | undefined,
  logoSrc: string | null
): Promise<void> {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Deep ocean vertical gradient backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#041B2B');
  bg.addColorStop(0.42, '#06283D');
  bg.addColorStop(0.85, '#0B3F63');
  bg.addColorStop(1, '#06283D');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle decorative turquoise ocean wave ribbons at top & bottom
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#00A896';
  ctx.beginPath();
  ctx.moveTo(0, 1520);
  ctx.bezierCurveTo(320, 1410, 720, 1640, W, 1480);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#1363DF';
  ctx.beginPath();
  ctx.moveTo(0, 1620);
  ctx.bezierCurveTo(360, 1520, 740, 1740, W, 1600);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Top Header: Circular Meta Explicada emblem
  const logoImg = await loadImage(logoSrc || DEFAULT_LOGO_PATH);
  const centerX = W / 2;
  const logoY = 215;
  const logoR = 112;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, logoY, logoR + 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#00A896';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, logoY, logoR, 0, Math.PI * 2);
  ctx.fillStyle = '#F8F6F1';
  ctx.fill();
  ctx.clip();

  if (logoImg) {
    ctx.drawImage(logoImg, centerX - logoR, logoY - logoR, logoR * 2, logoR * 2);
  }
  ctx.restore();

  // Brand + Project Subtitle
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00A896';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OPERAÇÃO MALDIVAS  ·  @METAEXPLICADA', centerX, 385);

  // Day Hero Number
  const dayStr = `DIA ${String(entry.dayNumber).padStart(2, '0')} / ${TOTAL_PROJECT_DAYS}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 94px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(dayStr, centerX, 495);

  ctx.fillStyle = '#B8D4E6';
  ctx.font = '500 32px "DM Sans", sans-serif';
  ctx.fillText(`${formatPtDate(entry.date)}  ·  ${entry.modality}`, centerX, 555);

  // Main Sand Card
  const cardX = 80;
  const cardY = 620;
  const cardW = W - 160;
  const cardH = 980;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 42);
  ctx.fillStyle = '#F8F6F1';
  ctx.fill();

  // Location & Route Header inside card
  ctx.textAlign = 'left';
  const padX = cardX + 64;
  ctx.fillStyle = '#1363DF';
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LOCALIZAÇÃO & SESSÃO', padX, cardY + 84);

  ctx.fillStyle = '#06283D';
  ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
  const locLines = wrapText(ctx, entry.location || 'João Pessoa - PB', cardW - 128, 2);
  locLines.forEach((line, i) => {
    ctx.fillText(line, padX, cardY + 138 + i * 48);
  });

  if (entry.routeTitle) {
    ctx.fillStyle = '#335368';
    ctx.font = '500 28px "DM Sans", sans-serif';
    const routeLines = wrapText(ctx, entry.routeTitle, cardW - 128, 2);
    routeLines.forEach((line, i) => {
      ctx.fillText(line, padX, cardY + 232 + i * 38);
    });
  }

  // Metrics 2x2 Grid inside Sand Card
  const gridY = cardY + 325;
  const boxW = (cardW - 128 - 28) / 2;
  const boxH = 152;

  const lumbarImproved = entry.lumbarAfter <= entry.lumbarBefore;
  const sleepLabel = sleepLog
    ? `${formatDurationHoursMin(getSleepEntryTotalMinutes(sleepLog))} (${formatSleepBlocksSummary(sleepLog)})`
    : 'Não registrado';

  const metrics = [
    {
      label: 'DURAÇÃO / DISTÂNCIA',
      value: entry.distanceKm ? `${entry.durationMin} min · ${entry.distanceKm.toString().replace('.', ',')} km` : `${entry.durationMin} min`,
      accent: '#06283D',
    },
    {
      label: 'GASTO ENERGÉTICO',
      value: `${entry.calories} kcal · Esforço ${entry.effort}/5`,
      accent: '#1363DF',
    },
    {
      label: 'ESCUDO L4-S1 (LOMBAR)',
      value: `${entry.lumbarBefore}/10 → ${entry.lumbarAfter}/10`,
      accent: entry.rightLegRadiation ? '#E63946' : lumbarImproved ? '#00A896' : '#D97706',
    },
    {
      label: 'SONO DA NOITE',
      value: sleepLabel,
      accent: '#06283D',
    },
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = padX + col * (boxW + 28);
    const by = gridY + row * (boxH + 24);
    drawRoundedRect(ctx, bx, by, boxW, boxH, 24);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5E0D5';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#5B7689';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(m.label, bx + 28, by + 50);

    ctx.fillStyle = m.accent;
    ctx.font = '700 32px "JetBrains Mono", monospace';
    const valLines = wrapText(ctx, m.value, boxW - 56, 2);
    valLines.forEach((line, lIdx) => {
      ctx.fillText(line, bx + 28, by + 100 + lIdx * 36);
    });
  });

  // Note / Quote box
  const noteY = gridY + boxH * 2 + 64;
  ctx.fillStyle = '#1363DF';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DIÁRIO DO DIA', padX, noteY);

  ctx.fillStyle = '#06283D';
  ctx.font = '500 32px "DM Sans", sans-serif';
  const noteText = entry.note || 'Mais um tijolo na preparação biomecânica rumo às Maldivas sem lesionar L4-S1.';
  const noteLines = wrapText(ctx, `"${noteText}"`, cardW - 128, 5);
  noteLines.forEach((line, i) => {
    ctx.fillText(line, padX, noteY + 52 + i * 44);
  });

  // Footer slogan
  ctx.textAlign = 'center';
  ctx.fillStyle = '#E8F3F8';
  ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MAIS FORÇA, MOVIMENTO, SAÚDE E LIBERDADE', centerX, 1710);

  ctx.fillStyle = '#00A896';
  ctx.font = '600 28px "JetBrains Mono", monospace';
  ctx.fillText('RUMO ÀS MALDIVAS · 01/08/2027 · @metaexplicada', centerX, 1775);
}

export function buildStoryCaption(entry: CheckInEntry, sleepLog?: SleepEntry): string {
  const dayPadded = String(entry.dayNumber).padStart(2, '0');
  const distPart = entry.distanceKm ? ` (${entry.distanceKm.toString().replace('.', ',')} km)` : '';
  const sleepPart = sleepLog
    ? `\n😴 Sono: ${formatDurationHoursMin(getSleepEntryTotalMinutes(sleepLog))} (${formatSleepBlocksSummary(sleepLog)}${sleepLog.fragmented ? ' · Sono picado' : ''})`
    : '';
  return [
    `🌊 DIA ${dayPadded}/${TOTAL_PROJECT_DAYS} — Operação Maldivas`,
    `🏄 ${entry.modality}${distPart} · ${entry.durationMin} min · ${entry.calories} kcal`,
    `🛡️ Lombar L4-S1: ${entry.lumbarBefore}/10 → ${entry.lumbarAfter}/10${sleepPart}`,
    `📍 ${entry.location}`,
    '',
    `"${entry.note}"`,
    '',
    '30 anos remando → 9 meses de preparação biomecânica inteligente para cavadas, rasgadas e cutbacks nas Maldivas sem lesionar L4-S1.',
    '#metaexplicada #operacaomaldivas #projeto273dias #surfsemlesao #movimentosemdor',
  ].join('\n');
}
