import type {
  AppState,
  BodyMeasurementEntry,
  CheckInEntry,
  DetectedSleepSegment,
  EnergyLevel,
  Modality,
  ReadinessResult,
  SleepBlock,
  SleepEntry,
  SleepFeeling,
  TideState,
  TrafficLight,
  UniversalVoiceParsed,
  VoiceParsedResult,
} from '../types';

export const STORAGE_KEY = 'metaexplicada_v31';
export const DEFAULT_LOGO_PATH = '/assets/aistudio/Meta_explicada_logo_076f791c.jpeg';

export const PROJECT_START_DATE = '2026-11-21'; // Day 01
export const PROJECT_TARGET_DATE = '2027-08-01'; // Maldivas target
export const TOTAL_PROJECT_DAYS = 273;
export const DEFAULT_HEIGHT_CM = 172; // 1.72 m fixed height
export const WATER_GOAL_ML = 3000;
export const WAIST_TARGET_RATIO = 0.5;
export const WAIST_TARGET_CM = Math.round(DEFAULT_HEIGHT_CM * WAIST_TARGET_RATIO); // 86 cm

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftIsoDate(dateStr: string, deltaDays: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + deltaDays);
  return formatIsoDate(d);
}

export function formatPtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export function getProjectProgress(referenceDateStr?: string): {
  currentDay: number;
  daysRemaining: number;
  percent: number;
  phaseIndex: 1 | 2 | 3;
  phaseName: string;
  phaseRange: string;
} {
  const refDate = referenceDateStr
    ? parseLocalDate(referenceDateStr)
    : parseLocalDate(formatIsoDate(new Date()));
  const start = parseLocalDate(PROJECT_START_DATE);
  const target = parseLocalDate(PROJECT_TARGET_DATE);

  const msPerDay = 86_400_000;
  const diffFromStart = Math.floor((refDate.getTime() - start.getTime()) / msPerDay) + 1;
  const currentDay = Math.max(1, Math.min(TOTAL_PROJECT_DAYS, diffFromStart));
  const rawRemaining = Math.ceil((target.getTime() - refDate.getTime()) / msPerDay);
  const daysRemaining = Math.max(0, rawRemaining);
  const percent = Math.round((currentDay / TOTAL_PROJECT_DAYS) * 100);

  if (currentDay <= 91) {
    return {
      currentDay,
      daysRemaining,
      percent,
      phaseIndex: 1,
      phaseName: 'Base & Desbloqueio',
      phaseRange: 'Meses 1–3',
    };
  }
  if (currentDay <= 182) {
    return {
      currentDay,
      daysRemaining,
      percent,
      phaseIndex: 2,
      phaseName: 'Força & Borda',
      phaseRange: 'Meses 4–6',
    };
  }
  return {
    currentDay,
    daysRemaining,
    percent,
    phaseIndex: 3,
    phaseName: 'Polimento & Resistência',
    phaseRange: 'Meses 7–9',
  };
}

export function getLatestWeightKg(measurements: BodyMeasurementEntry[]): number | undefined {
  for (const m of measurements) {
    if (typeof m.weightKg === 'number' && m.weightKg > 30 && m.weightKg < 250) {
      return m.weightKg;
    }
  }
  return undefined;
}

export function getLatestWaistCm(measurements: BodyMeasurementEntry[]): number | undefined {
  for (const m of measurements) {
    if (typeof m.waistCm === 'number' && m.waistCm > 40 && m.waistCm < 200) {
      return m.waistCm;
    }
  }
  return undefined;
}

export function getDailyWaterGoalMl(latestWeightKg?: number): number {
  if (typeof latestWeightKg === 'number' && latestWeightKg >= 40 && latestWeightKg <= 200) {
    return Math.round(latestWeightKg * 38);
  }
  return WATER_GOAL_ML;
}

export function calculateBodyMetrics(
  weightKg?: number,
  waistCm?: number,
  heightCm: number = DEFAULT_HEIGHT_CM
): {
  bmi?: number;
  bmiLabel?: string;
  waistToHeightRatio?: number;
  waistStatus?: 'ideal' | 'atencao';
} {
  const heightM = heightCm / 100;
  let bmi: number | undefined;
  let bmiLabel: string | undefined;
  if (typeof weightKg === 'number' && weightKg > 0 && heightM > 0) {
    bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
    if (bmi < 18.5) bmiLabel = 'Abaixo do peso';
    else if (bmi < 25) bmiLabel = 'Peso adequado';
    else if (bmi < 30) bmiLabel = 'Sobrepeso';
    else if (bmi < 35) bmiLabel = 'Obesidade Grau I';
    else if (bmi < 40) bmiLabel = 'Obesidade Grau II';
    else bmiLabel = 'Obesidade Grau III';
  }

  let waistToHeightRatio: number | undefined;
  let waistStatus: 'ideal' | 'atencao' | undefined;
  if (typeof waistCm === 'number' && waistCm > 0 && heightCm > 0) {
    waistToHeightRatio = Number((waistCm / heightCm).toFixed(2));
    waistStatus = waistToHeightRatio < WAIST_TARGET_RATIO ? 'ideal' : 'atencao';
  }

  return { bmi, bmiLabel, waistToHeightRatio, waistStatus };
}

export function calculateSleepDurationMinutes(bedTime: string, wakeTime: string): number {
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  if ([bh, bm, wh, wm].some((n) => Number.isNaN(n))) return 0;

  const bedTotal = bh * 60 + bm;
  const wakeTotal = wh * 60 + wm;
  let diff = wakeTotal - bedTotal;
  if (diff <= 0) {
    diff += 24 * 60;
  }
  return diff;
}

export function buildSleepBlock(bedTime: string, wakeTime: string): SleepBlock {
  return {
    bedTime,
    wakeTime,
    durationMinutes: calculateSleepDurationMinutes(bedTime, wakeTime),
  };
}

export function sumSleepBlocksMinutes(blocks: SleepBlock[]): number {
  return blocks.reduce(
    (acc, b) =>
      acc +
      Math.max(0, b.durationMinutes || calculateSleepDurationMinutes(b.bedTime, b.wakeTime)),
    0
  );
}

export function getSleepEntryTotalMinutes(entry: SleepEntry | undefined): number {
  if (!entry) return 0;
  if (Array.isArray(entry.blocks) && entry.blocks.length > 0) {
    return sumSleepBlocksMinutes(entry.blocks);
  }
  if (typeof entry.totalMinutes === 'number' && entry.totalMinutes > 0) {
    return entry.totalMinutes;
  }
  return (entry.durationMinutes || 0) + (entry.napMinutes || 0);
}

export function formatSleepBlocksSummary(entry: SleepEntry): string {
  if (Array.isArray(entry.blocks) && entry.blocks.length > 0) {
    return entry.blocks.map((b) => `${b.bedTime}→${b.wakeTime}`).join(' + ');
  }
  if (entry.bedTime && entry.wakeTime) {
    return `${entry.bedTime}→${entry.wakeTime}`;
  }
  return '--';
}

export function normalizeSleepEntry(raw: Partial<SleepEntry>): SleepEntry {
  const blocks: SleepBlock[] =
    Array.isArray(raw.blocks) && raw.blocks.length > 0
      ? raw.blocks.map((b) => buildSleepBlock(b.bedTime || '22:00', b.wakeTime || '06:00'))
      : raw.bedTime && raw.wakeTime
        ? [buildSleepBlock(raw.bedTime, raw.wakeTime)]
        : [buildSleepBlock('22:30', '06:00')];

  const baseTotal = sumSleepBlocksMinutes(blocks);
  const legacyNap =
    typeof raw.napMinutes === 'number' && raw.napMinutes > 0 && !raw.blocks ? raw.napMinutes : 0;
  const totalMinutes = baseTotal + legacyNap;

  return {
    id: raw.id || `sleep-${Date.now()}`,
    date: raw.date || formatIsoDate(new Date()),
    nightLabel: raw.nightLabel,
    kind: raw.kind || 'registered',
    inBedTime: raw.inBedTime,
    blocks,
    totalMinutes,
    fragmented: Boolean(raw.fragmented),
    isNightShift: Boolean(raw.isNightShift),
    shiftNote: raw.shiftNote,
    feeling: raw.feeling || 'Médio',
    note: raw.note,
  };
}

