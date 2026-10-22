// @ts-check
/**
 * Pure domain core for the เชียงคาน — ตื่นเช้าให้ทัน demo.
 *
 * Every value that crosses a module boundary is frozen. State transitions
 * return a new state and never mutate the state they receive. The browser
 * shell owns the document, storage, timers, and animation; this file owns
 * the rules, parsing, and sample-data summaries.
 */

/** @typedef {'morning' | 'late-morning' | 'afternoon' | 'evening'} SlotKey */
/** @typedef {'alms' | 'street' | 'coffee' | 'temple' | 'kaeng'} StopId */
/** @typedef {1 | 2} Day */
/** @typedef {Readonly<{ key: SlotKey, label: string }>} Slot */
/** @typedef {Readonly<{
 *   id: StopId,
 *   day: Day,
 *   slot: SlotKey,
 *   time: string,
 *   duration: number,
 *   travel: number,
 *   cost: number,
 *   title: string,
 *   short: string,
 *   illustration: string,
 *   blurb: string,
 *   note: string
 * }>} Stop */
/** @typedef {Readonly<{ day: Day, slot: SlotKey, title: string, text: string }>} DayNote */
/** @typedef {Readonly<{
 *   food: number,
 *   localTransport: number,
 *   bicycle: number,
 *   bicycleStops: ReadonlyArray<StopId>,
 *   labels: Readonly<{
 *     food: string,
 *     localTransport: string,
 *     bicycle: string,
 *     stops: string
 *   }>
 * }>} Budget */
/** @typedef {Readonly<{
 *   slots: ReadonlyArray<Slot>,
 *   stops: ReadonlyArray<Stop>,
 *   byId: Readonly<Record<StopId, Stop>>,
 *   dayNotes: ReadonlyArray<DayNote>,
 *   budget: Budget
 * }>} Content */
/** @typedef {Readonly<{
 *   stamps: ReadonlyArray<StopId>,
 *   draft: ReadonlyArray<StopId>,
 *   saved: ReadonlyArray<StopId> | null
 * }>} AppState */
/** @typedef {Readonly<{
 *   version: 1,
 *   stamps: ReadonlyArray<StopId>,
 *   saved: ReadonlyArray<StopId> | null
 * }>} StoredState */
/** @typedef {Readonly<{ label: string, amount: number }>} BudgetRow */
/** @typedef {
 *   | Readonly<{ tag: 'stop', stop: Stop }>
 *   | Readonly<{ tag: 'note', note: DayNote }>
 *   | Readonly<{ tag: 'empty', day: Day }>
 * } TimelineEntry */
/** @typedef {Readonly<{
 *   day: Day,
 *   entries: ReadonlyArray<TimelineEntry>,
 *   totalMinutes: number,
 *   totalCost: number
 * }>} DayPlan */
/** @typedef {Readonly<{
 *   count: number,
 *   stops: ReadonlyArray<Stop>,
 *   days: ReadonlyArray<DayPlan>,
 *   totalMinutes: number,
 *   totalCost: number,
 *   budgetRows: ReadonlyArray<BudgetRow>,
 *   canSave: boolean,
 *   isComplete: boolean
 * }>} PlanSummary */
/** @template T @typedef {{ ok: true, value: T } | { ok: false, error: string }} Result */

/**
 * @template T
 * @param {T} value
 * @returns {Result<T>}
 */
const ok = (value) => Object.freeze({ ok: true, value });

/**
 * @param {string} error
 * @returns {Result<never>}
 */
const err = (error) => Object.freeze({ ok: false, error });

export const STORAGE_KEY = 'chiangKhan.demo.v1';
export const MIN_PLAN_STOPS = 3;

/** @type {ReadonlyArray<StopId>} */
const STOP_IDS = Object.freeze(['alms', 'street', 'coffee', 'temple', 'kaeng']);

/** @type {ReadonlyArray<SlotKey>} */
const SLOT_KEYS = Object.freeze(['morning', 'late-morning', 'afternoon', 'evening']);

/** @type {ReadonlyArray<Day>} */
const DAYS = Object.freeze([1, 2]);

/** @type {ReadonlyArray<StopId>} */
const NO_STOPS = Object.freeze([]);

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param {unknown} value
 * @returns {value is StopId}
 */
const isStopId = (value) => {
  if (typeof value !== 'string') return false;
  return STOP_IDS.some((id) => id === value);
};

/**
 * @param {unknown} value
 * @returns {value is SlotKey}
 */
const isSlotKey = (value) => {
  if (typeof value !== 'string') return false;
  return SLOT_KEYS.some((key) => key === value);
};

