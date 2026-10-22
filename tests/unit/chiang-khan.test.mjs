// @ts-check
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MIN_PLAN_STOPS,
  formatBaht,
  formatMinutes,
  initialState,
  isPlanDirty,
  parseContent,
  parseShareHash,
  parseStopId,
  parseStoredState,
  planSummary,
  savePlan,
  selectRandomPlan,
  serializeStored,
  setPlanStop,
  shareHash,
  slotLabel,
  toggleStamp,
  withStamps
} from '../../assets/chiang-khan/js/core.mjs';

/** @typedef {Parameters<typeof toggleStamp>[1]} StopId */

const fixture = {
  slots: [
    { key: 'morning', label: 'เช้า' },
    { key: 'late-morning', label: 'สาย' },
    { key: 'afternoon', label: 'บ่าย' },
    { key: 'evening', label: 'เย็น' }
  ],
  stops: [
    {
      id: 'alms',
      day: 1,
      slot: 'morning',
      time: '06:00',
      duration: 45,
      travel: 0,
      cost: 100,
      title: 'ใส่บาตรยามเช้า',
      short: 'ใส่บาตร',
      illustration: 'alms',
      blurb: 'ข้าวเหนียวอุ่น ๆ',
      note: 'แต่งกายสุภาพ'
    },
    {
      id: 'street',
      day: 1,
      slot: 'morning',
      time: '07:30',
      duration: 60,
      travel: 5,
      cost: 0,
      title: 'ถนนบ้านไม้เก่า',
      short: 'บ้านไม้เก่า',
      illustration: 'street',
      blurb: 'บ้านไม้สองชั้น',
      note: 'เดินตอนเช้า'
    },
    {
      id: 'coffee',
      day: 1,
      slot: 'late-morning',
      time: '09:00',
      duration: 45,
      travel: 5,
      cost: 80,
      title: 'กาแฟริมโขง',
      short: 'กาแฟ',
      illustration: 'coffee',
      blurb: 'นั่งร้านเล็ก ๆ',
      note: 'ร้านเปิดสาย'
    },
    {
      id: 'temple',
      day: 1,
      slot: 'late-morning',
      time: '10:30',
      duration: 45,
      travel: 10,
      cost: 20,
      title: 'วัดศรีคุณเมือง',
      short: 'วัด',
      illustration: 'temple',
      blurb: 'วัดคู่เมือง',
      note: 'แต่งกายสุภาพ'
    },
    {
      id: 'kaeng',
      day: 2,
      slot: 'morning',
      time: '05:45',
      duration: 60,
      travel: 30,
      cost: 100,
      title: 'แก่งคุดคู้',
      short: 'แก่งคุดคู้',
      illustration: 'kaeng',
      blurb: 'แก่งหินกลางโขง',
      note: 'จองรถล่วงหน้า'
    }
  ],
  day_notes: [
    { day: 1, slot: 'morning', title: 'เช้าที่ไม่ต้องรีบ', text: 'ค่อย ๆ เริ่มวัน' },
    { day: 1, slot: 'afternoon', title: 'พักร้อนริมโขง', text: 'นั่งใต้ต้นไม้' },
    { day: 1, slot: 'evening', title: 'ถนนคนเดิน', text: 'ตลาดเปิดตอนเย็น' },
    { day: 2, slot: 'late-morning', title: 'ตลาดเช้า', text: 'เตรียมกลับ' }
  ],
  budget: {
    food: 250,
    local_transport: 80,
    bicycle: 100,
    bicycle_stops: ['street', 'coffee', 'temple'],
    labels: {
      food: 'ค่าอาหาร',
      local_transport: 'ค่าเดินทาง',
      bicycle: 'ค่าจักรยาน',
      stops: 'ค่าหมุด'
    }
  }
};

/**
 * @template T
 * @param {{ ok: true, value: T } | { ok: false, error: string }} result
 * @returns {T}
 */
const unwrap = (result) => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

