// @ts-check
/**
 * Pure domain core for the ครัวตำย่า demo.
 *
 * Every value that crosses a module boundary is frozen. State transitions
 * return a new state and never mutate the state they receive. The browser
 * shell owns DOM writes, timers, and storage; this file owns the rules.
 */

/** @typedef {'thai' | 'crab' | 'larb' | 'chicken'} DishId */
/** @typedef {'egg' | 'sausage' | 'plara' | 'chili' | 'greens'} ToppingId */
/** @typedef {'sour' | 'salt' | 'sweet'} TasteName */
/** @typedef {{ name: string, desc: string, price: number }} Dish */
/** @typedef {{ level: number, name: string, shu: number, quote: string, warning: string }} HeatLevel */
/** @typedef {{ name: string, price: number }} Topping */
/** @typedef {Readonly<{
 *   dish: DishId,
 *   heat: number,
 *   chilies: number,
 *   sour: number,
 *   salt: number,
 *   sweet: number,
 *   toppings: ReadonlyArray<ToppingId>,
 *   qty: number
 * }>} State */
/** @template T @typedef {{ ok: true, value: T } | { ok: false, error: string }} Result */

/**
 * @template T
 * @param {T} value
 * @returns {Result<T>}
 */
export const ok = (value) => Object.freeze({ ok: true, value });

/**
 * @param {string} error
 * @returns {Result<never>}
 */
export const err = (error) => Object.freeze({ ok: false, error });

export const STORAGE_KEY = 'kruaTumya.state.v1';
export const MAX_CHILIES = 12;
export const MAX_QTY = 9;

/** @type {Readonly<Record<DishId, Readonly<Dish>>>} */
export const DISHES = Object.freeze({
  thai: Object.freeze({
    name: 'ตำไทย',
    desc: 'มะละกอกรอบ ถั่วลิสงคั่ว พริกสดตำมือ รสกลม ๆ แบบที่ย่าทำ',
    price: 60
  }),
  crab: Object.freeze({
    name: 'ตำปูปลาร้า',
    desc: 'ปูเค็ม ปลาร้านึ่งเอง รสหมักถึงเครื่อง กลิ่นนำมาก่อนเลย',
    price: 75
  }),
  larb: Object.freeze({
    name: 'ลาบหมู',
    desc: 'หมูสับสด ข้าวคั่วหอม ใบสะระแหน่ เผ็ดลอดคอแบบไม่ต้องเร่ง',
    price: 80
  }),
  chicken: Object.freeze({
    name: 'ไก่ย่าง',
    desc: 'หมักข้ามคืน ย่างเตาถ่าน หนังกรอบ กินคู่ตำแล้วลงตัว',
    price: 120
  })
});

/** @type {ReadonlyArray<Readonly<HeatLevel>>} */
export const HEAT = Object.freeze([
  Object.freeze({
    level: 1,
    name: 'แซ่บนิด',
    shu: 1200,
    quote: '“พริกเม็ดเดียวก็พอ หลานเอาไว้กินกับข้าวหลาย ๆ คำ”',
    warning: 'ระดับนี้ยังกินข้าวได้คล่อง'
  }),
  Object.freeze({
    level: 2,
    name: 'เริ่มร้อน',
    shu: 5000,
    quote: '“เริ่มร้อนนิด ๆ ลิ้นกำลังสนุก อย่าเพิ่งรีบ”',
    warning: 'ลิ้นเริ่มอุ่น ๆ แล้ว'
  }),
  Object.freeze({
    level: 3,
    name: 'แซ่บจริง',
    shu: 12000,
    quote: '“แซ่บจริงแบบนี้แหละ ย่าตำมาสี่สิบปี”',
    warning: 'เตรียมข้าวเหนียวเพิ่มอีกก้อน'
  }),
  Object.freeze({
    level: 4,
    name: 'น้ำตาซึม',
    shu: 35000,
    quote: '“น้ำตาซึมแน่ แต่เผ็ดลอดคอจนหยุดกินไม่ได้”',
    warning: 'เตรียมน้ำแข็งไว้ใกล้มือ'
  }),
  Object.freeze({
    level: 5,
    name: 'ย่าห้ามไว้',
    shu: 80000,
    quote: '“ย่าห้ามไว้แล้วนะ ถ้าหลานยังเอาต่อ ย่าก็จะตำให้”',
    warning: 'ย่าไม่รับปากเรื่องน้ำตา'
  })
]);