/**
 * @param {unknown} value
 * @returns {number | null}
 */
const nonNegativeInt = (value) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;

/**
 * @param {unknown} value
 * @returns {string | null}
 */
const nonEmptyString = (value) =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

/**
 * @param {unknown} value
 * @returns {value is Day}
 */
const isDay = (value) => value === 1 || value === 2;

/**
 * @param {ReadonlyArray<unknown>} values
 * @param {Content} content
 * @returns {ReadonlyArray<StopId>}
 */
const canonicalStops = (values, content) =>
  Object.freeze(content.stops.map((stop) => stop.id).filter((id) => values.includes(id)));

/**
 * @param {unknown} raw
 * @returns {Result<ReadonlyArray<Slot>>}
 */
const parseSlots = (raw) => {
  if (!Array.isArray(raw) || raw.length !== SLOT_KEYS.length) {
    return err('Expected four planner slots');
  }
  /** @type {Slot[]} */
  const parsed = [];
  const seen = new Set();
  for (const item of raw) {
    if (!isRecord(item)) return err('A planner slot is not an object');
    if (!isSlotKey(item.key)) return err('A planner slot has an unknown key');
    const label = nonEmptyString(item.label);
    if (label === null) return err('A planner slot has no label');
    if (seen.has(item.key)) return err('Duplicate planner slot');
    seen.add(item.key);
    parsed.push(Object.freeze({ key: item.key, label }));
  }
  if (!SLOT_KEYS.every((key) => seen.has(key))) {
    return err('A planner slot is missing');
  }
  return ok(Object.freeze(parsed));
};

/**
 * @param {unknown} raw
 * @param {ReadonlyArray<Slot>} slots
 * @returns {Result<Stop>}
 */
const parseStop = (raw, slots) => {
  if (!isRecord(raw)) return err('A stop is not an object');
  if (!isStopId(raw.id)) return err('A stop has an unknown id');
  if (!isDay(raw.day)) return err('A stop has an invalid day');
  if (!isSlotKey(raw.slot) || !slots.some((slot) => slot.key === raw.slot)) {
    return err('A stop has an unknown slot');
  }
  const time = nonEmptyString(raw.time);
  if (time === null || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return err('A stop has an invalid time');
  }
  const duration = nonNegativeInt(raw.duration);
  const travel = nonNegativeInt(raw.travel);
  const cost = nonNegativeInt(raw.cost);
  if (duration === null || travel === null || cost === null) {
    return err('A stop has an invalid duration, travel time, or cost');
  }
  const title = nonEmptyString(raw.title);
  const short = nonEmptyString(raw.short);
  const illustration = nonEmptyString(raw.illustration);
  const blurb = nonEmptyString(raw.blurb);
  const note = nonEmptyString(raw.note);
  if (title === null || short === null || illustration === null || blurb === null || note === null) {
    return err('A stop is missing copy');
  }
  if (illustration !== raw.id) {
    return err('A stop illustration must match its id');
  }
  return ok(
    Object.freeze({
      id: raw.id,
      day: raw.day,
      slot: raw.slot,
      time,
      duration,
      travel,
      cost,
      title,
      short,
      illustration,
      blurb,
      note
    })
  );
};

/**
 * @param {unknown} raw
 * @param {ReadonlyArray<Slot>} slots
 * @returns {Result<ReadonlyArray<Stop>>}
 */
const parseStops = (raw, slots) => {
  if (!Array.isArray(raw) || raw.length !== STOP_IDS.length) {
    return err('Expected five stops');
  }
  /** @type {Stop[]} */
  const parsed = [];
  const seen = new Set();
  for (const item of raw) {
    const stop = parseStop(item, slots);
    if (!stop.ok) return stop;
    if (seen.has(stop.value.id)) return err('Duplicate stop id');
    seen.add(stop.value.id);
    parsed.push(stop.value);
  }
  if (!STOP_IDS.every((id) => seen.has(id))) {
    return err('A stop is missing');
  }
  return ok(Object.freeze(parsed));
};

/**
 * @param {unknown} raw
 * @param {ReadonlyArray<Slot>} slots
 * @returns {Result<ReadonlyArray<DayNote>>}
 */
const parseDayNotes = (raw, slots) => {
  if (!Array.isArray(raw)) return err('Day notes must be an array');
  /** @type {DayNote[]} */
  const parsed = [];
  const seen = new Set();
  for (const item of raw) {
    if (!isRecord(item)) return err('A day note is not an object');
    if (!isDay(item.day)) return err('A day note has an invalid day');
    if (!isSlotKey(item.slot) || !slots.some((slot) => slot.key === item.slot)) {
      return err('A day note has an unknown slot');
    }
    const title = nonEmptyString(item.title);
    const text = nonEmptyString(item.text);
    if (title === null || text === null) return err('A day note is missing copy');
    const key = `${item.day}:${item.slot}`;
    if (seen.has(key)) return err('Duplicate day note');
    seen.add(key);
    parsed.push(Object.freeze({ day: item.day, slot: item.slot, title, text }));
  }
  return ok(Object.freeze(parsed));
};

