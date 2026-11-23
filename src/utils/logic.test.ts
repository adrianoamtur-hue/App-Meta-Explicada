import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSleepBlock,
  calculateReadiness,
  calculateSleepDurationMinutes,
  createInitialState,
  degToCompass,
  estimateCalories,
  evaluateSurfGasoline,
  formatDurationHoursMin,
  getProjectProgress,
  mergeWithDefaultState,
  parseUniversalVoiceDiary,
  parseVoiceCheckIn,
  sumSleepBlocksMinutes,
  validateBackupJson,
} from './logic';

test('project progress computes Day 01, Day 03, phases, and countdown accurately', () => {
  const day1 = getProjectProgress('2026-11-21');
  assert.equal(day1.currentDay, 1);
  assert.equal(day1.phaseIndex, 1);

  const day3 = getProjectProgress('2026-11-23');
  assert.equal(day3.currentDay, 3);

  const phase2 = getProjectProgress('2027-03-01');
  assert.equal(phase2.phaseIndex, 2);

  const phase3 = getProjectProgress('2027-06-15');
  assert.equal(phase3.phaseIndex, 3);
});

test('multi-block sleep duration handles overnight and daytime shift blocks accurately', () => {
  const b1 = buildSleepBlock('14:00', '19:00');
  const b2 = buildSleepBlock('22:15', '07:00');
  assert.equal(b1.durationMinutes, 300); // 5h00min
  assert.equal(b2.durationMinutes, 525); // 8h45min
  assert.equal(sumSleepBlocksMinutes([b1, b2]), 825);
  assert.equal(formatDurationHoursMin(825), '13h45min');

  assert.equal(calculateSleepDurationMinutes('20:46', '01:30'), 284);
  assert.equal(formatDurationHoursMin(284), '4h44min');
});

test('L4-S1 readiness traffic light handles right-leg alert, short sleep, and fragmented/moído sleep', () => {
  const redRoot = calculateReadiness({
    sleepMinutes: 480,
    lumbarPain: 2,
    rightLegRadiation: true,
    energy: 'Alta',
  });
  assert.equal(redRoot.light, 'vermelho');

  const fragmentedDay = calculateReadiness({
    sleepMinutes: 525, // 8h45min
    lumbarPain: 2,
    rightLegRadiation: false,
    energy: 'Moderada',
    fragmentedSleep: true,
    sleepFeeling: 'Moído',
  });
  assert.equal(fragmentedDay.light, 'amarelo');
  assert.equal(fragmentedDay.sleepWarning, true);

  const greenDay = calculateReadiness({
    sleepMinutes: 460,
    lumbarPain: 1,
    rightLegRadiation: false,
    energy: 'Alta',
    fragmentedSleep: false,
    sleepFeeling: 'Zerado',
  });
  assert.equal(greenDay.light, 'verde');
});

test('universal Portuguese voice diary parses date, rest, workout, multi-block sleep, lumbar, and water independently', () => {
  const res1 = parseUniversalVoiceDiary(
    'Ontem fiz descanso consciente e dormi das 14 às 19, bebi 500ml de água',
    '2026-11-23'
  );
  assert.equal(res1.targetDate, '2026-11-22');
  assert.equal(res1.dateLabel, 'Ontem');
  assert.equal(res1.consciousRest?.enabled, true);
  assert.equal(res1.workout, undefined);
  assert.equal(res1.sleep?.blocks.length, 1);
  assert.equal(res1.sleep?.blocks[0].bedTime, '14:00');
  assert.equal(res1.sleep?.blocks[0].wakeTime, '19:00');
  assert.equal(res1.sleep?.totalMinutes, 300);
  assert.equal(res1.waterMl, 500);

  const res2 = parseUniversalVoiceDiary(
    'Hoje dormi das 10 da noite até 7 da manhã, sono picado acordei várias vezes e acordei moído. Fiz fluxo chinês por 20 minutos, lombar de 4 para 2 e tomei 2 copos de água',
    '2026-11-23'
  );
  assert.equal(res2.targetDate, '2026-11-23');
  assert.equal(res2.sleep?.blocks[0].bedTime, '22:00');
  assert.equal(res2.sleep?.blocks[0].wakeTime, '07:00');
  assert.equal(res2.sleep?.fragmented, true);
  assert.equal(res2.sleep?.feeling, 'Moído');
  assert.equal(res2.workout?.modality, 'Fluxo Chinês');
  assert.equal(res2.workout?.durationMin, 20);
  assert.equal(res2.workout?.lumbarBefore, 4);
  assert.equal(res2.workout?.lumbarAfter, 2);
  assert.equal(res2.waterMl, 500);

  const res3 = parseUniversalVoiceDiary(
    'Dormi 2 da tarde até 7 e depois das 22:15 até 7:00, sem dor',
    '2026-11-23'
  );
  assert.equal(res3.sleep?.blocks.length, 2);
  assert.equal(res3.sleep?.blocks[0].bedTime, '14:00');
  assert.equal(res3.sleep?.blocks[0].wakeTime, '19:00');
  assert.equal(res3.sleep?.blocks[1].bedTime, '22:15');
  assert.equal(res3.sleep?.blocks[1].wakeTime, '07:00');
  assert.equal(res3.lumbarUpdate?.lumbarNow, 0);
});