/**
 * @param {{ ok: true, value: unknown } | { ok: false, error: string }} result
 * @param {RegExp} pattern
 */
const expectError = (result, pattern) => {
  if (result.ok) throw new Error('Expected an error result');
  assert.match(result.error, pattern);
};

const content = unwrap(parseContent(JSON.stringify(fixture)));
const empty = initialState(null);

/**
 * @param {ReadonlyArray<StopId>} ids
 * @returns {import('../../assets/chiang-khan/js/core.mjs').AppState}
 */
const stateWithStamps = (ids) => {
  let state = empty;
  for (const id of ids) state = toggleStamp(state, id, content);
  return state;
};

/**
 * @param {ReadonlyArray<StopId>} ids
 * @returns {import('../../assets/chiang-khan/js/core.mjs').AppState}
 */
const stateWithPlan = (ids) => {
  let state = empty;
  for (const id of ids) state = unwrap(setPlanStop(state, id, true, content));
  return state;
};

/** @type {ReadonlyArray<StopId>} */
const THREE_STOPS = ['alms', 'coffee', 'temple'];

test('content parsing accepts the sample data and freezes every level', () => {
  assert.equal(content.stops.length, 5);
  assert.equal(content.slots.length, 4);
  assert.equal(content.dayNotes.length, 4);
  assert.equal(content.byId.kaeng.title, 'แก่งคุดคู้');
  assert.ok(Object.isFrozen(content));
  assert.ok(Object.isFrozen(content.stops));
  assert.ok(Object.isFrozen(content.stops[0]));
  assert.ok(Object.isFrozen(content.slots));
  assert.ok(Object.isFrozen(content.dayNotes));
  assert.ok(Object.isFrozen(content.budget));
  assert.ok(Object.isFrozen(content.budget.labels));
  assert.ok(Object.isFrozen(content.budget.bicycleStops));
  assert.ok(Object.isFrozen(content.byId));
});

test('content parsing rejects malformed content as a value', () => {
  expectError(parseContent(''), /empty/i);
  expectError(parseContent('{'), /JSON/i);
  expectError(parseContent(JSON.stringify({ ...fixture, stops: fixture.stops.slice(0, 4) })), /five stops/i);
  expectError(parseContent(JSON.stringify({ ...fixture, slots: fixture.slots.slice(0, 3) })), /four/i);
  expectError(
    parseContent(JSON.stringify({ ...fixture, budget: { ...fixture.budget, food: -1 } })),
    /non-negative/i
  );
});

test('parseStopId only accepts ids present in the content', () => {
  assert.deepEqual(unwrap(parseStopId('alms', content)), 'alms');
  expectError(parseStopId('nope', content), /unknown/i);
  expectError(parseStopId(null, content), /unknown/i);
});

test('stamps toggle independently from the plan and stay canonical', () => {
  const stamps = stateWithStamps(['temple', 'alms']);
  assert.deepEqual(stamps.stamps, ['alms', 'temple']);
  assert.deepEqual(stamps.draft, []);
  const removed = toggleStamp(stamps, 'alms', content);
  assert.deepEqual(removed.stamps, ['temple']);
  assert.deepEqual(stamps.stamps, ['alms', 'temple']);
  assert.ok(Object.isFrozen(stamps.stamps));
  assert.ok(Object.isFrozen(removed.stamps));
});

test('withStamps replaces the stamp set without touching the plan', () => {
  const state = stateWithPlan(THREE_STOPS);
  const replaced = withStamps(state, ['kaeng', 'alms'], content);
  assert.deepEqual(replaced.stamps, ['alms', 'kaeng']);
  assert.deepEqual(replaced.draft, state.draft);
  assert.equal(replaced.saved, state.saved);
});

