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

export type SleepFeeling = 'Zerado' | 'Recuperando' | 'Médio' | 'Moído';

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

export interface SleepEntry {
  id: string;
  date: string; // YYYY-MM-DD (morning date or record date)
  nightLabel?: string; // e.g. "21/11 → 22/11/2026"
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  durationMinutes: number;
  isNightShift: boolean;
  shiftNote?: string;
  napMinutes: number;
  feeling: SleepFeeling;
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
  stance: Stance;
  customLogoDataUrl: string | null;
  preWorkout: PreWorkoutState;
  dailyHabitsByDate: Record<string, DailyHabits>;
  sleepLogs: SleepEntry[];
  checkIns: CheckInEntry[];
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
