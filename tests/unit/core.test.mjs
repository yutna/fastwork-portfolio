// @ts-check
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_STATE,
  DISHES,
  HEAT,
  MAX_CHILIES,
  applyGrandmaStandard,
  chiliesForHeat,
  formatBaht,
  heatForChilies,
  needleTarget,
  parseStoredState,
  sanitizeState,
  serializeState,
  setChilies,
  setDish,
  setHeat,
  setQty,
  setTaste,
  tasteSummary,
  toggleTopping,
  toppingNames,
  totals
} from '../../assets/krua-tumya/js/core.mjs';

test('default state is the advertised starting plate', () => {
  assert.equal(DEFAULT_STATE.dish, 'thai');
  assert.equal(DEFAULT_STATE.heat, 3);
  assert.equal(DEFAULT_STATE.chilies, 5);
  assert.deepEqual(DEFAULT_STATE.toppings, []);
  assert.equal(totals(DEFAULT_STATE).total, 60);
  assert.equal(tasteSummary(DEFAULT_STATE), 'เปรี้ยวกำลังดี · หมักกำลังดี · หวานนิด');
  assert.equal(formatBaht(60), '฿60');
});

test('the heat scale maps chili counts consistently', () => {
  assert.deepEqual(
    Array.from({ length: 12 }, (_, index) => heatForChilies(index + 1)),
    [1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5]
  );
  assert.deepEqual(
    Array.from({ length: 5 }, (_, index) => chiliesForHeat(index + 1)),
    [1, 3, 5, 7, 10]
  );
  assert.deepEqual(
    HEAT.map((level) => needleTarget(level.level)),
    [-90, -45, 0, 45, 90]
  );
});

test('state transitions return new frozen values without mutating the input', () => {
  const before = DEFAULT_STATE;
  const hot = setHeat(before, 5);
  assert.notEqual(hot, before);
  assert.equal(hot.heat, 5);
  assert.equal(hot.chilies, 10);
  assert.equal(before.heat, 3);
  assert.equal(before.chilies, 5);
  assert.ok(Object.isFrozen(hot));

  const chili = setChilies(before, 12);
  assert.equal(chili.chilies, 12);
  assert.equal(chili.heat, 5);

  const crab = setDish(before, 'crab');
  assert.equal(crab.dish, 'crab');

  const three = setQty(before, 3);
  assert.equal(three.qty, 3);
  assert.equal(totals(three).total, 180);

  const sour = setTaste(before, 'sour', 3);
  assert.equal(sour.sour, 3);
  assert.equal(before.sour, 2);
});

test('toppings are unique, ordered, and removable', () => {
  const one = toggleTopping(DEFAULT_STATE, 'egg');
  const two = toggleTopping(one, 'egg');
  const three = toggleTopping(one, 'chili');
  assert.deepEqual(one.toppings, ['egg']);
  assert.deepEqual(two.toppings, []);
  assert.deepEqual(three.toppings, ['egg', 'chili']);
  assert.deepEqual(toppingNames(three), ['ไข่เค็ม', 'พริกเพิ่ม']);
  assert.equal(DISHES.thai.price + 20 + 5, 85);
  assert.equal(toggleTopping(one, /** @type {never} */ ('not-a-topping')), one);
});

test('totals are per plate and multiplied by quantity', () => {
  const loaded = toggleTopping(
    toggleTopping(setQty(setDish(DEFAULT_STATE, 'larb'), 2), 'egg'),
    'plara'
  );
  const money = totals(loaded);
  assert.deepEqual(money, { base: 80, extras: 30, perPlate: 110, total: 220 });
  assert.equal(Object.isFrozen(money), true);
});

test('grandma standard resets heat and taste but keeps dish and quantity', () => {
  const custom = setQty(
    setChilies(setTaste(setDish(DEFAULT_STATE, 'chicken'), 'sweet', 3), 11),
    4
  );
  const standard = applyGrandmaStandard(custom);
  assert.equal(standard.dish, 'chicken');
  assert.equal(standard.qty, 4);
  assert.equal(standard.heat, 3);
  assert.equal(standard.chilies, 5);
  assert.equal(standard.sour, 2);
  assert.equal(standard.salt, 2);
  assert.equal(standard.sweet, 2);
  assert.deepEqual(standard.toppings, []);
  assert.equal(custom.chilies, 11);
  assert.equal(custom.sweet, 3);
});

test('sanitizeState repairs hostile or stale stored data', () => {
  const repaired = sanitizeState({
    dish: 'unknown',
    chilies: 99,
    sour: 0,
    salt: '3',
    sweet: 'nope',
    toppings: ['egg', 'egg', 'not-real', 'chili'],
    qty: 100
  });
  assert.equal(repaired.dish, 'thai');
  assert.equal(repaired.chilies, MAX_CHILIES);
  assert.equal(repaired.heat, 5);
  assert.equal(repaired.sour, 1);
  assert.equal(repaired.salt, 3);
  assert.equal(repaired.sweet, 2);
  assert.deepEqual(repaired.toppings, ['egg', 'chili']);
  assert.equal(repaired.qty, 9);

  const fromHeat = sanitizeState({ heat: 5, chilies: undefined });
  assert.equal(fromHeat.chilies, 10);
  assert.equal(sanitizeState(null), DEFAULT_STATE);

  const input = { dish: 'crab', toppings: ['egg'] };
  sanitizeState(input);
  assert.deepEqual(input, { dish: 'crab', toppings: ['egg'] });
});

test('stored state parsing returns a Result instead of throwing', () => {
  const good = parseStoredState(serializeState(setDish(DEFAULT_STATE, 'crab')));
  assert.equal(good.ok, true);
  if (good.ok) assert.equal(good.value.dish, 'crab');

  const badJson = parseStoredState('{');
  assert.equal(badJson.ok, false);
  if (!badJson.ok) assert.equal(badJson.error, 'invalid-json');

  const wrongVersion = parseStoredState(JSON.stringify({ v: 2, state: DEFAULT_STATE }));
  assert.equal(wrongVersion.ok, false);
  if (!wrongVersion.ok) assert.equal(wrongVersion.error, 'unsupported-state-version');

  const legacy = parseStoredState(JSON.stringify({ ...DEFAULT_STATE, dish: 'chicken' }));
  assert.equal(legacy.ok, true);
  if (legacy.ok) assert.equal(legacy.value.dish, 'chicken');
});

test('the catalog itself is frozen', () => {
  assert.ok(Object.isFrozen(DISHES));
  assert.ok(Object.isFrozen(DISHES.thai));
  assert.ok(Object.isFrozen(HEAT));
  assert.ok(Object.isFrozen(HEAT[0]));
  assert.ok(Object.isFrozen(DEFAULT_STATE.toppings));
});