test('the planner rules and summary use the sample data', () => {
  const state = stateWithPlan(content.stops.map((stop) => stop.id));
  const summary = planSummary(state.draft, content);
  assert.equal(summary.count, 5);
  assert.equal(summary.canSave, true);
  assert.equal(summary.isComplete, true);
  assert.equal(summary.totalMinutes, 305);
  assert.equal(summary.totalCost, 730);
  assert.deepEqual(
    summary.budgetRows.map((row) => row.amount),
    [250, 80, 100, 300]
  );
  assert.equal(summary.days.length, 2);
  assert.deepEqual(
    summary.days[0].entries.map((entry) => entry.tag),
    ['stop', 'stop', 'stop', 'stop', 'note', 'note']
  );
  assert.deepEqual(
    summary.days[1].entries.map((entry) => entry.tag),
    ['stop', 'note']
  );
  assert.deepEqual(summary.days[0].entries[0].tag, 'stop');
});

test('a selected stop suppresses the day note in the same slot', () => {
  const summary = planSummary(['alms'], content);
  assert.equal(summary.days[0].entries[0].tag, 'stop');
  assert.equal(
    summary.days[0].entries.some(
      (entry) => entry.tag === 'note' && entry.note.title === 'เช้าที่ไม่ต้องรีบ'
    ),
    false
  );
});

test('a day with no stops or notes produces the empty timeline entry', () => {
  const noNotes = unwrap(parseContent(JSON.stringify({ ...fixture, day_notes: [] })));
  const summary = planSummary(['alms'], noNotes);
  assert.deepEqual(
    summary.days.map((day) => day.entries.map((entry) => entry.tag)),
    [['stop'], ['empty']]
  );
  const empty = summary.days[1].entries[0];
  assert.equal(empty.tag, 'empty');
  if (empty.tag !== 'empty') throw new Error('Expected the empty entry');
  assert.equal(empty.day, 2);
});

test('the bicycle cost appears only when a bicycle stop is selected', () => {
  const withoutBike = planSummary(['alms', 'kaeng'], content);
  assert.equal(withoutBike.totalCost, 530);
  assert.deepEqual(withoutBike.budgetRows.map((row) => row.label), ['ค่าอาหาร', 'ค่าเดินทาง', 'ค่าหมุด']);

  const withBike = planSummary(['alms', 'coffee', 'temple'], content);
  assert.equal(withBike.totalCost, 630);
  assert.deepEqual(
    withBike.budgetRows.map((row) => row.amount),
    [250, 80, 100, 200]
  );
});

test('the planner accepts removals and rejects unknown stops', () => {
  let state = stateWithPlan(THREE_STOPS);
  assert.equal(planSummary(state.draft, content).canSave, true);
  state = unwrap(setPlanStop(state, 'coffee', false, content));
  assert.deepEqual(state.draft, ['alms', 'temple']);
  assert.equal(planSummary(state.draft, content).canSave, false);
  expectError(
    setPlanStop(state, /** @type {StopId} */ ('nope'), true, content),
    /unknown/i
  );
});

test('saving is an explicit snapshot and a dirty draft does not replace it', () => {
  let state = stateWithPlan(THREE_STOPS);
  expectError(savePlan(stateWithPlan(['alms', 'coffee']), content), /at least/i);
  state = unwrap(savePlan(state, content));
  assert.deepEqual(state.saved, THREE_STOPS);
  assert.equal(isPlanDirty(state), false);

  state = unwrap(setPlanStop(state, 'coffee', false, content));
  assert.equal(isPlanDirty(state), true);
  assert.deepEqual(state.saved, THREE_STOPS);

  const reloaded = initialState(unwrap(parseStoredState(serializeStored(state), content)));
  assert.deepEqual(reloaded.draft, THREE_STOPS);
  assert.deepEqual(reloaded.saved, THREE_STOPS);
  assert.deepEqual(reloaded.stamps, []);
});