const CHILIES_BY_HEAT = Object.freeze([1, 3, 5, 7, 10]);

/** @type {ReadonlyArray<ToppingId>} */
const TOPPING_IDS = Object.freeze(['egg', 'sausage', 'plara', 'chili', 'greens']);

/** @type {Readonly<Record<ToppingId, Readonly<Topping>>>} */
const TOPPINGS = Object.freeze({
  egg: Object.freeze({ name: 'ไข่เค็ม', price: 20 }),
  sausage: Object.freeze({ name: 'หมูยอ', price: 30 }),
  plara: Object.freeze({ name: 'น้ำปลาร้าเพิ่ม', price: 10 }),
  chili: Object.freeze({ name: 'พริกเพิ่ม', price: 5 }),
  greens: Object.freeze({ name: 'ผักเพิ่ม', price: 0 })
});

/** @type {Readonly<Record<TasteName, Readonly<{ short: ReadonlyArray<string>, labels: ReadonlyArray<string> }>>>} */
const TASTE = Object.freeze({
  sour: Object.freeze({
    short: Object.freeze(['', 'เปรี้ยวน้อย', 'เปรี้ยวกำลังดี', 'เปรี้ยวซัด']),
    labels: Object.freeze(['เปรี้ยวน้อย', 'กำลังดี', 'เปรี้ยวซัด'])
  }),
  salt: Object.freeze({
    short: Object.freeze(['', 'ปลาร้าอ่อน', 'หมักกำลังดี', 'ปลาร้าแน่น']),
    labels: Object.freeze(['อ่อนปลาร้า', 'หมักกำลังดี', 'ปลาร้าแน่น'])
  }),
  sweet: Object.freeze({
    short: Object.freeze(['', 'ไม่หวาน', 'หวานนิด', 'หวานนำ']),
    labels: Object.freeze(['ไม่หวาน', 'หวานนิด', 'หวานนำ'])
  })
});