/**
 * @param {unknown} raw
 * @returns {Result<ReadonlyArray<StopId>>}
 */
const parseBicycleStops = (raw) => {
  if (!Array.isArray(raw)) return err('bicycle_stops must be an array');
  /** @type {StopId[]} */
  const parsed = [];
  for (const item of raw) {
    if (!isStopId(item)) return err('bicycle_stops contains an unknown stop');
    if (!parsed.includes(item)) parsed.push(item);
  }
  return ok(Object.freeze(parsed));
};

/**
 * @param {unknown} raw
 * @returns {Result<Budget>}
 */
const parseBudget = (raw) => {
  if (!isRecord(raw)) return err('Budget must be an object');
  const food = nonNegativeInt(raw.food);
  const localTransport = nonNegativeInt(raw.local_transport);
  const bicycle = nonNegativeInt(raw.bicycle);
  if (food === null || localTransport === null || bicycle === null) {
    return err('Budget amounts must be non-negative integers');
  }
  const bicycleStops = parseBicycleStops(raw.bicycle_stops);
  if (!bicycleStops.ok) return bicycleStops;
  if (!isRecord(raw.labels)) return err('Budget labels must be an object');
  const foodLabel = nonEmptyString(raw.labels.food);
  const localLabel = nonEmptyString(raw.labels.local_transport);
  const bicycleLabel = nonEmptyString(raw.labels.bicycle);
  const stopsLabel = nonEmptyString(raw.labels.stops);
  if (foodLabel === null || localLabel === null || bicycleLabel === null || stopsLabel === null) {
    return err('Budget labels are missing');
  }
  return ok(
    Object.freeze({
      food,
      localTransport,
      bicycle,
      bicycleStops: bicycleStops.value,
      labels: Object.freeze({
        food: foodLabel,
        localTransport: localLabel,
        bicycle: bicycleLabel,
        stops: stopsLabel
      })
    })
  );
};

/**
 * Parse the JSON object embedded by Liquid. A malformed content object is an
 * expected failure at this boundary; the shell reports it instead of throwing.
 *
 * @param {unknown} raw
 * @returns {Result<Content>}
 */
export const parseContent = (raw) => {
  if (typeof raw !== 'string' || raw.trim() === '') return err('Content is empty');
  /** @type {unknown} */
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return err('Content is not valid JSON');
  }
  if (!isRecord(value)) return err('Content must be an object');
  const slots = parseSlots(value.slots);
  if (!slots.ok) return slots;
  const stops = parseStops(value.stops, slots.value);
  if (!stops.ok) return stops;
  const dayNotes = parseDayNotes(value.day_notes, slots.value);
  if (!dayNotes.ok) return dayNotes;
  const budget = parseBudget(value.budget);
  if (!budget.ok) return budget;

  /** @type {Partial<Record<StopId, Stop>>} */
  const byId = {};
  for (const stop of stops.value) byId[stop.id] = stop;

  return ok(
    Object.freeze({
      slots: slots.value,
      stops: stops.value,
      byId: Object.freeze(/** @type {Record<StopId, Stop>} */ (byId)),
      dayNotes: dayNotes.value,
      budget: budget.value
    })
  );
};

/**
 * @param {unknown} value
 * @param {Content} content
 * @returns {Result<StopId>}
 */
export const parseStopId = (value, content) => {
  if (!isStopId(value) || content.byId[value] === undefined) {
    return err('Unknown stop');
  }
  return ok(value);
};

/**
 * @param {StoredState | null} stored
 * @returns {AppState}
 */
export const initialState = (stored) => {
  const stamps = stored === null ? NO_STOPS : stored.stamps;
  const saved = stored === null ? null : stored.saved;
  const draft = saved === null ? NO_STOPS : saved;
  return Object.freeze({
    stamps: Object.freeze([...stamps]),
    draft: Object.freeze([...draft]),
    saved: saved === null ? null : Object.freeze([...saved])
  });
};

/**
 * @param {AppState} state
 * @param {ReadonlyArray<StopId>} stamps
 * @param {Content} content
 * @returns {AppState}
 */
export const withStamps = (state, stamps, content) =>
  Object.freeze({ ...state, stamps: canonicalStops(stamps, content) });

