import type {
  AppState,
  EnergyLevel,
  Modality,
  ReadinessResult,
  SleepEntry,
  TideState,
  TrafficLight,
  VoiceParsedResult,
} from '../types';

export const STORAGE_KEY = 'metaexplicada_v31';
export const DEFAULT_LOGO_PATH = '/assets/aistudio/Meta_explicada_logo_076f791c.jpeg';

export const PROJECT_START_DATE = '2026-11-21'; // Day 01
export const PROJECT_TARGET_DATE = '2027-08-01'; // Maldivas target
export const TOTAL_PROJECT_DAYS = 273;
export const WATER_GOAL_ML = 3000;

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
      sleepWarning: sleepHours < 6,
    };
  }

  // Score components: Sleep (45 pts) + Lumbar (45 pts) + Energy (10 pts)
  let sleepPoints = 45;
  if (sleepHours < 5) sleepPoints = 14;
  else if (sleepHours < 6) sleepPoints = 22;
  else if (sleepHours < 7) sleepPoints = 34;
  else if (sleepHours < 7.5) sleepPoints = 40;

  const lumbarPoints = Math.max(0, Math.round(45 - pain * 4.5));
  const energyPoints =
    params.energy === 'Alta' ? 10 : params.energy === 'Baixa' ? 3 : 7;

  const score = Math.max(0, Math.min(100, sleepPoints + lumbarPoints + energyPoints));
  const sleepWarning = sleepHours < 6;

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
        ? 'Sono abaixo de 6h + fadiga lombar aumentam a inflamação do Modic 1. Opte por Descanso Consciente, Qi Gong Terapêutico (10 min) ou apenas Respiração 4-4-6-2.'
        : 'Suspenda academia e impactos. Faça apenas descompressão, caminhada curta no plano ou Descanso Consciente.',
      sleepWarning,
    };
  }

  if (sleepWarning || pain >= 4 || score < 72) {
    return {
      score,
      light: 'amarelo',
      label: 'AMARELO — RECUPERAÇÃO ATIVA',
      headline: sleepWarning
        ? `Escala / sono curto (${formatDurationHoursMin(totalSleep)}) — adapte o estímulo`
        : `Lombar pede cautela (${pain}/10) — foco em mobilidade`,
      recommendation: sleepWarning
        ? 'Sono < 6h reduz a tolerância do disco L5-S1 (Modic 1). Sugestão automática: Recuperação Ativa, Fluxo Chinês Blindado (Express 8 min), Pilates clínico ou Descanso Consciente.'
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

export function estimateCalories(modality: Modality, durationMin: number): number {
  const safeMin = Math.max(0, durationMin);
  return Math.round(safeMin * (MODALITY_KCAL_PER_MIN[modality] ?? 4.5));
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
  } else if (/\bsurf\b|no mar|cai na agua|ondas|mar\b/.test(text)) {
    result.modality = 'Surf no Mar';
    result.matchedFields.push('Modalidade: Surf no Mar');
  } else if (/elite|yago|tati|john john/.test(text)) {
    result.modality = 'Elite Segura';
    result.matchedFields.push('Modalidade: Elite Segura');
  } else if (/descanso|repouso|off/.test(text)) {
    result.modality = 'Descanso Consciente';
    result.matchedFields.push('Modalidade: Descanso Consciente');
  } else if (/areia|orla|caminhada|praia|calcadao/.test(text)) {
    result.modality = 'Areia / Orla';
    result.matchedFields.push('Modalidade: Areia / Orla');
  }

  // Duration (e.g., "50 minutos", "1 hora e 20", "1h30", "120 min")
  const hourMinMatch = text.match(/(\d+)\s*(?:horas|hora|h)\s*(?:e\s*)?(\d+)?/);
  const minMatch = text.match(/(\d+)\s*(?:min|minuto|minutos)\b/);
  if (hourMinMatch) {
    const h = parseInt(hourMinMatch[1], 10);
    const m = hourMinMatch[2] ? parseInt(hourMinMatch[2], 10) : 0;
    if (!Number.isNaN(h)) {
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

  // Calories (e.g., "480 calorias", "350 kcal")
  const calMatch = text.match(/(\d{2,4})\s*(?:kcal|caloria|calorias)\b/);
  if (calMatch) {
    result.calories = parseInt(calMatch[1], 10);
    result.matchedFields.push(`Calorias: ${result.calories} kcal`);
  }

  // Lumbar Before / After (e.g., "lombar antes 4 depois 2", "costas de 4 para 2", "antes 5 e depois 3")
  const rangeMatch = text.match(
    /(?:lombar|dor|costas)?\s*(?:de|antes)\s*(?:estava\s*)?(?:em\s*)?(\d{1,2})\s*(?:para|pra|e\s*depois|depois|foi\s*para|caiu\s*para)\s*(\d{1,2})/
  );
  if (rangeMatch) {
    const before = Math.min(10, Math.max(0, parseInt(rangeMatch[1], 10)));
    const after = Math.min(10, Math.max(0, parseInt(rangeMatch[2], 10)));
    result.lumbarBefore = before;
    result.lumbarAfter = after;
    result.matchedFields.push(`Lombar: ${before} → ${after}`);
  } else {
    const beforeMatch = text.match(/(?:lombar\s*antes|antes)\s*(?:em\s*)?(\d{1,2})\b/);
    const afterMatch = text.match(/(?:lombar\s*depois|depois|ficou\s*em|terminou\s*em)\s*(?:em\s*)?(\d{1,2})\b/);
    if (beforeMatch) {
      result.lumbarBefore = Math.min(10, Math.max(0, parseInt(beforeMatch[1], 10)));
      result.matchedFields.push(`Lombar antes: ${result.lumbarBefore}`);
    }
    if (afterMatch) {
      result.lumbarAfter = Math.min(10, Math.max(0, parseInt(afterMatch[1], 10)));
      result.matchedFields.push(`Lombar depois: ${result.lumbarAfter}`);
    }
  }

  // Effort (e.g., "esforco 3", "intensidade 4")
  const effortMatch = text.match(/(?:esforco|intensidade|rpe)\s*(?:de\s*|nivel\s*)?([1-5])\b/);
  if (effortMatch) {
    result.effort = parseInt(effortMatch[1], 10);
    result.matchedFields.push(`Esforço: ${result.effort}/5`);
  }

  // Right leg radiation
  const negRadiation =
    /sem\s*(?:irradiacao|formigamento|choque|dor\s*na\s*perna)|nao\s*(?:irradiou|formigou)/.test(
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

export function createInitialState(): AppState {
  return {
    version: 31,
    stance: 'Regular',
    customLogoDataUrl: null,
    preWorkout: {
      date: '2026-11-22',
      lumbarNow: 2,
      energy: 'Moderada',
      rightLegRadiation: false,
      quickNote: 'Pós-escala de madrugada (02:30). Lombar mais leve após caminhada plana de ontem.',
      updatedAt: '2026-11-22T09:00:00.000Z',
    },
    dailyHabitsByDate: {
      '2026-11-21': {
        waterMl: 3000,
        breathingDone: true,
        consciousRest: false,
      },
      '2026-11-22': {
        waterMl: 1250,
        breathingDone: false,
        consciousRest: false,
      },
    },
    sleepLogs: [
      {
        id: 'sleep-day-01',
        date: '2026-11-22',
        nightLabel: '21/11 → 22/11/2026',
        bedTime: '20:46',
        wakeTime: '01:30',
        durationMinutes: 284,
        isNightShift: true,
        shiftNote: 'Escala de Madrugada — trabalho às 02:30',
        napMinutes: 0,
        feeling: 'Recuperando',
      },
    ],
    checkIns: [
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
    ],
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
    return mergeWithDefaultState(parsed);
  } catch {
    return createInitialState();
  }
}

export function mergeWithDefaultState(parsed: Partial<AppState>): AppState {
  const defaults = createInitialState();
  return {
    version: 31,
    stance: parsed.stance === 'Goofy' ? 'Goofy' : 'Regular',
    customLogoDataUrl: typeof parsed.customLogoDataUrl === 'string' ? parsed.customLogoDataUrl : null,
    preWorkout: parsed.preWorkout ? { ...defaults.preWorkout, ...parsed.preWorkout } : defaults.preWorkout,
    dailyHabitsByDate:
      parsed.dailyHabitsByDate && typeof parsed.dailyHabitsByDate === 'object'
        ? parsed.dailyHabitsByDate
        : defaults.dailyHabitsByDate,
    sleepLogs: Array.isArray(parsed.sleepLogs) && parsed.sleepLogs.length > 0 ? parsed.sleepLogs : defaults.sleepLogs,
    checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : defaults.checkIns,
    completedSetsByDate:
      parsed.completedSetsByDate && typeof parsed.completedSetsByDate === 'object'
        ? parsed.completedSetsByDate
        : {},
    mySpots: Array.isArray(parsed.mySpots) && parsed.mySpots.length > 0 ? parsed.mySpots : defaults.mySpots,
    coachEvaluations:
      Array.isArray(parsed.coachEvaluations) && parsed.coachEvaluations.length > 0
        ? parsed.coachEvaluations
        : defaults.coachEvaluations,
  };
}

export function validateBackupJson(jsonText: string): { ok: true; state: AppState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Arquivo JSON inválido.' };
    }
    if (!Array.isArray(parsed.checkIns) && !Array.isArray(parsed.sleepLogs)) {
      return { ok: false, error: 'O arquivo não parece ser um backup válido do Operação Maldivas.' };
    }
    return { ok: true, state: mergeWithDefaultState(parsed as Partial<AppState>) };
  } catch {
    return { ok: false, error: 'Erro ao ler JSON. Verifique se o arquivo não está corrompido.' };
  }
}

export function getLast28Days(referenceDateStr?: string): string[] {
  const ref = referenceDateStr ? parseLocalDate(referenceDateStr) : parseLocalDate(formatIsoDate(new Date()));
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(ref.getTime() - i * 86_400_000);
    days.push(formatIsoDate(d));
  }
  return days;
}