/** @type {State} */
export const DEFAULT_STATE = Object.freeze({
  dish: /** @type {DishId} */ ('thai'),
  heat: 3,
  chilies: 5,
  sour: 2,
  salt: 2,
  sweet: 2,
  toppings: Object.freeze([]),
  qty: 1
});

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');
/**
 * @param {object} object
 * @param {string} key
 * @returns {boolean}
 */
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
const clampInt = (value, min, max, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

/**
 * @param {unknown} value
 * @returns {value is DishId}
 */
export const isDishId = (value) => typeof value === 'string' && hasOwn(DISHES, value);

/**
 * @param {unknown} value
 * @returns {value is ToppingId}
 */
export const isToppingId = (value) => typeof value === 'string' && hasOwn(TOPPINGS, value);

/**
 * @param {number} count
 * @returns {number} 1–5
 */
export const heatForChilies = (count) => {
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  if (count <= 9) return 4;
  return 5;
};

/**
 * @param {number} level
 * @returns {number}
 */
export const chiliesForHeat = (level) =>
  CHILIES_BY_HEAT[Math.min(5, Math.max(1, Math.trunc(level))) - 1];

/**
 * @param {number} level
 * @returns {number}
 */
export const needleTarget = (level) => -90 + ((Math.min(5, Math.max(1, level)) - 1) * 45);

/**
 * @param {number} value
 * @returns {string}
 */
export const formatNumber = (value) => NUMBER_FORMAT.format(value);

/**
 * @param {number} value
 * @returns {string}
 */
export const formatBaht = (value) => `฿${formatNumber(value)}`;

/**
 * @param {unknown} data
 * @returns {State}
 */
export const sanitizeState = (data) => {
  if (data === null || typeof data !== 'object') return DEFAULT_STATE;

  const source = /** @type {Record<string, unknown>} */ (data);
  const dish = isDishId(source.dish) ? source.dish : DEFAULT_STATE.dish;
  let chilies = clampInt(source.chilies, 1, MAX_CHILIES, DEFAULT_STATE.chilies);

  if (source.chilies == null && source.heat != null) {
    chilies = chiliesForHeat(clampInt(source.heat, 1, 5, DEFAULT_STATE.heat));
  }

  const rawToppings = Array.isArray(source.toppings) ? source.toppings : [];
  /** @type {ToppingId[]} */
  const uniqueToppings = [];
  for (const id of rawToppings) {
    if (isToppingId(id) && !uniqueToppings.includes(id)) uniqueToppings.push(id);
  }

  return Object.freeze({
    dish,
    chilies,
    heat: heatForChilies(chilies),
    sour: clampInt(source.sour, 1, 3, DEFAULT_STATE.sour),
    salt: clampInt(source.salt, 1, 3, DEFAULT_STATE.salt),
    sweet: clampInt(source.sweet, 1, 3, DEFAULT_STATE.sweet),
    toppings: Object.freeze(uniqueToppings),
    qty: clampInt(source.qty, 1, MAX_QTY, DEFAULT_STATE.qty)
  });
};

/**
 * @param {string} raw
 * @returns {Result<State>}
 */
export const parseStoredState = (raw) => {
  try {
    const saved = JSON.parse(raw);
    if (saved === null || typeof saved !== 'object') {
      return err('unsupported-state-version');
    }
    if (saved.v === 1) return ok(sanitizeState(saved.state));
    if (saved.v === undefined) return ok(sanitizeState(saved));
    return err('unsupported-state-version');
  } catch {
    return err('invalid-json');
  }
};

/**
 * @param {State} state
 * @returns {string}
 */
export const serializeState = (state) => JSON.stringify({ v: 1, state });

/**
 * @param {State} state
 * @returns {ReadonlyArray<string>}
 */
export const toppingNames = (state) =>
  Object.freeze(TOPPING_IDS.filter((id) => state.toppings.includes(id)).map((id) => TOPPINGS[id].name));

/**
 * @param {State} state
 * @returns {number}
 */
const toppingsTotal = (state) =>
  state.toppings.reduce((sum, id) => sum + TOPPINGS[id].price, 0);

/**
 * @param {State} state
 * @returns {Readonly<{ base: number, extras: number, perPlate: number, total: number }>}
 */
export const totals = (state) => {
  const base = DISHES[state.dish].price;
  const extras = toppingsTotal(state);
  return Object.freeze({
    base,
    extras,
    perPlate: base + extras,
    total: (base + extras) * state.qty
  });
};

/**
 * @param {State} state
 * @returns {string}
 */
export const tasteSummary = (state) =>
  [TASTE.sour.short[state.sour], TASTE.salt.short[state.salt], TASTE.sweet.short[state.sweet]].join(' · ');

/**
 * @param {State} state
 * @param {DishId} dish
 * @returns {State}
 */
export const setDish = (state, dish) => Object.freeze({ ...state, dish });

/**
 * @param {State} state
 * @param {number} level
 * @returns {State}
 */
export const setHeat = (state, level) => {
  const heat = clampInt(level, 1, 5, DEFAULT_STATE.heat);
  return Object.freeze({ ...state, heat, chilies: chiliesForHeat(heat) });
};

/**
 * @param {State} state
 * @param {number} count
 * @returns {State}
 */
export const setChilies = (state, count) => {
  const chilies = clampInt(count, 1, MAX_CHILIES, DEFAULT_STATE.chilies);
  return Object.freeze({ ...state, chilies, heat: heatForChilies(chilies) });
};

/**
 * @param {State} state
 * @param {TasteName} name
 * @param {number} value
 * @returns {State}
 */
export const setTaste = (state, name, value) =>
  Object.freeze({ ...state, [name]: clampInt(value, 1, 3, DEFAULT_STATE[name]) });

/**
 * @param {State} state
 * @param {ToppingId} id
 * @returns {State}
 */
export const toggleTopping = (state, id) => {
  if (!isToppingId(id)) return state;
  const selected = state.toppings.includes(id);
  return Object.freeze({
    ...state,
    toppings: Object.freeze(
      selected ? state.toppings.filter((toppingId) => toppingId !== id) : [...state.toppings, id]
    )
  });
};

/**
 * @param {State} state
 * @param {number} qty
 * @returns {State}
 */
export const setQty = (state, qty) =>
  Object.freeze({ ...state, qty: clampInt(qty, 1, MAX_QTY, DEFAULT_STATE.qty) });

/**
 * The "ให้ย่าตำให้" preset: reset heat, taste, and toppings, but keep the
 * chosen dish and quantity exactly as the customer set them.
 *
 * @param {State} state
 * @returns {State}
 */
export const applyGrandmaStandard = (state) =>
  Object.freeze({
    ...state,
    heat: 3,
    chilies: 5,
    sour: 2,
    salt: 2,
    sweet: 2,
    toppings: Object.freeze([])
  });