/**
 * @param {AppState} state
 * @param {StopId} id
 * @param {Content} content
 * @returns {AppState}
 */
export const toggleStamp = (state, id, content) => {
  const next = state.stamps.includes(id)
    ? state.stamps.filter((stampId) => stampId !== id)
    : [...state.stamps, id];
  return Object.freeze({ ...state, stamps: canonicalStops(next, content) });
};

/**
 * @param {AppState} state
 * @param {StopId} id
 * @param {boolean} selected
 * @param {Content} content
 * @returns {Result<AppState>}
 */
export const setPlanStop = (state, id, selected, content) => {
  if (!isStopId(id)) return err('Unknown stop');
  const alreadySelected = state.draft.includes(id);
  if (selected === alreadySelected) return ok(state);
  if (selected && state.draft.length >= content.stops.length) {
    return err('A plan can hold every stop at most once');
  }
  const next = selected
    ? [...state.draft, id]
    : state.draft.filter((stopId) => stopId !== id);
  return ok(Object.freeze({ ...state, draft: canonicalStops(next, content) }));
};

/**
 * Turn one draw from a random source into an index in `[0, limit)`.
 * Values outside the documented `[0, 1)` range are clamped so a bad source
 * cannot drop a stop from the shuffle.
 *
 * @param {() => number} random
 * @param {number} limit
 * @returns {number}
 */
const randomIndex = (random, limit) => {
  const value = random();
  const index = Number.isFinite(value) ? Math.floor(value * limit) : 0;
  return Math.min(limit - 1, Math.max(0, index));
};

/**
 * Build a plan from a deterministic random source. The shell passes
 * `Math.random`; tests pass a sequence so the result is reproducible.
 *
 * @param {AppState} state
 * @param {() => number} random A source of numbers; values outside [0, 1) are clamped.
 * @param {Content} content
 * @returns {AppState}
 */
export const selectRandomPlan = (state, random, content) => {
  const count = Math.min(
    content.stops.length,
    MIN_PLAN_STOPS + randomIndex(random, 3)
  );
  const pool = content.stops.map((stop) => stop.id);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(random, index + 1);
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return Object.freeze({
    ...state,
    draft: canonicalStops(pool.slice(0, count), content)
  });
};

/**
 * @param {AppState} state
 * @param {Content} content
 * @returns {Result<AppState>}
 */
export const savePlan = (state, content) => {
  if (state.draft.length < MIN_PLAN_STOPS) {
    return err(`Select at least ${MIN_PLAN_STOPS} stops`);
  }
  if (state.draft.length > content.stops.length) {
    return err('A plan cannot hold more stops than the content has');
  }
  return ok(Object.freeze({ ...state, saved: Object.freeze([...state.draft]) }));
};

/**
 * @param {ReadonlyArray<StopId>} left
 * @param {ReadonlyArray<StopId>} right
 * @returns {boolean}
 */
const sameIds = (left, right) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export const isPlanDirty = (state) => {
  if (state.saved === null) return state.draft.length > 0;
  return !sameIds(state.saved, state.draft);
};

/**
 * @param {unknown} raw
 * @param {Content} content
 * @returns {Result<StoredState>}
 */
export const parseStoredState = (raw, content) => {
  if (typeof raw !== 'string' || raw.trim() === '') return err('No stored state');
  /** @type {unknown} */
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return err('Stored state is not valid JSON');
  }
  if (!isRecord(value) || value.version !== 1) return err('Unsupported stored state');
  if (!Array.isArray(value.stamps)) return err('Stored stamps are invalid');
  const stamps = canonicalStops(value.stamps, content);
  /** @type {ReadonlyArray<StopId> | null} */
  let saved = null;
  if (value.saved !== null && value.saved !== undefined) {
    if (!Array.isArray(value.saved)) return err('Stored plan is invalid');
    const candidate = canonicalStops(value.saved, content);
    if (candidate.length >= MIN_PLAN_STOPS && candidate.length <= content.stops.length) {
      saved = candidate;
    }
  }
  return ok(Object.freeze({ version: 1, stamps, saved }));
};

/**
 * @param {AppState} state
 * @returns {string}
 */
export const serializeStored = (state) =>
  JSON.stringify({ version: 1, stamps: state.stamps, saved: state.saved });

/**
 * @param {unknown} hash
 * @param {Content} content
 * @returns {Result<ReadonlyArray<StopId>>}
 */