test('legacy voice check-in parser still handles Wellhub Pilates and durations accurately', () => {
  const parsed = parseVoiceCheckIn(
    'Fiz Pilates pelo Wellhub por 1 hora e 10 minutos, esforço 3, lombar antes 4 e depois 2, gravei vídeo pro @metaexplicada'
  );
  assert.equal(parsed.modality, 'Wellhub — Pilates');
  assert.equal(parsed.durationMin, 70);
  assert.equal(parsed.lumbarBefore, 4);
  assert.equal(parsed.lumbarAfter, 2);
  assert.equal(parsed.hasMediaForInsta, true);
});

test('non-destructive migration preserves existing entries while ensuring Days 01, 02, and 03 exist', () => {
  const legacyUserState = {
    version: 31,
    checkIns: [
      {
        id: 'custom-user-entry',
        date: '2026-11-23',
        dayNumber: 3,
        modality: 'Wellhub — Pilates' as const,
        durationMin: 50,
        calories: 190,
        lumbarBefore: 3,
        lumbarAfter: 1,
        rightLegRadiation: false,
        effort: 3,
        location: 'João Pessoa - PB',
        note: 'Treino customizado salvo pelo usuário',
        hasMediaForInsta: true,
        createdAt: '2026-11-23T10:00:00.000Z',
      },
    ],
    sleepLogs: [
      {
        id: 'sleep-day-01',
        date: '2026-11-21',
        bedTime: '20:46',
        wakeTime: '01:30',
        durationMinutes: 284,
        isNightShift: true,
        feeling: 'Recuperando' as const,
      },
    ],
  };

  const migrated = mergeWithDefaultState(legacyUserState as unknown as Partial<ReturnType<typeof createInitialState>>);
  // Preserves custom user entry
  assert.ok(migrated.checkIns.some((c) => c.id === 'custom-user-entry'));
  // Includes Day 01 walk & Day 02 conscious rest
  assert.ok(migrated.checkIns.some((c) => c.id === 'checkin-day-01' && c.distanceKm === 8.8));
  assert.ok(migrated.checkIns.some((c) => c.id === 'checkin-day-02-rest' && c.modality === 'Descanso Consciente'));
  // Includes all 3 milestone sleeps & upgrades legacy sleep to blocks[]
  assert.ok(migrated.sleepLogs.some((s) => s.id === 'sleep-day-01' && s.blocks[0].bedTime === '20:46'));
  assert.ok(migrated.sleepLogs.some((s) => s.id === 'sleep-day-02-daytime' && s.totalMinutes === 300));
  assert.ok(migrated.sleepLogs.some((s) => s.id === 'sleep-day-03' && s.fragmented === true && s.feeling === 'Moído'));
  // Habits preserved for Day 01 and Day 02
  assert.equal(migrated.dailyHabitsByDate['2026-11-21'].breathingDone, true);
  assert.equal(migrated.dailyHabitsByDate['2026-11-22'].consciousRest, true);

  assert.equal(degToCompass(90), 'L');
  assert.equal(estimateCalories('Areia / Orla', 100), 450);
  assert.equal(evaluateSurfGasoline({ waveHeightM: 1.2, swellPeriodS: 12, windSpeedKmh: 10, tide: 'Enchendo' }).light, 'verde');
  assert.equal(validateBackupJson(JSON.stringify(migrated)).ok, true);
});
