import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrivateDatabaseReport,
  buildSleepBlock,
  calculateBodyMetrics,
  calculateReadiness,
  calculateSleepDurationMinutes,
  createInitialState,
  estimateCalories,
  getDailyWaterGoalMl,
  getProjectProgress,
  mergeWithDefaultState,
  parseUniversalVoiceDiary,
  parseVoiceCheckIn,
  sumSleepBlocksMinutes,
} from './logic';

test('project progress computes Day 01, Day 04, phases, and countdown accurately', () => {
  const day1 = getProjectProgress('2026-11-21');
  assert.equal(day1.currentDay, 1);
  assert.equal(day1.phaseIndex, 1);

  const day4 = getProjectProgress('2026-11-24');
  assert.equal(day4.currentDay, 4);
  assert.equal(day4.phaseIndex, 1);

  const phase2 = getProjectProgress('2027-03-01');
  assert.equal(phase2.phaseIndex, 2);

  const phase3 = getProjectProgress('2027-07-01');
  assert.equal(phase3.phaseIndex, 3);
});

test('multi-block sleep duration handles overnight and daytime shift blocks accurately', () => {
  assert.equal(calculateSleepDurationMinutes('20:46', '01:30'), 284); // 4h44min
  assert.equal(calculateSleepDurationMinutes('14:00', '19:00'), 300); // 5h00min
  assert.equal(calculateSleepDurationMinutes('22:15', '07:00'), 525); // 8h45min
  assert.equal(calculateSleepDurationMinutes('02:30', '08:00'), 330); // 5h30min
  assert.equal(calculateSleepDurationMinutes('21:15', '01:25'), 250); // 4h10min

  const multi = sumSleepBlocksMinutes([
    buildSleepBlock('14:00', '19:00'),
    buildSleepBlock('22:15', '07:00'),
  ]);
  assert.equal(multi, 825);
});

test('L4-S1 readiness traffic light handles right-leg alert, short sleep, and fragmented/moído sleep', () => {
  const redAlert = calculateReadiness({
    sleepMinutes: 480,
    lumbarPain: 2,
    rightLegRadiation: true,
    energy: 'Alta',
  });
  assert.equal(redAlert.light, 'vermelho');

  const fragmentedYellow = calculateReadiness({
    sleepMinutes: 525,
    lumbarPain: 2,
    rightLegRadiation: false,
    energy: 'Moderada',
    fragmentedSleep: true,
    sleepFeeling: 'Moído',
  });
  assert.equal(fragmentedYellow.light, 'amarelo');
  assert.equal(fragmentedYellow.sleepWarning, true);
});

test('turbocharged Portuguese voice parser extracts dual sleep/shift windows with exact 24h conversion', () => {
  const phrase =
    'De ontem para hoje fui dormir às 10 da noite, efetivo 2:30 da manhã até 8 da manhã, e agora estou indo dormir 9:15 e vou acordar 1:25 da manhã.';
  const parsed = parseUniversalVoiceDiary(phrase, '2026-11-24', 2);

  assert.equal(parsed.targetDate, '2026-11-24');
  assert.equal(parsed.dateLabel, 'Hoje');
  assert.ok(parsed.sleepSegments && parsed.sleepSegments.length === 2, 'Expected 2 sleep segments');

  // Segment 1: Sono Registrado 02:30 -> 08:00 (5h30min) with inBedTime 22:00
  const seg1 = parsed.sleepSegments[0];
  assert.equal(seg1.kind, 'registered');
  assert.equal(seg1.inBedTime, '22:00');
  assert.equal(seg1.blocks[0].bedTime, '02:30');
  assert.equal(seg1.blocks[0].wakeTime, '08:00');
  assert.equal(seg1.totalMinutes, 330);

  // Segment 2: Próximo Sono / Escala 21:15 -> 01:25 (4h10min)
  const seg2 = parsed.sleepSegments[1];
  assert.equal(seg2.kind, 'upcoming_shift');
  assert.equal(seg2.blocks[0].bedTime, '21:15');
  assert.equal(seg2.blocks[0].wakeTime, '01:25');
  assert.equal(seg2.totalMinutes, 250);
});