export const parseShareHash = (hash, content) => {
  if (typeof hash !== 'string') return err('No share hash');
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw === '') return err('No share hash');
  const entry = raw.split('&').find((part) => part.startsWith('stamps='));
  if (entry === undefined) return err('No stamps in share hash');
  /** @type {string} */
  let decoded;
  try {
    decoded = decodeURIComponent(entry.slice('stamps='.length));
  } catch {
    return err('Share hash is not valid');
  }
  const ids = decoded
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '');
  const stamps = canonicalStops(ids, content);
  if (stamps.length === 0) return err('No known stamps in share hash');
  return ok(stamps);
};

/**
 * @param {ReadonlyArray<StopId>} stamps
 * @returns {string}
 */
export const shareHash = (stamps) =>
  stamps.length === 0
    ? ''
    : `#stamps=${stamps.map((id) => encodeURIComponent(id)).join(',')}`;

/**
 * @param {number} amount
 * @returns {string}
 */
export const formatBaht = (amount) => {
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return `${NUMBER_FORMAT.format(safe)} บาท`;
};

/**
 * @param {number} minutes
 * @returns {string}
 */
export const formatMinutes = (minutes) => {
  const total = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} น.`;
  if (rest === 0) return `${hours} ชม.`;
  return `${hours} ชม. ${rest} น.`;
};

/**
 * @param {Content} content
 * @param {SlotKey} key
 * @returns {string}
 */
export const slotLabel = (content, key) =>
  content.slots.find((slot) => slot.key === key)?.label ?? key;

/**
 * @param {ReadonlyArray<StopId>} draft
 * @param {Content} content
 * @returns {PlanSummary}
 */
export const planSummary = (draft, content) => {
  if (draft.length === 0) {
    return Object.freeze({
      count: 0,
      stops: Object.freeze([]),
      days: Object.freeze([]),
      totalMinutes: 0,
      totalCost: 0,
      budgetRows: Object.freeze([]),
      canSave: false,
      isComplete: false
    });
  }

  const selected = Object.freeze(
    content.stops.filter((stop) => draft.includes(stop.id))
  );

  /** @type {ReadonlyArray<DayPlan>} */
  const days = Object.freeze(
    DAYS.map((day) => {
      /** @type {TimelineEntry[]} */
      const entries = [];
      for (const slot of content.slots) {
        const stopsInSlot = selected
          .filter((stop) => stop.day === day && stop.slot === slot.key)
          .sort((left, right) => left.time.localeCompare(right.time));
        if (stopsInSlot.length > 0) {
          for (const stop of stopsInSlot) {
            entries.push(Object.freeze({ tag: 'stop', stop }));
          }
        } else {
          const note = content.dayNotes.find(
            (candidate) => candidate.day === day && candidate.slot === slot.key
          );
          if (note !== undefined) {
            entries.push(Object.freeze({ tag: 'note', note }));
          }
        }
      }
      if (entries.length === 0) {
        entries.push(Object.freeze({ tag: 'empty', day }));
      }
      const dayStops = selected.filter((stop) => stop.day === day);
      return Object.freeze({
        day,
        entries: Object.freeze(entries),
        totalMinutes: dayStops.reduce((sum, stop) => sum + stop.duration + stop.travel, 0),
        totalCost: dayStops.reduce((sum, stop) => sum + stop.cost, 0)
      });
    })
  );

  const stopCost = selected.reduce((sum, stop) => sum + stop.cost, 0);
  const bicycleCost = selected.some((stop) =>
    content.budget.bicycleStops.includes(stop.id)
  )
    ? content.budget.bicycle
    : 0;

  /** @type {BudgetRow[]} */
  const budgetRows = [];
  if (content.budget.food > 0) {
    budgetRows.push(
      Object.freeze({ label: content.budget.labels.food, amount: content.budget.food })
    );
  }
  if (content.budget.localTransport > 0) {
    budgetRows.push(
      Object.freeze({
        label: content.budget.labels.localTransport,
        amount: content.budget.localTransport
      })
    );
  }
  if (bicycleCost > 0) {
    budgetRows.push(
      Object.freeze({ label: content.budget.labels.bicycle, amount: bicycleCost })
    );
  }
  if (stopCost > 0) {
    budgetRows.push(
      Object.freeze({ label: content.budget.labels.stops, amount: stopCost })
    );
  }
  const totalCost = budgetRows.reduce((sum, row) => sum + row.amount, 0);
  const totalMinutes = selected.reduce(
    (sum, stop) => sum + stop.duration + stop.travel,
    0
  );

  return Object.freeze({
    count: selected.length,
    stops: selected,
    days,
    totalMinutes,
    totalCost,
    budgetRows: Object.freeze(budgetRows),
    canSave: selected.length >= MIN_PLAN_STOPS,
    isComplete: selected.length === content.stops.length
  });
};