export function formatDurationHoursMin(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}h${String(mins).padStart(2, '0')}min`;
}

export function calculateReadiness(params: {
  sleepMinutes: number;
  napMinutes?: number;
  lumbarPain: number; // 0..10
  rightLegRadiation: boolean;
  energy?: EnergyLevel;
  fragmentedSleep?: boolean;
  sleepFeeling?: SleepFeeling;
}): ReadinessResult {
  const totalSleep = Math.max(0, params.sleepMinutes + (params.napMinutes || 0));
  const sleepHours = totalSleep / 60;
  const pain = Math.max(0, Math.min(10, params.lumbarPain));

  // Hard Clinical Red Alert: L5 Right Nerve Root contact
  if (params.rightLegRadiation) {
    return {
      score: Math.min(25, Math.max(10, Math.round(30 - pain * 2))),
      light: 'vermelho',
      label: 'VERMELHO — ALERTA RAIZ D L5',
      headline: 'Irradiação/formigamento na perna direita detectado',
      recommendation:
        'Pausar carga imediatamente. Focar em descompressão suave (posição de alívio, respiração 4-4-6-2, Qi Gong leve sem flexão) e avaliar com seu médico.',
      sleepWarning: sleepHours < 6 || Boolean(params.fragmentedSleep),
    };
  }

  // Score components: Sleep (45 pts) + Lumbar (45 pts) + Energy (10 pts)
  let sleepPoints = 45;
  if (sleepHours < 5) sleepPoints = 14;
  else if (sleepHours < 6) sleepPoints = 22;
  else if (sleepHours < 7) sleepPoints = 34;
  else if (sleepHours < 7.5) sleepPoints = 40;

  if (params.fragmentedSleep) {
    sleepPoints = Math.max(12, sleepPoints - 10);
  }
  if (params.sleepFeeling === 'Moído') {
    sleepPoints = Math.max(10, sleepPoints - 10);
  }

  const lumbarPoints = Math.max(0, Math.round(45 - pain * 4.5));
  const energyPoints =
    params.energy === 'Alta' ? 10 : params.energy === 'Baixa' ? 3 : 7;

  const score = Math.max(0, Math.min(100, sleepPoints + lumbarPoints + energyPoints));
  const sleepWarning =
    sleepHours < 6 || Boolean(params.fragmentedSleep) || params.sleepFeeling === 'Moído';

  if (pain >= 6 || score < 45) {
    return {
      score,
      light: 'vermelho',
      label: 'VERMELHO — PROTEGER MODIC 1',
      headline:
        pain >= 6
          ? `Lombar reativa (${pain}/10) — zero carga axial hoje`
          : 'Bateria muito baixa — priorize recuperação neural',
      recommendation: sleepWarning
        ? 'Noite mal dormida ou sono picado aumentam a sensibilidade do Modic 1. Opte por Descanso Consciente, Qi Gong Terapêutico (10 min) ou apenas Jogo Mental 60s.'
        : 'Suspenda academia e impactos. Faça apenas descompressão, caminhada curta no plano ou Descanso Consciente.',
      sleepWarning,
    };
  }

  if (sleepWarning || pain >= 4 || score < 72) {
    return {
      score,
      light: 'amarelo',
      label: 'AMARELO — RECUPERAÇÃO ATIVA',
      headline:
        params.fragmentedSleep || params.sleepFeeling === 'Moído'
          ? `Sono picado / acordou ${params.sleepFeeling?.toLowerCase() || 'cansado'} (${formatDurationHoursMin(totalSleep)})`
          : sleepHours < 6
            ? `Escala / sono curto (${formatDurationHoursMin(totalSleep)}) — adapte o estímulo`
            : `Lombar pede cautela (${pain}/10) — foco em mobilidade`,
      recommendation: sleepWarning
        ? 'Sono curto ou fragmentado reduz a tolerância do disco L5-S1 (Modic 1). Sugestão: Recuperação Ativa, Fluxo Chinês Blindado (Express 8 min), Pilates clínico ou Descanso Consciente.'
        : 'Mantenha 100% do Escudo L4-S1: Pilates, Fluxo Chinês Blindado, Hotel/Elásticos ou caminhada plana na orla.',
      sleepWarning,
    };
  }

  return {
    score,
    light: 'verde',
    label: 'VERDE — PRONTO PARA EVOLUIR',
    headline: 'Boa janela de treino dentro do Escudo L4-S1',
    recommendation:
      'Corpo pronto para Academia A/B blindada, Surfskate técnico (sem derrapar rabeta), Pilates ou sessão no mar com ritual pré/pós-surf.',
    sleepWarning: false,
  };
}

const MODALITY_KCAL_PER_MIN: Record<Modality, number> = {
  'Areia / Orla': 4.5,
  'Wellhub — Pilates': 3.8,
  'Personal Trainer': 5.8,
  'Academia A': 5.2,
  'Academia B': 5.0,
  'Fluxo Chinês': 3.5,
  'Hotel / Elásticos': 4.2,
  Surfskate: 6.2,
  'Surf no Mar': 7.0,
  'Elite Segura': 4.4,
  'Descanso Consciente': 0,
};

export function estimateCalories(
  modality: Modality,
  durationMin: number,
  weightKg?: number
): number {
  const safeMin = Math.max(0, durationMin);
  const weightFactor =
    typeof weightKg === 'number' && weightKg >= 40 && weightKg <= 180 ? weightKg / 78 : 1;
  return Math.round(safeMin * (MODALITY_KCAL_PER_MIN[modality] ?? 4.5) * weightFactor);
}

export function parseVoiceCheckIn(transcript: string): VoiceParsedResult {
  const text = transcript
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const result: VoiceParsedResult = { matchedFields: [] };

  // Detect Wellhub
  if (/\bwellhub\b|\bgympass\b/.test(text)) {
    result.isWellhub = true;
    result.matchedFields.push('Wellhub');
  }

  // Detect modality
  if (/\bpilates\b/.test(text)) {
    result.modality = 'Wellhub — Pilates';
    result.matchedFields.push('Modalidade: Pilates');
  } else if (/\bpersonal\b/.test(text)) {
    result.modality = 'Personal Trainer';
    result.matchedFields.push('Modalidade: Personal');
  } else if (/academia\s*b\b|remada|puxada|superior/.test(text)) {
    result.modality = 'Academia B';
    result.matchedFields.push('Modalidade: Academia B');
  } else if (/academia\s*a\b|academia|musculacao|bulgaro|pelvica/.test(text)) {
    result.modality = 'Academia A';
    result.matchedFields.push('Modalidade: Academia A');
  } else if (/fluxo\s*chines|chines|qi\s*gong/.test(text)) {
    result.modality = 'Fluxo Chinês';
    result.matchedFields.push('Modalidade: Fluxo Chinês');
  } else if (/hotel|elastico|superband|miniband/.test(text)) {
    result.modality = 'Hotel / Elásticos';
    result.matchedFields.push('Modalidade: Hotel');
  } else if (/surfskate|skate|simulador/.test(text)) {
    result.modality = 'Surfskate';
    result.matchedFields.push('Modalidade: Surfskate');
  } else if (/\bsurf\b|no mar|cai na agua|ondas/.test(text)) {
    result.modality = 'Surf no Mar';
    result.matchedFields.push('Modalidade: Surf no Mar');
  } else if (/elite|yago\s*dora|yago|tati|john\s*john/.test(text)) {
    result.modality = 'Elite Segura';
    result.matchedFields.push('Modalidade: Elite Segura');
  } else if (/descanso\s*consciente|descansei|repouso/.test(text)) {
    result.modality = 'Descanso Consciente';
    result.matchedFields.push('Modalidade: Descanso Consciente');
  } else if (/areia|orla|caminhada|caminhei|praia|calcadao/.test(text)) {
    result.modality = 'Areia / Orla';
    result.matchedFields.push('Modalidade: Areia / Orla');
  }

  // Duration (avoid confusing clock hours like "22h" or "8 da manha" with duration)
  const textWithoutClockTimes = text.replace(
    /\b\d{1,2}(?::\d{2}|h\d{2})\b|\b\d{1,2}\s*(?:h|horas?)?\s*da\s+(?:manha|tarde|noite|madrugada)\b/g,
    ' '
  );
  const halfHourMatch = textWithoutClockTimes.match(/(\d+)\s*(?:horas|hora|h)\s*e\s*meia/);
  const hourMinMatch = textWithoutClockTimes.match(
    /(?:por|durante|fiz|treinei)?\s*(\d)\s*(?:horas|hora)\s*(?:e\s*(\d{1,2}))?/
  );
  const minMatch = textWithoutClockTimes.match(/(\d{1,3})\s*(?:min|minuto|minutos)\b/);
  if (halfHourMatch) {
    const h = parseInt(halfHourMatch[1], 10);
    if (!Number.isNaN(h) && h <= 6) {
      result.durationMin = h * 60 + 30;
      result.matchedFields.push(`Duração: ${result.durationMin} min`);
    }
  } else if (hourMinMatch) {
    const h = parseInt(hourMinMatch[1], 10);
    const m = hourMinMatch[2] ? parseInt(hourMinMatch[2], 10) : 0;
    if (!Number.isNaN(h) && h <= 6) {
      result.durationMin = h * 60 + m;
      result.matchedFields.push(`Duração: ${result.durationMin} min`);
    }
  } else if (minMatch) {
    const m = parseInt(minMatch[1], 10);
    if (!Number.isNaN(m)) {
      result.durationMin = m;
      result.matchedFields.push(`Duração: ${m} min`);
    }
  }

  // Calories
  const calMatch = text.match(/(\d{2,4})\s*(?:kcal|caloria|calorias)\b/);
  if (calMatch) {
    result.calories = parseInt(calMatch[1], 10);
    result.matchedFields.push(`Calorias: ${result.calories} kcal`);
  }

  // Lumbar Before / After or Single
  const rangeMatch = text.match(
    /(?:lombar|dor|costas)\s*(?:estava\s*)?(?:de|antes|em)?\s*(\d{1,2})\s*(?:para|pra|e\s*depois|depois|foi\s*para|caiu\s*para|a)\s*(\d{1,2})\b/
  );
  if (rangeMatch) {
    const before = Math.min(10, Math.max(0, parseInt(rangeMatch[1], 10)));
    const after = Math.min(10, Math.max(0, parseInt(rangeMatch[2], 10)));
    result.lumbarBefore = before;
    result.lumbarAfter = after;
    result.matchedFields.push(`Lombar: ${before} → ${after}`);
  } else if (/\bsem\s*dor\b|lombar\s*(?:zerada|zero|otima|boa|tranquila)/.test(text)) {
    result.lumbarAfter = 0;
    result.matchedFields.push('Lombar: 0/10');
  } else {
    const beforeMatch = text.match(/(?:lombar\s*antes|antes)\s*(?:em\s*)?(\d{1,2})\b/);
    const afterMatch = text.match(
      /(?:lombar\s*depois|depois|ficou\s*em|terminou\s*em)\s*(?:em\s*)?(\d{1,2})\b/
    );
    const singleLumbar = text.match(
      /(?:lombar|dor\s*lombar|dor\s*nas\s*costas)\s*(?:em|nota|ta|esta|de)?\s*(\d{1,2})\b/
    );
    if (beforeMatch) {
      result.lumbarBefore = Math.min(10, Math.max(0, parseInt(beforeMatch[1], 10)));
      result.matchedFields.push(`Lombar antes: ${result.lumbarBefore}`);
    }
    if (afterMatch) {
      result.lumbarAfter = Math.min(10, Math.max(0, parseInt(afterMatch[1], 10)));
      result.matchedFields.push(`Lombar depois: ${result.lumbarAfter}`);
    } else if (singleLumbar && !beforeMatch) {
      const val = Math.min(10, Math.max(0, parseInt(singleLumbar[1], 10)));
      result.lumbarBefore = val;
      result.lumbarAfter = val;
      result.matchedFields.push(`Lombar: ${val}/10`);
    }
  }

  // Effort
  const effortMatch = text.match(/(?:esforco|intensidade|rpe)\s*(?:de\s*|nivel\s*)?([1-5])\b/);
  if (effortMatch) {
    result.effort = parseInt(effortMatch[1], 10);
    result.matchedFields.push(`Esforço: ${result.effort}/5`);
  }

  // Right leg radiation
  const negRadiation =
    /sem\s*(?:irradiacao|formigamento|choque|dor\s*na\s*perna|sinal\s*na\s*perna)|nao\s*(?:irradiou|formigou)|nenhum\s*(?:formigamento|sinal)/.test(
      text
    );
  const posRadiation =
    /irradiacao|irradiou|formigamento|formigando|choque\s*na\s*perna|perna\s*direita/.test(
      text
    );
  if (posRadiation && !negRadiation) {
    result.rightLegRadiation = true;
    result.matchedFields.push('Alerta Perna Direita');
  } else if (negRadiation) {
    result.rightLegRadiation = false;
  }

  // Instagram @metaexplicada media flag
  if (/meta\s*explicada|metaexplicada|gravei|video|foto|story|stories|reels|instagram/.test(text)) {
    result.hasMediaForInsta = true;
    result.matchedFields.push('Tag @metaexplicada');
  }

  return result;
}

export function normalizeSpokenHour(
  hourRaw: number,
  minRaw: number,
  period?: string,
  fallbackPeriod?: string
): string {
  let h = hourRaw;
  const m = Math.min(59, Math.max(0, minRaw || 0));
  const p = (period || fallbackPeriod || '').trim();

  if (p.includes('tarde')) {
    if (h >= 1 && h <= 11) h += 12;
  } else if (p.includes('noite')) {
    if (h >= 1 && h <= 11) h += 12;
  } else if (p.includes('madrugada')) {
    if (h === 12) h = 0;
  } else if (p.includes('manha')) {
    if (h === 12) h = 0;
  }

  h = ((h % 24) + 24) % 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface ParsedTimeToken {
  hour: number;
  min: number;
  period: string;
  raw: string;
  index: number;
  endIndex: number;
}

function parseSingleTimeToken(str: string): { hour: number; min: number; period: string } | null {
  const s = str.trim();
  if (/meia[\s-]?noite/.test(s)) return { hour: 0, min: 0, period: 'da madrugada' };
  if (/meio[\s-]?dia/.test(s)) return { hour: 12, min: 0, period: 'da tarde' };
  const m = s.match(
    /^(\d{1,2})(?:(?::|h)(\d{1,2}))?(?:\s*h(?:oras?)?)?\s*(da\s+manha|da\s+tarde|da\s+noite|da\s+madrugada)?$/i
  );
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (hour > 23 || min > 59) return null;
  return { hour, min, period: (m[3] || '').toLowerCase() };
}

function findTimeTokens(clause: string): ParsedTimeToken[] {
  const tokens: ParsedTimeToken[] = [];
  const regex =
    /\b(?:meia[\s-]?noite|meio[\s-]?dia|(\d{1,2})(?:(?::|h)(\d{1,2}))?(?:\s*h(?:oras?)?)?(?:\s*(da\s+manha|da\s+tarde|da\s+noite|da\s+madrugada))?)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clause)) !== null) {
    const raw = match[0];
    // Skip bare small numbers that have no colon, no 'h', no period, and aren't preceded by time preposition
    const hasExplicitClock =
      raw.includes(':') ||
      /\dh/.test(raw) ||
      /hora|manha|tarde|noite|madrugada|meia|meio/.test(raw);
    const before = clause.slice(Math.max(0, match.index - 22), match.index);
    const after = clause.slice(match.index + raw.length, match.index + raw.length + 14);
    const hasUnitAfter = /^\s*(?:ml|l\b|litro|kg|quilo|cm|min|minuto|copo|vezes|km|kcal|\/10)/.test(
      after
    );
    if (hasUnitAfter) continue;
    const hasLumbarBefore = /(?:lombar|dor|costas|esforco|nota|peso|cintura|abdomen)\s*(?:de|em|esta|ta|foi|para)?\s*$/.test(
      before
    );
    if (hasLumbarBefore) continue;
    const hasTimeCueBefore =
      /(?:as|a|das|da|de|ate|dormir|acordar|deitar|efetivo|acordei|dormi)\s*$/.test(before);

    if (!hasExplicitClock && !hasTimeCueBefore) continue;

    const parsed = parseSingleTimeToken(raw);
    if (!parsed) continue;
    tokens.push({
      ...parsed,
      raw,
      index: match.index,
      endIndex: match.index + raw.length,
    });
  }
  return tokens;
}

export function extractSleepBlocksFromText(normalizedText: string): SleepBlock[] {
  const segments = extractSleepSegmentsFromText(normalizedText, 'Médio', false, normalizedText);
  return segments.flatMap((s) => s.blocks);
}

/**
 * Turbocharged Portuguese sleep & shift window extractor.
 * Handles multi-segment utterances like:
 * "de ontem para hoje fui dormir às 10 da noite, efetivo 2:30 da manhã até 8 da manhã,
 *  e agora estou indo dormir 9:15 e vou acordar 1:25 da manhã"
 */
export function extractSleepSegmentsFromText(
  normalizedText: string,
  defaultFeeling: SleepFeeling,
  defaultFragmented: boolean,
  originalNote: string
): DetectedSleepSegment[] {
  const segments: DetectedSleepSegment[] = [];

  // Check if utterance splits into an upcoming sleep window clause ("e agora estou indo dormir...", "vou dormir...", "proxima escala...")
  const upcomingSplitRegex =
    /(?:,\s*e\s+|\.\s*|\be\s+)(?=(?:agora\s+)?(?:estou\s+indo\s+dormir|indo\s+dormir|vou\s+dormir|vou\s+deitar|proximo\s+sono|escala\s+agora))/i;

  const rawClauses = normalizedText.split(upcomingSplitRegex).map((c) => c.trim()).filter(Boolean);

  rawClauses.forEach((clause, clauseIdx) => {
    const mentionsSleepInClause =
      /\bdormi|\bsono\b|cochil|acord|deit|madrugada|efetivo|escala|noite\s*toda/.test(clause);
    if (!mentionsSleepInClause) return;

    const isUpcoming =
      /estou\s+indo\s+dormir|indo\s+dormir|vou\s+dormir|vou\s+deitar|vou\s+acordar|proximo\s+sono/.test(
        clause
      );

    // 1. Check for "fui dormir/deitar às X ... efetivo Y até Z" pattern inside this clause
    let inBedTime: string | undefined;
    let workingClause = clause;
    const effectiveSplit = clause.match(
      /^([\s\S]*?)(?:\b(?:sono\s+)?efetivo\b|\bso\s+peguei\s+no\s+sono\b|\bpeguei\s+no\s+sono\b)([\s\S]*)$/i
    );
    if (effectiveSplit) {
      const preTokens = findTimeTokens(effectiveSplit[1]);
      if (preTokens.length > 0) {
        const t = preTokens[preTokens.length - 1];
        const prePeriod =
          t.period || (t.hour >= 6 && t.hour <= 11 ? 'da noite' : '');
        inBedTime = normalizeSpokenHour(t.hour, t.min, prePeriod);
      }
      workingClause = effectiveSplit[2];
    }

    // 2. Extract explicit range pairs inside workingClause
    const blocks: SleepBlock[] = [];
    const rangeRegex =
      /(?:das?|de|as|efetivo|dormir|dormi|deitar|deitei)?\s*(\d{1,2})(?:(?::|h)(\d{1,2}))?(?:\s*h(?:oras?)?)?\s*(da\s+manha|da\s+tarde|da\s+noite|da\s+madrugada)?\s*(?:as|ate\s+as|ate|a|e\s+(?:vou\s+)?acord(?:ar|ei)\s*(?:as)?|acord(?:ar|ei)\s*(?:as)?)\s*(\d{1,2})(?:(?::|h)(\d{1,2}))?(?:\s*h(?:oras?)?)?\s*(da\s+manha|da\s+tarde|da\s+noite|da\s+madrugada)?/gi;

    let match: RegExpExecArray | null;
    while ((match = rangeRegex.exec(workingClause)) !== null) {
      const startH = parseInt(match[1], 10);
      const startM = match[2] ? parseInt(match[2], 10) : 0;
      let startPeriod = (match[3] || '').toLowerCase();
      const endH = parseInt(match[4], 10);
      const endM = match[5] ? parseInt(match[5], 10) : 0;
      let endPeriod = (match[6] || '').toLowerCase();

      const beforeSnippet = workingClause.slice(Math.max(0, match.index - 28), match.index);
      if (/(?:lombar|dor|costas|esforco|nota)\s*$/.test(beforeSnippet)) continue;
      if (startH > 23 || endH > 23 || startM > 59 || endM > 59) continue;

      // Smart Brazilian Portuguese AM/PM disambiguation:
      // - "9:15 ... acordar 1:25 da manhã" OR "indo dormir 9:15" -> 21:15
      if (!startPeriod && startH >= 6 && startH <= 11) {
        const wakeIsEarlyMorning =
          endPeriod.includes('manha') ||
          endPeriod.includes('madrugada') ||
          (endH >= 0 && endH <= 6);
        if (
          isUpcoming ||
          (wakeIsEarlyMorning && endH < startH) ||
          /noite/.test(beforeSnippet)
        ) {
          startPeriod = 'da noite';
        }
      }

      // - "2 da tarde ate 7" -> end is 19:00
      if (!endPeriod && startPeriod.includes('tarde') && endH > startH && endH <= 11) {
        endPeriod = 'da tarde';
      }
      // - "10 da noite ate 7" -> end is 07:00
      if (!endPeriod && startPeriod.includes('noite') && endH <= 11 && endH < startH) {
        endPeriod = 'da manha';
      }

      const bedTime = normalizeSpokenHour(startH, startM, startPeriod);
      const wakeTime = normalizeSpokenHour(endH, endM, endPeriod);
      const duration = calculateSleepDurationMinutes(bedTime, wakeTime);
      if (duration >= 20 && duration <= 18 * 60) {
        blocks.push({ bedTime, wakeTime, durationMinutes: duration });
      }
    }

    // 3. Fallback if user gave 2 time tokens in clause without explicit connector matched above
    if (blocks.length === 0) {
      const tokens = findTimeTokens(workingClause);
      if (tokens.length >= 2) {
        const t1 = tokens[0];
        const t2 = tokens[1];
        let p1 = t1.period;
        let p2 = t2.period;
        if (!p1 && t1.hour >= 6 && t1.hour <= 11 && (isUpcoming || (t2.hour < t1.hour && t2.hour <= 6))) {
          p1 = 'da noite';
        }
        if (!p2 && p1.includes('tarde') && t2.hour > t1.hour && t2.hour <= 11) {
          p2 = 'da tarde';
        }
        const bedTime = normalizeSpokenHour(t1.hour, t1.min, p1);
        const wakeTime = normalizeSpokenHour(t2.hour, t2.min, p2);
        const duration = calculateSleepDurationMinutes(bedTime, wakeTime);
        if (duration >= 20 && duration <= 18 * 60) {
          blocks.push({ bedTime, wakeTime, durationMinutes: duration });
        }
      }
    }

    if (blocks.length > 0) {
      const totalMinutes = sumSleepBlocksMinutes(blocks);
      const isNightShift =
        isUpcoming ||
        /escala|madrugada/.test(clause) ||
        blocks.some((b) => {
          const bh = parseInt(b.bedTime.split(':')[0], 10);
          const wh = parseInt(b.wakeTime.split(':')[0], 10);
          return (bh >= 12 && bh <= 19) || (wh >= 0 && wh <= 4);
        });

      const title = isUpcoming ? 'Próximo Sono / Escala' : 'Sono Registrado';
      const noteBits: string[] = [];
      if (inBedTime) noteBits.push(`Foi deitar às ${inBedTime}`);
      if (isUpcoming) noteBits.push('Janela de escala / próximo sono');
      const segmentNote = noteBits.length > 0 ? `${noteBits.join(' · ')}.` : originalNote;

      segments.push({
        id: `seg-${clauseIdx}-${Date.now()}`,
        kind: isUpcoming ? 'upcoming_shift' : 'registered',
        title,
        inBedTime,
        blocks,
        totalMinutes,
        fragmented: isUpcoming ? false : defaultFragmented,
        feeling: isUpcoming ? 'Recuperando' : defaultFeeling,
        isNightShift,
        note: segmentNote,
      });
    }
  });

  return segments;
}

const KNOWN_MEDICATIONS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bdipirona\b/, label: 'Dipirona' },
  { pattern: /\bibuprofeno\b/, label: 'Ibuprofeno' },
  { pattern: /\bparacetamol\b/, label: 'Paracetamol' },
  { pattern: /\btorsilax\b/, label: 'Torsilax' },
  { pattern: /\bdorflex\b/, label: 'Dorflex' },
  { pattern: /\btandrilax\b/, label: 'Tandrilax' },
  { pattern: /\bmiosan\b|ciclobenzaprina/, label: 'Ciclobenzaprina (Miosan)' },
  { pattern: /\bpregabalina\b/, label: 'Pregabalina' },
  { pattern: /\bgabapentina\b/, label: 'Gabapentina' },
  { pattern: /\btramadol\b/, label: 'Tramadol' },
  { pattern: /\balginac\b/, label: 'Alginac' },
  { pattern: /\barcox(?:ia)?\b|etoricoxib/, label: 'Arcoxia (Etoricoxibe)' },
  { pattern: /\bcelebra\b|celecoxib/, label: 'Celebra' },
  { pattern: /\bnimesulida\b/, label: 'Nimesulida' },
  { pattern: /\bcetoprofeno\b/, label: 'Cetoprofeno' },
  { pattern: /\bprednisona\b|corticoide/, label: 'Corticoide / Prednisona' },
  { pattern: /anti[\s-]?inflamatorio/, label: 'Anti-inflamatório' },
  { pattern: /relaxante\s*muscular/, label: 'Relaxante muscular' },
  { pattern: /\bcreatina\b/, label: 'Creatina' },
  { pattern: /\bwhey\b/, label: 'Whey Protein' },
  { pattern: /\bmagnesio\b/, label: 'Magnésio' },
  { pattern: /vitamina\s*d\b/, label: 'Vitamina D' },
  { pattern: /vitamina\s*b12\b|\bb12\b/, label: 'Vitamina B12' },
  { pattern: /omega\s*3/, label: 'Ômega 3' },
  { pattern: /\bcolageno\b/, label: 'Colágeno' },
  { pattern: /\bmelatonina\b/, label: 'Melatonina' },
  { pattern: /\bcafeina\b/, label: 'Cafeína' },
];

function extractMedications(normalizedText: string): { name: string; timeApprox?: string }[] {
  const found: { name: string; timeApprox?: string }[] = [];
  const seen = new Set<string>();

  for (const item of KNOWN_MEDICATIONS) {
    const match = normalizedText.match(item.pattern);
    if (match && !seen.has(item.label)) {
      seen.add(item.label);
      // Look around the match (±35 chars) for an approximate time like "às 8h" or "21:00"
      const idx = match.index ?? 0;
      const nearby = normalizedText.slice(Math.max(0, idx - 25), idx + match[0].length + 35);
      const timeM = nearby.match(
        /(?:as|a|por\s+volta\s+das?)?\s*(\d{1,2})(?:(?::|h)(\d{1,2}))?\s*(da\s+manha|da\s+tarde|da\s+noite|h\b)/i
      );
      let timeApprox: string | undefined;
      if (timeM) {
        const hh = parseInt(timeM[1], 10);
        const mm = timeM[2] ? parseInt(timeM[2], 10) : 0;
        const per = (timeM[3] || '').toLowerCase();
        if (hh <= 23 && mm <= 59) {
          timeApprox = normalizeSpokenHour(hh, mm, per === 'h' ? '' : per);
        }
      }
      found.push({ name: item.label, timeApprox });
    }
  }

  return found;
}

function extractMood(normalizedText: string): { summary: string; energy: EnergyLevel } | undefined {
  const tags: string[] = [];
  let energy: EnergyLevel = 'Moderada';

  if (/energia\s*alta|muito\s*bem|animad[oa]|dispost[oa]|focad[oa]|motivad[oa]|otimo\s*humor|me\s*senti\s*(?:muito\s*)?bem/.test(normalizedText)) {
    energy = 'Alta';
    tags.push('Disposto / Energia alta');
  }
  if (/energia\s*baixa|sem\s*energia|exaust[oa]|esgotad[oa]|cansaco\s*fisico|cansaco\s*mental|cansad[oa]|pesad[oa]|sonolent[oa]/.test(normalizedText)) {
    energy = 'Baixa';
    tags.push('Cansaço / Energia baixa');
  }
  if (/estressad[oa]|ansios[oa]|irritad[oa]|sobrecarregad[oa]|mente\s*cheia/.test(normalizedText)) {
    tags.push('Estresse / Ansiedade');
  }
  if (/calm[oa]|tranquil[oa]|equilibrad[oa]|humor\s*(?:bom|otimo|estavel)|me\s*senti\s*tranquil/.test(normalizedText)) {
    tags.push('Calmo / Equilibrado');
  }
  if (/energia\s*(?:media|moderada)|mais\s*ou\s*menos/.test(normalizedText) && tags.length === 0) {
    energy = 'Moderada';
    tags.push('Energia moderada');
  }

  if (tags.length === 0) return undefined;
  return { summary: tags.join(' · '), energy };
}

function extractBodyMeasurement(
  normalizedText: string
): { weightKg?: number; waistCm?: number } | undefined {
  let weightKg: number | undefined;
  let waistCm: number | undefined;

  const weightMatch =
    normalizedText.match(
      /(?:peso|pesei|estou\s*com|to\s*com)\s*(?:de\s*)?(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilos?|quilos?)?\b/
    ) ||
    normalizedText.match(/(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilos?|quilos?)\b/);

  if (weightMatch) {
    const val = parseFloat(weightMatch[1].replace(',', '.'));
    if (!Number.isNaN(val) && val >= 45 && val <= 190) {
      weightKg = Number(val.toFixed(1));
    }
  }

  const waistMatch = normalizedText.match(
    /(?:cintura|abdomen|barriga|circunferencia)\s*(?:de|com|em|esta|ta)?\s*(\d{2,3}(?:[.,]\d)?)\s*(?:cm|centimetros?)?\b/
  );
  if (waistMatch) {
    const val = parseFloat(waistMatch[1].replace(',', '.'));
    if (!Number.isNaN(val) && val >= 50 && val <= 160) {
      waistCm = Number(val.toFixed(1));
    }
  }

  if (weightKg === undefined && waistCm === undefined) return undefined;
  return { weightKg, waistCm };
}

export function parseUniversalVoiceDiary(
  rawText: string,
  todayIso: string,
  defaultLumbarNow = 2,
  latestWeightKg?: number
): UniversalVoiceParsed {
  const text = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // "de ontem para hoje" means the log is for TODAY (not yesterday!)
  const mentionsYesterdayOnly =
    /\bontem\b/.test(text) && !/de\s+ontem\s+(?:para|pra)\s+hoje|\bhoje\b|\bagora\b/.test(text);
  const targetDate = mentionsYesterdayOnly ? shiftIsoDate(todayIso, -1) : todayIso;
  const dateLabel: 'Hoje' | 'Ontem' = mentionsYesterdayOnly ? 'Ontem' : 'Hoje';

  const parsed: UniversalVoiceParsed = {
    rawText: rawText.trim(),
    targetDate,
    dateLabel,
  };

  // 1. Water detection ("bebi 500ml", "1 litro", "2 copos", "tomei 750 ml")
  const mlMatch = text.match(/(?:bebi|tomei|agua|hidratacao)?\s*(\d{2,4})\s*ml\b/);
  const literMatch = text.match(
    /(?:bebi|tomei|agua)\s*(?:de\s*)?(\d(?:[.,]\d)?)\s*(?:l|litro|litros)\b/
  );
  const cupsMatch = text.match(/(?:bebi|tomei)?\s*(\d{1,2})\s*(?:copo|copos)\b/);
  if (mlMatch) {
    parsed.waterMl = parseInt(mlMatch[1], 10);
  } else if (literMatch) {
    parsed.waterMl = Math.round(parseFloat(literMatch[1].replace(',', '.')) * 1000);
  } else if (cupsMatch) {
    parsed.waterMl = parseInt(cupsMatch[1], 10) * 250;
  }

  // 2. Conscious Rest detection
  const mentionsRest =
    /descanso\s*consciente|\bdescansei\b|dia\s*de\s*descanso|tirei\s*descanso|so\s*descanso/.test(
      text
    );
  if (mentionsRest) {
    parsed.consciousRest = {
      enabled: true,
      note: rawText.trim(),
    };
  }

  // 3. Sleep & Shifts detection (multiple independent segments!)
  const mentionsSleep =
    /\bdormi|\bsono\b|cochil|acord|deit|madrugada|noite\s*toda|escala/.test(text);
  const fragmented =
    /sono\s*picado|acordei\s*(?:varias|algumas|muitas)\s*vezes|dormi\s*picado|picado|interrompido/.test(
      text
    );
  let sleepFeeling: SleepFeeling | undefined;
  if (/\bmoido\b|\bmoida\b|destruido|acabado|cansado/.test(text)) {
    sleepFeeling = 'Moído';
  } else if (/\bzerado\b|\bzerada\b|renovado|descansado/.test(text)) {
    sleepFeeling = 'Zerado';
  } else if (/\bmedio\b|mais\s*ou\s*menos|razoavel/.test(text)) {
    sleepFeeling = 'Médio';
  }

  const sleepSegments = mentionsSleep
    ? extractSleepSegmentsFromText(
        text,
        sleepFeeling || (fragmented ? 'Moído' : 'Médio'),
        fragmented,
        rawText.trim()
      )
    : [];

  if (sleepSegments.length > 0) {
    parsed.sleepSegments = sleepSegments;
    parsed.sleep = {
      blocks: sleepSegments[0].blocks,
      totalMinutes: sleepSegments[0].totalMinutes,
      fragmented: sleepSegments[0].fragmented,
      feeling: sleepSegments[0].feeling,
      note: sleepSegments[0].note,
    };
  } else if (mentionsSleep && (fragmented || sleepFeeling)) {
    const fallbackSeg: DetectedSleepSegment = {
      id: `seg-fallback-${Date.now()}`,
      kind: 'registered',
      title: 'Sono Registrado',
      blocks: [buildSleepBlock('22:30', '06:00')],
      totalMinutes: 450,
      fragmented,
      feeling: sleepFeeling || 'Moído',
      isNightShift: false,
      note: rawText.trim(),
    };
    parsed.sleepSegments = [fallbackSeg];
    parsed.sleep = {
      blocks: fallbackSeg.blocks,
      totalMinutes: fallbackSeg.totalMinutes,
      fragmented: fallbackSeg.fragmented,
      feeling: fallbackSeg.feeling,
      note: fallbackSeg.note,
    };
  }

  // 4. Body Measurement (Weight / Waist)
  const bodyMeasurement = extractBodyMeasurement(text);
  if (bodyMeasurement) {
    parsed.bodyMeasurement = bodyMeasurement;
  }
  const effectiveWeight = bodyMeasurement?.weightKg ?? latestWeightKg;

  // 5. Workout / Movement detection
  const checkInBits = parseVoiceCheckIn(rawText);
  const hasRealWorkoutModality =
    checkInBits.modality && checkInBits.modality !== 'Descanso Consciente';

  if (hasRealWorkoutModality && checkInBits.modality) {
    const durationMin =
      checkInBits.durationMin ?? (checkInBits.modality === 'Fluxo Chinês' ? 16 : 45);
    const lumbarBefore = checkInBits.lumbarBefore ?? defaultLumbarNow;
    const lumbarAfter = checkInBits.lumbarAfter ?? lumbarBefore;
    parsed.workout = {
      modality: checkInBits.modality,
      isWellhub: Boolean(checkInBits.isWellhub || checkInBits.modality === 'Wellhub — Pilates'),
      durationMin,
      calories:
        checkInBits.calories ?? estimateCalories(checkInBits.modality, durationMin, effectiveWeight),
      effort: checkInBits.effort ?? 3,
      lumbarBefore,
      lumbarAfter,
      rightLegRadiation: Boolean(checkInBits.rightLegRadiation),
      hasMediaForInsta: Boolean(checkInBits.hasMediaForInsta),
      note: rawText.trim(),
    };
  }

  // 6. Lumbar Pain Update
  if (
    checkInBits.lumbarAfter !== undefined ||
    checkInBits.lumbarBefore !== undefined ||
    checkInBits.rightLegRadiation === true
  ) {
    parsed.lumbarUpdate = {
      lumbarNow: checkInBits.lumbarAfter ?? checkInBits.lumbarBefore ?? defaultLumbarNow,
      rightLegRadiation: Boolean(checkInBits.rightLegRadiation),
    };
  }

  // 7. Medications & Supplements
  const medications = extractMedications(text);
  if (medications.length > 0) {
    parsed.medications = medications;
  }

  // 8. Mood / How I felt
  const mood = extractMood(text);
  if (mood) {
    parsed.mood = mood;
  }

  return parsed;
}

export function buildPrivateDatabaseReport(state: AppState, daysWindow: 7 | 30): string {
  const todayIso = formatIsoDate(new Date());
  const cutoffIso = shiftIsoDate(todayIso, -(daysWindow - 1));
  const latestWeight = getLatestWeightKg(state.bodyMeasurements);
  const latestWaist = getLatestWaistCm(state.bodyMeasurements);
  const metrics = calculateBodyMetrics(latestWeight, latestWaist, state.profileHeightCm);
  const waterGoal = getDailyWaterGoalMl(latestWeight);

  const lines: string[] = [
    `RELATÓRIO CLÍNICO PRIVADO — OPERAÇÃO MALDIVAS (@metaexplicada)`,
    `Período: últimos ${daysWindow} dias (desde ${formatPtDate(cutoffIso)} até ${formatPtDate(todayIso)})`,
    `Perfil: Altura ${(state.profileHeightCm / 100).toFixed(2).replace('.', ',')} m | Base: ${state.stance} | Meta Água: ${waterGoal} ml/dia`,
    `Escudo L4-S1 (RM 03/02/2026): L5-S1 extrusão 13 mm + Modic 1 | L4-L5 contato raiz D L5 | Retrolistese L5`,
    '',
  ];

  if (latestWeight || latestWaist) {
    lines.push('=== PESO & MEDIDAS ===');
    lines.push(
      `Peso: ${latestWeight ? `${latestWeight.toString().replace('.', ',')} kg` : '--'} | Cintura: ${latestWaist ? `${latestWaist.toString().replace('.', ',')} cm` : '--'} (meta < ${WAIST_TARGET_CM} cm) | IMC: ${metrics.bmi ?? '--'} (${metrics.bmiLabel || '--'}) | Cintura/Altura: ${metrics.waistToHeightRatio ?? '--'}`
    );
    lines.push('');
  }

  const recentSleeps = state.sleepLogs.filter((s) => s.date >= cutoffIso);
  lines.push(`=== SONO & ESCALAS (${recentSleeps.length}) ===`);
  if (recentSleeps.length === 0) {
    lines.push('Sem registros no período.');
  } else {
    for (const s of recentSleeps) {
      const kindTag = s.kind === 'upcoming_shift' ? '[Próxima Escala]' : '[Registrado]';
      lines.push(
        `- ${formatPtDate(s.date)} ${kindTag}: ${formatSleepBlocksSummary(s)} (${formatDurationHoursMin(getSleepEntryTotalMinutes(s))})${s.inBedTime ? ` · Deitou ${s.inBedTime}` : ''} · ${s.feeling}${s.fragmented ? ' · Sono picado' : ''}${s.note ? ` — ${s.note}` : ''}`
      );
    }
  }
  lines.push('');

  const recentCheckIns = state.checkIns.filter((c) => c.date >= cutoffIso);
  lines.push(`=== TREINOS & LOMBAR (${recentCheckIns.length}) ===`);
  if (recentCheckIns.length === 0) {
    lines.push('Sem registros no período.');
  } else {
    for (const c of recentCheckIns) {
      lines.push(
        `- DIA ${String(c.dayNumber).padStart(2, '0')} (${formatPtDate(c.date)}): ${c.modality} · ${c.durationMin} min · ${c.calories} kcal · Lombar ${c.lumbarBefore}/10 → ${c.lumbarAfter}/10${c.rightLegRadiation ? ' [ALERTA RAIZ D L5]' : ''} · "${c.note}"`
      );
    }
  }
  lines.push('');

  const recentMeds = state.medicationLogs.filter((m) => m.date >= cutoffIso);
  if (recentMeds.length > 0) {
    lines.push(`=== REMÉDIOS & SUPLEMENTOS (${recentMeds.length}) ===`);
    for (const m of recentMeds) {
      lines.push(
        `- ${formatPtDate(m.date)}${m.timeApprox ? ` (${m.timeApprox})` : ''}: ${m.name}${m.note ? ` — ${m.note}` : ''}`
      );
    }
    lines.push('');
  }

  const recentMoods = state.moodLogs.filter((m) => m.date >= cutoffIso);
  if (recentMoods.length > 0) {
    lines.push(`=== COMO ME SENTI / ENERGIA (${recentMoods.length}) ===`);
    for (const m of recentMoods) {
      lines.push(`- ${formatPtDate(m.date)}: ${m.summary} (Energia: ${m.energy}) — "${m.note}"`);
    }
    lines.push('');
  }

  const recentVoice = state.voiceDiaryLogs.filter((v) => v.date >= cutoffIso);
  if (recentVoice.length > 0) {
    lines.push(`=== TRANSCRIÇÕES ORIGINAIS (${recentVoice.length}) ===`);
    for (const v of recentVoice) {
      lines.push(`- ${formatPtDate(v.date)}: "${v.rawText}"`);
    }
  }

  return lines.join('\n').trim();
}

export function degToCompass(deg: number | null): string {
  if (deg === null || Number.isNaN(deg)) return '--';
  const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[idx];
}

export function weatherCodeToLabel(code: number): { label: string; kind: 'sun' | 'cloud' | 'rain' } {
  if (code <= 1) return { label: 'Sol aberto', kind: 'sun' };
  if (code <= 3) return { label: 'Parcialmente nublado', kind: 'cloud' };
  if (code <= 48) return { label: 'Neblina / Nuvens', kind: 'cloud' };
  return { label: 'Chuva / Instável', kind: 'rain' };
}

export function evaluateSurfGasoline(params: {
  waveHeightM: number | null;
  swellPeriodS: number | null;
  windSpeedKmh: number;
  tide: TideState;
}): { light: TrafficLight; verdict: string; tip: string } {
  const wave = params.waveHeightM ?? 0;
  const period = params.swellPeriodS ?? 0;
  const wind = params.windSpeedKmh;

  if (wave < 0.35 || wind >= 32) {
    return {
      light: 'vermelho',
      verdict: 'Segura a gasolina — foque no solo',
      tip:
        wave < 0.35
          ? 'Mar muito pequeno para cavadas. Excelente dia para Surfskate (Rail Game) ou Academia A/B blindada.'
          : 'Vento forte deixando o mar mexido e exigindo muita remada (risco de fadiga em L5-S1). Prefira treino em terra.',
    };
  }

  const goodPeriod = period >= 9;
  const lightWind = wind <= 18;
  const favorableTide = params.tide === 'Enchendo' || params.tide === 'Vazando';

  if (wave >= 0.7 && wave <= 2.4 && goodPeriod && lightWind) {
    return {
      light: 'verde',
      verdict: 'Vale a gasolina! Condição alinhada',
      tip: `Período de ${period.toFixed(0)}s com vento controlado (${Math.round(wind)} km/h) na maré ${params.tide.toLowerCase()}. Foque em abrir espaço no Bottom Turn com mãos calmas e faça os 5 min de ritual pós-mar.`,
    };
  }

  return {
    light: 'amarelo',
    verdict: 'Caia se estiver perto — mar funcional',
    tip: favorableTide
      ? `Maré ${params.tide.toLowerCase()} ajuda a formar parede. Trabalhe leitura de canal, aceleração (pumping) e preserve a lombar evitando remadas contra correnteza.`
      : `Maré ${params.tide.toLowerCase()} pode deixar a onda mais cheia ou fechadeira. Observe 5 minutos na areia antes de entrar.`,
  };
}

// Seeded milestone records (Days 01 to 04)
export function getSeedCheckIns(): CheckInEntry[] {
  return [
    {
      id: 'checkin-day-02-rest',
      date: '2026-11-22',
      dayNumber: 2,
      modality: 'Descanso Consciente',
      durationMin: 0,
      calories: 0,
      lumbarBefore: 2,
      lumbarAfter: 2,
      rightLegRadiation: false,
      effort: 1,
      location: 'João Pessoa - PB',
      note: 'Descanso Consciente registrado (recuperação pós-escala de madrugada) para proteger L5-S1 e Modic Tipo 1.',
      hasMediaForInsta: false,
      createdAt: '2026-11-22T20:00:00.000Z',
    },
    {
      id: 'checkin-day-01',
      date: '2026-11-21',
      dayNumber: 1,
      modality: 'Areia / Orla',
      routeTitle: 'Caminhada na Orla (ibis Cabo Branco até Verdegreen Hotel em Manaíra, ida e volta)',
      distanceKm: 8.8,
      durationMin: 120,
      calories: 480,
      lumbarBefore: 4,
      lumbarAfter: 2,
      rightLegRadiation: false,
      effort: 3,
      location: 'Praia de Cabo Branco, João Pessoa - PB',
      note: 'Primeiro dia do projeto. Saí com leve dor nas costas (4/10), caminhei no plano na orla, aliviei para 2/10 e fiz a respiração guiada de 60s após o banho.',
      hasMediaForInsta: true,
      createdAt: '2026-11-21T19:00:00.000Z',
    },
  ];
}

export function getSeedSleepLogs(): SleepEntry[] {
  return [
    {
      id: 'sleep-day-04-shift',
      date: '2026-11-24',
      nightLabel: 'Dia 04 — Escala Madrugada (24/11 → 25/11/2026)',
      kind: 'upcoming_shift',
      blocks: [buildSleepBlock('21:15', '01:25')],
      totalMinutes: 250, // 4h10min
      fragmented: false,
      isNightShift: true,
      shiftNote: 'Janela de Escala da Madrugada',
      feeling: 'Recuperando',
      note: 'Indo dormir às 21:15 para acordar às 01:25 (4h10min).',
    },
    {
      id: 'sleep-day-04-night',
      date: '2026-11-24',
      nightLabel: 'Dia 04 — Noite 23/11 → 24/11/2026',
      kind: 'registered',
      inBedTime: '22:00',
      blocks: [buildSleepBlock('02:30', '08:00')],
      totalMinutes: 330, // 5h30min
      fragmented: false,
      isNightShift: false,
      feeling: 'Médio',
      note: 'Foi deitar às 22:00; sono efetivo das 02:30 → 08:00 (5h30min).',
    },
    {
      id: 'sleep-day-03',
      date: '2026-11-23',
      nightLabel: 'Dia 03 — Noite 22/11 → 23/11/2026',
      kind: 'registered',
      blocks: [buildSleepBlock('22:15', '07:00')],
      totalMinutes: 525, // 8h45min
      fragmented: true,
      isNightShift: false,
      feeling: 'Moído',
      note: 'Sono noturno picado — acordou várias vezes à noite.',
    },
    {
      id: 'sleep-day-02-daytime',
      date: '2026-11-22',
      nightLabel: 'Dia 02 (22/11/2026 — Bloco diurno)',
      kind: 'registered',
      blocks: [buildSleepBlock('14:00', '19:00')],
      totalMinutes: 300, // 5h00min
      fragmented: false,
      isNightShift: true,
      shiftNote: 'Bloco diurno pós-escala de madrugada',
      feeling: 'Médio',
      note: 'Bloco de recuperação pós-escala de madrugada.',
    },
    {
      id: 'sleep-day-01',
      date: '2026-11-21',
      nightLabel: 'Dia 01 (21/11 → 22/11/2026 — Madrugada)',
      kind: 'registered',
      blocks: [buildSleepBlock('20:46', '01:30')],
      totalMinutes: 284, // 4h44min
      fragmented: false,
      isNightShift: true,
      shiftNote: 'Escala de madrugada — trabalho às 02:30',
      feeling: 'Recuperando',
      note: 'Sono antes da escala da madrugada.',
    },
  ];
}

export function createInitialState(): AppState {
  return {
    version: 33,
    profileHeightCm: DEFAULT_HEIGHT_CM,
    stance: 'Regular',
    customLogoDataUrl: null,
    preWorkout: {
      date: '2026-11-24',
      lumbarNow: 2,
      energy: 'Moderada',
      rightLegRadiation: false,
      quickNote: 'Dia 04: sono efetivo 02:30→08:00 (5h30min) + escala madrugada 21:15→01:25.',
      updatedAt: '2026-11-24T09:00:00.000Z',
    },
    dailyHabitsByDate: {
      '2026-11-21': {
        waterMl: 3000,
        breathingDone: true,
        consciousRest: false,
      },
      '2026-11-22': {
        waterMl: 2500,
        breathingDone: false,
        consciousRest: true,
      },
      '2026-11-23': {
        waterMl: 2000,
        breathingDone: false,
        consciousRest: false,
      },
      '2026-11-24': {
        waterMl: 1000,
        breathingDone: false,
        consciousRest: false,
      },
    },
    sleepLogs: getSeedSleepLogs(),
    checkIns: getSeedCheckIns(),
    medicationLogs: [],
    moodLogs: [],
    bodyMeasurements: [],
    voiceDiaryLogs: [],
    completedSetsByDate: {},
    mySpots: [
      {
        id: 'spot-intermares',
        name: 'Intermares / Cabo Branco',
        region: 'João Pessoa - PB',
        lat: -7.0439,
        lon: -34.8357,
        bestTide: 'Seca para enchendo (0.4m a 1.3m)',
        bestWind: 'Terral O / SO ou fraco pela manhã',
        bottomType: 'Beach Break',
        notes: 'Cabo Branco ótimo para caminhada plana na orla; Intermares entrega direitas e esquerdas consistentes para treinar cavada.',
      },
      {
        id: 'spot-sultans',
        name: 'Sultans',
        region: 'North Malé Atoll — Maldivas',
        lat: 4.3168,
        lon: 73.5055,
        bestTide: 'Enchendo até cheia (seguro sobre o recife)',
        bestWind: 'O / NO (terral limpo)',
        bottomType: 'Reef Break',
        notes: 'Direita longa, parede perfeita e amigável para conectar bottom turn, rasgadas e cutbacks com estilo.',
      },
      {
        id: 'spot-pasta',
        name: 'Pasta Point',
        region: 'North Malé Atoll — Maldivas',
        lat: 4.3247,
        lon: 73.5245,
        bestTide: 'Média para cheia',
        bestWind: 'N / NO',
        bottomType: 'Reef Break',
        notes: 'Esquerda mecânica com sessões contínuas; exige ritmo de troca de borda e paciência nas mãos.',
      },
    ],
    coachEvaluations: [
      {
        id: 'eval-2026-11',
        monthKey: '2026-11',
        monthLabel: 'Novembro 2026 (Mês 1)',
        scores: {
          lookHeadRudder: false,
          straightSpineGorilla: true,
          backArmConnected: false,
          legLeverTop: false,
          railAngleVsFlat: false,
        },
        notes: 'Marco zero do Projeto 273 Dias: prioridade em destravar quadril/torácica e proteger L4-S1.',
        updatedAt: '2026-11-21T20:00:00.000Z',
      },
    ],
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const merged = mergeWithDefaultState(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return createInitialState();
  }
}

export function mergeWithDefaultState(parsed: Partial<AppState>): AppState {
  const defaults = createInitialState();

  // Normalize existing sleep logs and ensure Days 01..04 exist non-destructively
  const existingSleeps: SleepEntry[] = Array.isArray(parsed.sleepLogs)
    ? parsed.sleepLogs.map((s) => normalizeSleepEntry(s))
    : [];

  const mergedSleeps = [...existingSleeps];
  for (const seedSleep of getSeedSleepLogs()) {
    const alreadyExists = mergedSleeps.some(
      (s) =>
        s.id === seedSleep.id ||
        (s.date === seedSleep.date &&
          s.blocks[0]?.bedTime === seedSleep.blocks[0]?.bedTime &&
          s.blocks[0]?.wakeTime === seedSleep.blocks[0]?.wakeTime)
    );
    if (!alreadyExists) {
      mergedSleeps.push(seedSleep);
    }
  }
  mergedSleeps.sort((a, b) => b.date.localeCompare(a.date));

  // Preserve existing check-ins and ensure Day 01 + Day 02 exist non-destructively
  const existingCheckIns: CheckInEntry[] = Array.isArray(parsed.checkIns)
    ? [...parsed.checkIns]
    : [];
  for (const seedCheckIn of getSeedCheckIns()) {
    const alreadyExists = existingCheckIns.some(
      (c) =>
        c.id === seedCheckIn.id ||
        (c.date === seedCheckIn.date && c.modality === seedCheckIn.modality)
    );
    if (!alreadyExists) {
      existingCheckIns.push(seedCheckIn);
    }
  }
  existingCheckIns.sort((a, b) => b.date.localeCompare(a.date));

  // Merge daily habits non-destructively
  const existingHabits =
    parsed.dailyHabitsByDate && typeof parsed.dailyHabitsByDate === 'object'
      ? { ...parsed.dailyHabitsByDate }
      : {};
  existingHabits['2026-11-21'] = {
    waterMl: existingHabits['2026-11-21']?.waterMl ?? 3000,
    breathingDone: true,
    consciousRest: existingHabits['2026-11-21']?.consciousRest ?? false,
  };
  existingHabits['2026-11-22'] = {
    waterMl: existingHabits['2026-11-22']?.waterMl ?? 2500,
    breathingDone: existingHabits['2026-11-22']?.breathingDone ?? false,
    consciousRest: true,
  };

  return {
    version: 33,
    profileHeightCm: DEFAULT_HEIGHT_CM,
    stance: parsed.stance === 'Goofy' ? 'Goofy' : 'Regular',
    customLogoDataUrl:
      typeof parsed.customLogoDataUrl === 'string' ? parsed.customLogoDataUrl : null,
    preWorkout: parsed.preWorkout
      ? { ...defaults.preWorkout, ...parsed.preWorkout }
      : defaults.preWorkout,
    dailyHabitsByDate: existingHabits,
    sleepLogs: mergedSleeps,
    checkIns: existingCheckIns,
    medicationLogs: Array.isArray(parsed.medicationLogs) ? parsed.medicationLogs : [],
    moodLogs: Array.isArray(parsed.moodLogs) ? parsed.moodLogs : [],
    bodyMeasurements: Array.isArray(parsed.bodyMeasurements) ? parsed.bodyMeasurements : [],
    voiceDiaryLogs: Array.isArray(parsed.voiceDiaryLogs) ? parsed.voiceDiaryLogs : [],
    completedSetsByDate:
      parsed.completedSetsByDate && typeof parsed.completedSetsByDate === 'object'
        ? parsed.completedSetsByDate
        : {},
    mySpots:
      Array.isArray(parsed.mySpots) && parsed.mySpots.length > 0
        ? parsed.mySpots
        : defaults.mySpots,
    coachEvaluations:
      Array.isArray(parsed.coachEvaluations) && parsed.coachEvaluations.length > 0
        ? parsed.coachEvaluations
        : defaults.coachEvaluations,
  };
}

export function validateBackupJson(
  jsonText: string
): { ok: true; state: AppState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Arquivo JSON inválido.' };
    }
    if (!Array.isArray(parsed.checkIns) && !Array.isArray(parsed.sleepLogs)) {
      return {
        ok: false,
        error: 'O arquivo não parece ser um backup válido do Operação Maldivas.',
      };
    }
    return { ok: true, state: mergeWithDefaultState(parsed as Partial<AppState>) };
  } catch {
    return { ok: false, error: 'Erro ao ler JSON. Verifique se o arquivo não está corrompido.' };
  }
}

export function getLast28Days(referenceDateStr?: string): string[] {
  const ref = referenceDateStr
    ? parseLocalDate(referenceDateStr)
    : parseLocalDate(formatIsoDate(new Date()));
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(ref.getTime() - i * 86_400_000);
    days.push(formatIsoDate(d));
  }
  return days;
}