test('universal Portuguese voice diary parses medications, mood, weight/waist, rest, workout, lumbar, and water', () => {
  const fullPhrase =
    'Hoje me senti cansado com energia baixa, lombar nota 3 sem formigamento na perna direita, tomei dipirona às 8h e creatina, fiz pilates pelo wellhub 50 minutos, peso 82,5 kg e cintura 85 cm, bebi 750ml.';
  const parsed = parseUniversalVoiceDiary(fullPhrase, '2026-11-25', 2);

  assert.equal(parsed.waterMl, 750);
  assert.equal(parsed.workout?.modality, 'Wellhub — Pilates');
  assert.equal(parsed.workout?.durationMin, 50);
  assert.equal(parsed.lumbarUpdate?.lumbarNow, 3);
  assert.equal(parsed.lumbarUpdate?.rightLegRadiation, false);
  assert.equal(parsed.mood?.energy, 'Baixa');
  assert.ok(parsed.medications?.some((m) => m.name === 'Dipirona' && m.timeApprox === '08:00'));
  assert.ok(parsed.medications?.some((m) => m.name === 'Creatina'));
  assert.equal(parsed.bodyMeasurement?.weightKg, 82.5);
  assert.equal(parsed.bodyMeasurement?.waistCm, 85);

  // Verify yesterday rest + afternoon sleep ("2 da tarde ate 7")
  const yesterdayRest = parseUniversalVoiceDiary(
    'Ontem fiz descanso consciente e dormi das 2 da tarde até 7, bebi 2 copos',
    '2026-11-25',
    2
  );
  assert.equal(yesterdayRest.targetDate, '2026-11-24');
  assert.equal(yesterdayRest.dateLabel, 'Ontem');
  assert.equal(yesterdayRest.consciousRest?.enabled, true);
  assert.equal(yesterdayRest.workout, undefined);
  assert.equal(yesterdayRest.waterMl, 500);
  assert.equal(yesterdayRest.sleepSegments?.[0].blocks[0].bedTime, '14:00');
  assert.equal(yesterdayRest.sleepSegments?.[0].blocks[0].wakeTime, '19:00');
});

test('body metrics for 1.72m calculate BMI, waist/height ratio, dynamic water goal (38ml/kg), and scaled calories', () => {
  const metrics = calculateBodyMetrics(80, 84, 172);
  assert.equal(metrics.bmi, 27.0);
  assert.equal(metrics.bmiLabel, 'Sobrepeso');
  assert.equal(metrics.waistToHeightRatio, 0.49);
  assert.equal(metrics.waistStatus, 'ideal');

  assert.equal(getDailyWaterGoalMl(80), 3040);
  assert.equal(getDailyWaterGoalMl(undefined), 3000);
  assert.ok(estimateCalories('Areia / Orla', 60, 90) > estimateCalories('Areia / Orla', 60, 70));
});

test('legacy voice check-in parser still handles Wellhub Pilates and durations accurately', () => {
  const parsed = parseVoiceCheckIn(
    'Fiz Pilates pelo Wellhub por 1 hora e 15, esforço 3, lombar antes 4 depois 2, gravei vídeo pro @metaexplicada'
  );
  assert.equal(parsed.modality, 'Wellhub — Pilates');
  assert.equal(parsed.isWellhub, true);
  assert.equal(parsed.durationMin, 75);
  assert.equal(parsed.effort, 3);
  assert.equal(parsed.lumbarBefore, 4);
  assert.equal(parsed.lumbarAfter, 2);
  assert.equal(parsed.hasMediaForInsta, true);
});

test('non-destructive migration preserves existing entries while ensuring Days 01, 02, 03, and 04 exist', () => {
  const legacyState = {
    version: 31,
    stance: 'Goofy' as const,
    checkIns: [
      {
        id: 'custom-user-workout',
        date: '2026-11-25',
        dayNumber: 5,
        modality: 'Wellhub — Pilates' as const,
        durationMin: 50,
        calories: 190,
        lumbarBefore: 3,
        lumbarAfter: 1,
        rightLegRadiation: false,
        effort: 3,
        location: 'João Pessoa - PB',
        note: 'Treino salvo pelo usuário',
        hasMediaForInsta: true,
        createdAt: '2026-11-25T10:00:00.000Z',
      },
    ],
    sleepLogs: [],
  };

  const merged = mergeWithDefaultState(legacyState);
  assert.equal(merged.stance, 'Goofy');
  assert.equal(merged.profileHeightCm, 172);
  assert.ok(merged.checkIns.some((c) => c.id === 'custom-user-workout'));
  assert.ok(merged.checkIns.some((c) => c.date === '2026-11-21' && c.distanceKm === 8.8));
  assert.ok(merged.checkIns.some((c) => c.date === '2026-11-22' && c.modality === 'Descanso Consciente'));
  assert.ok(merged.sleepLogs.some((s) => s.date === '2026-11-21' && s.totalMinutes === 284));
  assert.ok(merged.sleepLogs.some((s) => s.date === '2026-11-22' && s.totalMinutes === 300));
  assert.ok(merged.sleepLogs.some((s) => s.date === '2026-11-23' && s.fragmented && s.feeling === 'Moído'));
  assert.ok(
    merged.sleepLogs.some(
      (s) => s.id === 'sleep-day-04-night' && s.inBedTime === '22:00' && s.totalMinutes === 330
    )
  );
  assert.ok(
    merged.sleepLogs.some(
      (s) => s.id === 'sleep-day-04-shift' && s.kind === 'upcoming_shift' && s.totalMinutes === 250
    )
  );

  const report = buildPrivateDatabaseReport(createInitialState(), 30);
  assert.ok(report.includes('RELATÓRIO CLÍNICO PRIVADO'));
  assert.ok(report.includes('1,72 m'));
});