test('stored state is parsed defensively and round-trips', () => {
  const stored = unwrap(
    parseStoredState(
      JSON.stringify({
        version: 1,
        stamps: ['coffee', 'alms', 'unknown'],
        saved: ['coffee', 'alms', 'street']
      }),
      content
    )
  );
  assert.deepEqual(stored.stamps, ['alms', 'coffee']);
  assert.deepEqual(stored.saved, ['alms', 'street', 'coffee']);

  expectError(parseStoredState('', content), /no stored/i);
  expectError(parseStoredState('{', content), /JSON/i);
  expectError(parseStoredState(JSON.stringify({ version: 2 }), content), /unsupported/i);
  expectError(
    parseStoredState(JSON.stringify({ version: 1, stamps: 'alms', saved: null }), content),
    /stamps/i
  );

  const shortSaved = unwrap(
    parseStoredState(
      JSON.stringify({ version: 1, stamps: ['alms'], saved: ['alms', 'coffee'] }),
      content
    )
  );
  assert.equal(shortSaved.saved, null);

  const state = stateWithStamps(['alms', 'coffee']);
  const parsed = unwrap(parseStoredState(serializeStored(state), content));
  assert.deepEqual(parsed.stamps, ['alms', 'coffee']);
  assert.equal(parsed.saved, null);
});

test('share hashes are canonical, forgiving, and reject empty input', () => {
  assert.equal(shareHash(['alms', 'coffee']), '#stamps=alms,coffee');
  assert.equal(shareHash([]), '');
  assert.deepEqual(unwrap(parseShareHash('#stamps=coffee,alms', content)), ['alms', 'coffee']);
  assert.deepEqual(unwrap(parseShareHash('#stamps=temple,unknown,alms', content)), ['alms', 'temple']);
  assert.deepEqual(unwrap(parseShareHash('stamps=temple', content)), ['temple']);
  expectError(parseShareHash('', content), /no share/i);
  expectError(parseShareHash('#planner', content), /no stamps/i);
  expectError(parseShareHash('#stamps=', content), /no known/i);
  expectError(parseShareHash('#stamps=%E0%A4%A', content), /not valid/i);
});

test('random plans are deterministic for a supplied source and stay canonical', () => {
  const state = empty;
  const three = selectRandomPlan(state, () => 0, content);
  assert.equal(three.draft.length, MIN_PLAN_STOPS);
  const five = selectRandomPlan(state, () => 0.999, content);
  assert.equal(five.draft.length, 5);
  const repeated = selectRandomPlan(state, () => 0.4, content);
  const repeatedAgain = selectRandomPlan(state, () => 0.4, content);
  assert.deepEqual(repeated.draft, repeatedAgain.draft);
  assert.deepEqual(state.draft, []);
  assert.ok(Object.isFrozen(repeated.draft));
});

test('formatting and slot labels are stable', () => {
  assert.equal(formatMinutes(0), '0 น.');
  assert.equal(formatMinutes(45), '45 น.');
  assert.equal(formatMinutes(60), '1 ชม.');
  assert.equal(formatMinutes(305), '5 ชม. 5 น.');
  assert.equal(formatMinutes(-5), '0 น.');
  assert.equal(formatBaht(730), '730 บาท');
  assert.equal(formatBaht(1000), '1,000 บาท');
  assert.equal(formatBaht(Number.NaN), '0 บาท');
  assert.equal(formatBaht(-5), '0 บาท');
  assert.equal(slotLabel(content, 'late-morning'), 'สาย');
  assert.equal(slotLabel(content, 'evening'), 'เย็น');
});

test('empty plans have no days or totals', () => {
  const summary = planSummary([], content);
  assert.equal(summary.count, 0);
  assert.equal(summary.days.length, 0);
  assert.equal(summary.totalMinutes, 0);
  assert.equal(summary.totalCost, 0);
  assert.equal(summary.canSave, false);
  assert.equal(summary.isComplete, false);
});

test('initial state is frozen and empty without stored data', () => {
  assert.deepEqual(empty.stamps, []);
  assert.deepEqual(empty.draft, []);
  assert.equal(empty.saved, null);
  assert.ok(Object.isFrozen(empty));
  assert.ok(Object.isFrozen(empty.stamps));
  assert.ok(Object.isFrozen(empty.draft));
});
