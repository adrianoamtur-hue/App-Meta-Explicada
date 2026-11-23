import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReadiness,
  calculateSleepDurationMinutes,
  createInitialState,
  degToCompass,
  estimateCalories,
  evaluateSurfGasoline,
  formatDurationHoursMin,
  getProjectProgress,
  parseVoiceCheckIn,
  validateBackupJson,
} from './logic';

test('project progress computes Day 01, phases, and countdown accurately', () => {
  const day1 = getProjectProgress('2026-11-21');
  assert.equal(day1.currentDay, 1);
  assert.equal(day1.phaseIndex, 1);
  assert.equal(day1.phaseName, 'Base & Desbloqueio');
  assert.ok(day1.daysRemaining > 240);

  const day2 = getProjectProgress('2026-11-22');
  assert.equal(day2.currentDay, 2);

  const phase2 = getProjectProgress('2027-03-01');
  assert.equal(phase2.phaseIndex, 2);
  assert.equal(phase2.phaseName, 'Força & Borda');

  const phase3 = getProjectProgress('2027-06-15');
  assert.equal(phase3.phaseIndex, 3);
  assert.equal(phase3.phaseName, 'Polimento & Resistência');

  const finalDay = getProjectProgress('2027-08-25');
  assert.equal(finalDay.currentDay, 273);
  assert.equal(finalDay.daysRemaining, 0);
});

test('sleep duration handles overnight shift accurately (20:46 -> 01:30 = 4h44min)', () => {
  const mins = calculateSleepDurationMinutes('20:46', '01:30');
  assert.equal(mins, 284);
  assert.equal(formatDurationHoursMin(mins), '4h44min');

  const normalSleep = calculateSleepDurationMinutes('23:00', '06:30');
  assert.equal(normalSleep, 450);
  assert.equal(formatDurationHoursMin(normalSleep), '7h30min');
});

test('L4-S1 readiness traffic light enforces clinical red alert and <6h sleep warning', () => {
  const redRoot = calculateReadiness({
    sleepMinutes: 480,
    lumbarPain: 2,
    rightLegRadiation: true,
    energy: 'Alta',
  });
  assert.equal(redRoot.light, 'vermelho');
  assert.ok(redRoot.label.includes('RAIZ D L5'));

  const shortSleepShift = calculateReadiness({
    sleepMinutes: 284, // 4h44min
    lumbarPain: 2,
    rightLegRadiation: false,
    energy: 'Moderada',
  });
  assert.equal(shortSleepShift.light, 'amarelo');
  assert.equal(shortSleepShift.sleepWarning, true);
  assert.ok(shortSleepShift.recommendation.includes('Fluxo Chinês'));

  const greenDay = calculateReadiness({
    sleepMinutes: 460,
    lumbarPain: 1,
    rightLegRadiation: false,
    energy: 'Alta',
  });
  assert.equal(greenDay.light, 'verde');
  assert.ok(greenDay.score >= 85);
});

test('Portuguese voice check-in parser extracts modality, Wellhub, lumbar delta, duration, calories, effort, and insta tag', () => {
  const parsed = parseVoiceCheckIn(
    'Fiz Pilates pelo Wellhub por 50 minutos, esforço 3, lombar antes 4 e depois 2, sem irradiação na perna, gastei 210 calorias e gravei vídeo para o @metaexplicada'
  );
  assert.equal(parsed.modality, 'Wellhub — Pilates');
  assert.equal(parsed.isWellhub, true);
  assert.equal(parsed.durationMin, 50);
  assert.equal(parsed.effort, 3);
  assert.equal(parsed.lumbarBefore, 4);
  assert.equal(parsed.lumbarAfter, 2);
  assert.equal(parsed.rightLegRadiation, false);
  assert.equal(parsed.calories, 210);
  assert.equal(parsed.hasMediaForInsta, true);

  const alertParse = parseVoiceCheckIn(
    'Academia A por 1 hora e 10 minutos, senti formigamento na perna direita'
  );
  assert.equal(alertParse.modality, 'Academia A');
  assert.equal(alertParse.durationMin, 70);
  assert.equal(alertParse.rightLegRadiation, true);
});

test('surf forecast evaluator and compass helpers return expected traffic lights', () => {
  assert.equal(degToCompass(90), 'L');
  assert.equal(degToCompass(225), 'SO');

  const greenSurf = evaluateSurfGasoline({
    waveHeightM: 1.2,
    swellPeriodS: 12,
    windSpeedKmh: 10,
    tide: 'Enchendo',
  });
  assert.equal(greenSurf.light, 'verde');

  const redSurf = evaluateSurfGasoline({
    waveHeightM: 0.2,
    swellPeriodS: 7,
    windSpeedKmh: 14,
    tide: 'Seca',
  });
  assert.equal(redSurf.light, 'vermelho');
});

test('seed data matches Day 01 preloaded specification and validates backup JSON', () => {
  const seed = createInitialState();
  assert.equal(seed.checkIns.length, 1);
  assert.equal(seed.checkIns[0].distanceKm, 8.8);
  assert.equal(seed.checkIns[0].durationMin, 120);
  assert.equal(seed.checkIns[0].calories, 480);
  assert.equal(seed.checkIns[0].lumbarBefore, 4);
  assert.equal(seed.checkIns[0].lumbarAfter, 2);
  assert.equal(seed.sleepLogs[0].durationMinutes, 284);
  assert.equal(seed.dailyHabitsByDate['2026-11-21'].breathingDone, true);
  assert.equal(estimateCalories('Areia / Orla', 100), 450);

  const valid = validateBackupJson(JSON.stringify(seed));
  assert.equal(valid.ok, true);

  const invalid = validateBackupJson('{"foo":"bar"}');
  assert.equal(invalid.ok, false);
});
