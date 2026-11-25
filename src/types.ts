export type MainTab = 'hoje' | 'treinos' | 'checkin' | 'mar' | 'jornada';

export type WorkoutSubTab =
  | 'academia_a'
  | 'academia_b'
  | 'areia'
  | 'fluxo_chines'
  | 'hotel'
  | 'surfskate'
  | 'manobras'
  | 'elite'
  | 'guia_l4s1';

export type Stance = 'Regular' | 'Goofy';

export type EnergyLevel = 'Alta' | 'Moderada' | 'Baixa';

export type SleepFeeling = 'Zerado' | 'Médio' | 'Moído' | 'Recuperando';

export type SleepEntryKind = 'registered' | 'upcoming_shift';

export type TrafficLight = 'verde' | 'amarelo' | 'vermelho';

export type TideState = 'Seca' | 'Enchendo' | 'Cheia' | 'Vazando';

export type Modality =
  | 'Areia / Orla'
  | 'Wellhub — Pilates'
  | 'Personal Trainer'
  | 'Academia A'
  | 'Academia B'
  | 'Fluxo Chinês'
  | 'Hotel / Elásticos'
  | 'Surfskate'
  | 'Surf no Mar'
  | 'Elite Segura'
  | 'Descanso Consciente';

export interface CheckInEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1..273
  modality: Modality;
  isWellhub?: boolean;
  routeTitle?: string;
  distanceKm?: number;
  durationMin: number;
  calories: number;
  lumbarBefore: number; // 0..10
  lumbarAfter: number; // 0..10
  rightLegRadiation: boolean;
  effort: number; // 1..5
  location: string;
  note: string;
  hasMediaForInsta: boolean;
  createdAt: string;
}

export interface SleepBlock {
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  durationMinutes: number;
}

export interface SleepEntry {
  id: string;
  date: string; // YYYY-MM-DD
  nightLabel?: string;
  kind?: SleepEntryKind; // 'registered' (already slept) | 'upcoming_shift' (going to sleep now / shift window)
  inBedTime?: string; // Optional time went to bed before effective sleep
  blocks: SleepBlock[];
  totalMinutes: number;
  fragmented: boolean; // Sono picado / acordei várias vezes à noite
  isNightShift: boolean;
  shiftNote?: string;
  feeling: SleepFeeling;
  note?: string;
  // Legacy compatibility fields (optional)
  bedTime?: string;
  wakeTime?: string;
  durationMinutes?: number;
  napMinutes?: number;
}

export interface MedicationEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  timeApprox?: string;
  note?: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  summary: string;
  energy: EnergyLevel;
  note: string;
  createdAt: string;
}

export interface BodyMeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  waistCm?: number;
  bmi?: number;
  waistToHeightRatio?: number;
  note?: string;
  createdAt: string;
}

export interface VoiceDiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  rawText: string;
  detectedCategories: string[];
  createdAt: string;
}

export interface PreWorkoutState {
  date: string; // YYYY-MM-DD
  lumbarNow: number; // 0..10
  energy: EnergyLevel;
  rightLegRadiation: boolean;
  quickNote: string;
  updatedAt: string;
}

export interface DailyHabits {
  waterMl: number;
  breathingDone: boolean;
  consciousRest: boolean;
}

export interface SurfSpot {
  id: string;
  name: string;
  region: string;
  lat?: number;
  lon?: number;
  bestTide: string;
  bestWind: string;
  bottomType: 'Beach Break' | 'Point Break' | 'Reef Break' | 'Misto';
  notes: string;
}

export interface CoachEvaluation {
  id: string;
  monthKey: string; // YYYY-MM
  monthLabel: string;
  scores: {
    lookHeadRudder: boolean;
    straightSpineGorilla: boolean;
    backArmConnected: boolean;
    legLeverTop: boolean;
    railAngleVsFlat: boolean;
  };
  notes: string;
  updatedAt: string;
}

export interface AppState {
  version: number;
  profileHeightCm: number; // Fixed 172 cm (1.72 m)
  stance: Stance;
  customLogoDataUrl: string | null;
  preWorkout: PreWorkoutState;
  dailyHabitsByDate: Record<string, DailyHabits>;
  sleepLogs: SleepEntry[];
  checkIns: CheckInEntry[];
  medicationLogs: MedicationEntry[];
  moodLogs: MoodEntry[];
  bodyMeasurements: BodyMeasurementEntry[];
  voiceDiaryLogs: VoiceDiaryEntry[];
  completedSetsByDate: Record<string, Record<string, boolean[]>>;
  mySpots: SurfSpot[];
  coachEvaluations: CoachEvaluation[];
}

export interface ReadinessResult {
  score: number; // 0..100
  light: TrafficLight;
  label: string;
  headline: string;
  recommendation: string;
  sleepWarning: boolean;
}

export interface VoiceParsedResult {
  modality?: Modality;
  isWellhub?: boolean;
  effort?: number;
  lumbarBefore?: number;
  lumbarAfter?: number;
  rightLegRadiation?: boolean;
  durationMin?: number;
  calories?: number;
  hasMediaForInsta?: boolean;
  matchedFields: string[];
}

export interface DetectedSleepSegment {
  id: string;
  kind: SleepEntryKind;
  title: string; // e.g. "Sono Registrado" | "Próximo Sono / Escala"
  inBedTime?: string;
  blocks: SleepBlock[];
  totalMinutes: number;
  fragmented: boolean;
  feeling: SleepFeeling;
  isNightShift: boolean;
  note: string;
}

export interface UniversalVoiceParsed {
  rawText: string;
  targetDate: string; // YYYY-MM-DD
  dateLabel: 'Hoje' | 'Ontem';
  consciousRest?: {
    enabled: boolean;
    note: string;
  };
  workout?: {
    modality: Modality;
    isWellhub: boolean;
    durationMin: number;
    calories: number;
    effort: number;
    lumbarBefore: number;
    lumbarAfter: number;
    rightLegRadiation: boolean;
    hasMediaForInsta: boolean;
    note: string;
  };
  // Multiple independent sleep windows (e.g., past night sleep + upcoming shift window)
  sleepSegments?: DetectedSleepSegment[];
  // Legacy single sleep alias (first segment) for backward compatibility
  sleep?: {
    blocks: SleepBlock[];
    totalMinutes: number;
    fragmented: boolean;
    feeling: SleepFeeling;
    note: string;
  };
  lumbarUpdate?: {
    lumbarNow: number;
    rightLegRadiation: boolean;
  };
  medications?: {
    name: string;
    timeApprox?: string;
  }[];
  mood?: {
    summary: string;
    energy: EnergyLevel;
  };
  bodyMeasurement?: {
    weightKg?: number;
    waistCm?: number;
  };
  waterMl?: number;
}

export interface LiveForecastData {
  spotName: string;
  lat: number;
  lon: number;
  weatherCode: number;
  precipProb: number;
  airTempC: number;
  seaTempC: number | null;
  waveHeightM: number | null;
  swellPeriodS: number | null;
  swellDirectionDeg: number | null;
  windSpeedKmh: number;
  windDirectionDeg: number;
  fetchedAt: string;
}
