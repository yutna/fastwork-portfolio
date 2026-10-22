// @ts-check
/**
 * Effectful browser shell for the เชียงคาน — ตื่นเช้าให้ทัน demo.
 *
 * The shell owns the document, storage, history, and the print call. It asks
 * the pure core for every decision and commits a new immutable state instead
 * of editing the previous one.
 */

import {
  MIN_PLAN_STOPS,
  STORAGE_KEY,
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
} from './core.mjs';
import { maybe, must, mustAll } from './dom.mjs';

/** @typedef {Extract<ReturnType<typeof parseContent>, { ok: true }>['value']} Content */
/** @typedef {Extract<ReturnType<typeof parseStoredState>, { ok: true }>['value']} StoredState */
/** @typedef {ReturnType<typeof initialState>} AppState */
/** @typedef {ReturnType<typeof planSummary>} PlanSummary */
/** @typedef {PlanSummary['days'][number]} DayPlan */
/** @typedef {DayPlan['entries'][number]} TimelineEntry */

/** @type {ReadonlyArray<number>} */
const STAMP_ROTATIONS = Object.freeze([-6, 5, -3, 7, -4]);

const els = Object.freeze({
  status: /** @type {HTMLElement} */ (must('#ckStampStatus')),
  stopCards: /** @type {ReadonlyArray<HTMLElement>} */ (mustAll('[data-stop]')),
  stampButtons: /** @type {ReadonlyArray<HTMLButtonElement>} */ (mustAll('[data-stamp]')),
  planCount: /** @type {HTMLElement} */ (must('#ckPlanCount')),
  planMessage: /** @type {HTMLElement} */ (must('#ckPlanMessage')),
  planInputs: /** @type {ReadonlyArray<HTMLInputElement>} */ (mustAll('[data-plan-stop]')),
  savePlan: /** @type {HTMLButtonElement} */ (must('#ckSavePlan')),
  randomPlan: /** @type {HTMLButtonElement} */ (must('#ckRandomPlan')),
  saveNote: /** @type {HTMLElement} */ (must('#ckSaveNote')),
  timeline: /** @type {HTMLElement} */ (must('#ckTimeline')),
  summary: /** @type {HTMLElement} */ (must('#ckSummary')),
  summaryTime: /** @type {HTMLElement} */ (must('#ckSummaryTime')),
  summaryTotal: /** @type {HTMLElement} */ (must('#ckSummaryTotal')),
  budget: /** @type {HTMLElement} */ (must('#ckBudget')),
  passport: /** @type {HTMLElement} */ (must('#ckPassport')),
  passportCount: /** @type {HTMLElement} */ (must('#ckPassportCount')),
  passportSlots: /** @type {ReadonlyArray<HTMLElement>} */ (mustAll('[data-passport-slot]')),
  passportComplete: /** @type {HTMLElement} */ (must('#ckPassportComplete')),
  emptyNote: /** @type {HTMLElement} */ (must('#ckPassportEmptyNote')),
  print: /** @type {HTMLButtonElement} */ (must('#ckPrint')),
  share: /** @type {HTMLButtonElement} */ (must('#ckShare')),
  shareStatus: /** @type {HTMLElement} */ (must('#ckShareStatus')),
  data: /** @type {HTMLScriptElement} */ (must('#ck-data'))
});

/**
 * @param {Element} element
 * @param {string} text
 */
const setText = (element, text) => {
  if (element.textContent !== text) element.textContent = text;
};

/**
 * @param {Element} element
 * @param {string} name
 * @param {string} value
 */
const setAttribute = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

/**
 * @param {number} index
 * @returns {number}
 */
const stampRotation = (index) => STAMP_ROTATIONS[index % STAMP_ROTATIONS.length] ?? 0;

/**
 * @param {Content} content
 * @param {string} id
 * @returns {number}
 */
const rotationFor = (content, id) => {
  const index = content.stops.findIndex((stop) => stop.id === id);
  return stampRotation(index < 0 ? 0 : index);
};

/**
 * @param {AppState} state
 * @param {Content} content
 */
const renderStamps = (state, content) => {
  const total = content.stops.length;
  const count = state.stamps.length;
  setText(els.status, `ประทับแล้ว ${count}/${total}`);

  for (const card of els.stopCards) {
    const parsed = parseStopId(card.dataset.stop, content);
    if (!parsed.ok) continue;
    const stamped = state.stamps.includes(parsed.value);
    card.dataset.stamped = String(stamped);
    card.style.setProperty('--ck-stamp-rotate', `${rotationFor(content, parsed.value)}deg`);

    const button = /** @type {HTMLButtonElement | null} */ (
      card.querySelector('[data-stamp]')
    );
    if (button === null) continue;
    setAttribute(button, 'aria-pressed', String(stamped));
    const label = maybe('[data-stamp-label]', button);
    if (label !== null) {
      setText(label, stamped ? 'ยกเลิกตราประทับ' : 'ประทับตรา');
    }
  }

  for (const slot of els.passportSlots) {
    const parsed = parseStopId(slot.dataset.passportSlot, content);
    if (!parsed.ok) continue;
    const stamped = state.stamps.includes(parsed.value);
    slot.dataset.stamped = String(stamped);
    slot.style.setProperty('--ck-stamp-rotate', `${rotationFor(content, parsed.value)}deg`);
    const status = maybe('[data-slot-status]', slot);
    if (status !== null) {
      setText(status, stamped ? 'ประทับแล้ว' : 'ยังไม่ได้ประทับ');
    }
  }

  setText(els.passportCount, `${count}/${total}`);
  els.passportComplete.hidden = count !== total;
  els.emptyNote.hidden = count === total;
  els.passport.style.setProperty('--ck-progress', String(total === 0 ? 0 : count / total));
};

/**
 * @param {TimelineEntry} entry
 * @param {Content} content
 * @returns {HTMLLIElement}
 */
const renderEntry = (entry, content) => {
  const item = document.createElement('li');
  item.className = 'ck-slot';
  const time = document.createElement('span');
  time.className = 'ck-slot__time';
  const body = document.createElement('div');
  body.className = 'ck-slot__body';
  const title = document.createElement('p');
  title.className = 'ck-slot__title';

  switch (entry.tag) {
    case 'stop': {
      time.textContent = entry.stop.time;
      title.textContent = entry.stop.title;
      const meta = document.createElement('p');
      meta.className = 'ck-slot__meta';
      const travel = entry.stop.travel > 0 ? ` · เดินทาง ${entry.stop.travel} นาที` : '';
      const cost = entry.stop.cost > 0 ? ` · ${formatBaht(entry.stop.cost)}` : '';
      meta.textContent = `${entry.stop.duration} นาที${travel}${cost}`;
      body.append(title, meta);
      break;
    }
    case 'note': {
      item.classList.add('ck-slot--note');
      time.textContent = slotLabel(content, entry.note.slot);
      title.textContent = entry.note.title;
      const text = document.createElement('p');
      text.className = 'ck-slot__text';
      text.textContent = entry.note.text;
      body.append(title, text);
      break;
    }
    case 'empty': {
      item.classList.add('ck-slot--note');
      time.textContent = 'ว่าง';
      title.textContent = 'วันนี้พักได้';
      const text = document.createElement('p');
      text.className = 'ck-slot__text';
      text.textContent = 'เลือกหมุดเพิ่ม หรือพักตามอัธยาศัยก็ได้';
      body.append(title, text);
      break;
    }
    default:
      throw new Error(`Unhandled timeline entry: ${JSON.stringify(entry)}`);
  }

  item.append(time, body);
  return item;
};

/**
 * @param {DayPlan} day
 * @param {Content} content
 * @returns {HTMLDivElement}
 */
const renderDay = (day, content) => {
  const card = document.createElement('div');
  card.className = 'ck-day';
  const head = document.createElement('div');
  head.className = 'ck-day__head';
  const title = document.createElement('h3');
  title.textContent = `วันที่ ${day.day}`;
  const total = document.createElement('p');
  total.className = 'ck-day__total';
  total.textContent = day.totalMinutes > 0 ? `รวม ${formatMinutes(day.totalMinutes)}` : 'ยังไม่มีหมุด';
  head.append(title, total);

  const list = document.createElement('ol');
  list.className = 'ck-day__slots';
  for (const entry of day.entries) list.append(renderEntry(entry, content));
  card.append(head, list);
  return card;
};

/**
 * @param {AppState} state
 * @param {Content} content
 */
const renderPlan = (state, content) => {
  const summary = planSummary(state.draft, content);
  const dirty = isPlanDirty(state);
  const total = content.stops.length;

  setText(els.planCount, `${summary.count}/${total}`);

  if (summary.count < MIN_PLAN_STOPS) {
    setText(
      els.planMessage,
      summary.count === 0
        ? `เลือกอย่างน้อย ${MIN_PLAN_STOPS} หมุด แล้วเราเริ่มได้`
        : `อีก ${MIN_PLAN_STOPS - summary.count} หมุดก็เริ่มได้`
    );
    els.planMessage.dataset.state = 'warn';
  } else if (state.saved !== null && !dirty) {
    setText(els.planMessage, 'บันทึกแผนนี้แล้ว — ถ้าแก้ไข อย่าลืมบันทึกอีกครั้ง');
    els.planMessage.dataset.state = 'saved';
  } else {
    setText(els.planMessage, `เลือกแล้ว ${summary.count} จาก ${total} หมุด — บันทึกไว้เมื่อพร้อม`);
    els.planMessage.dataset.state = 'ready';
  }

  if (state.saved === null) {
    setText(
      els.saveNote,
      summary.count === 0
        ? 'ยังไม่ได้บันทึกแผนไว้'
        : 'ยังไม่ได้บันทึกแผนไว้ — กดบันทึกเมื่อพร้อม'
    );
  } else if (dirty) {
    setText(els.saveNote, 'มีการแก้ไขที่ยังไม่ได้บันทึก');
  } else {
    setText(els.saveNote, 'บันทึกแล้ว · แผนนี้จะยังอยู่เมื่อคุณกลับมา');
  }

  els.savePlan.disabled = !summary.canSave;
  setAttribute(els.savePlan, 'aria-disabled', String(!summary.canSave));

  for (const input of els.planInputs) {
    const parsed = parseStopId(input.value, content);
    if (!parsed.ok) {
      input.checked = false;
      input.disabled = true;
      continue;
    }
    const checked = state.draft.includes(parsed.value);
    const blocked = summary.count >= total && !checked;
    input.checked = checked;
    input.disabled = blocked;
    const chip = input.closest('[data-plan-chip]');
    if (chip instanceof HTMLElement) {
      chip.dataset.disabled = String(blocked);
    }
  }

  els.timeline.replaceChildren();
  if (summary.count === 0) {
    const empty = document.createElement('p');
    empty.className = 'ck-timeline__empty';
    empty.textContent = 'ยังไม่ได้เลือกหมุด — เริ่มจาก 3 หมุดที่อยากไปก่อน';
    els.timeline.append(empty);
  } else {
    for (const day of summary.days) els.timeline.append(renderDay(day, content));
  }

  els.summary.hidden = summary.count === 0;
  if (summary.count > 0) {
    setText(els.summaryTime, `เวลารวมคร่าว ๆ ${formatMinutes(summary.totalMinutes)}`);
    setText(els.summaryTotal, `${formatBaht(summary.totalCost)} / คน`);
    els.budget.replaceChildren();
    for (const row of summary.budgetRows) {
      const term = document.createElement('dt');
      term.textContent = row.label;
      const amount = document.createElement('dd');
      amount.textContent = formatBaht(row.amount);
      els.budget.append(term, amount);
    }
  }
};

/**
 * @param {AppState} state
 * @param {Content} content
 */
const render = (state, content) => {
  renderStamps(state, content);
  renderPlan(state, content);
};

/**
 * @returns {string | null}
 */
const readStorage = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * @param {AppState} state
 */
const writeStorage = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeStored(state));
  } catch {
    // The demo still works when storage is unavailable or full.
  }
};

/**
 * Keep the share fragment canonical without adding a history entry. A section
 * anchor such as #planner is left alone until the stamps actually change.
 *
 * @param {AppState} state
 */
const syncHash = (state) => {
  const next = shareHash(state.stamps);
  const current = window.location.hash;
  if (current === next) return;
  if (next === '' && !current.startsWith('#stamps=')) return;
  try {
    const url = next === '' ? `${window.location.pathname}${window.location.search}` : next;
    window.history.replaceState(null, '', url);
  } catch {
    // Some embedded contexts block history; the visible state is still correct.
  }
};

/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
const copyText = async (text) => {
  try {
    if (navigator.clipboard !== undefined) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the selection-based copy below.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.append(area);
    try {
      area.select();
      return document.execCommand('copy');
    } finally {
      area.remove();
    }
  } catch {
    return false;
  }
};

/**
 * @param {AppState} state
 * @returns {string}
 */
const shareUrl = (state) => `${window.location.href.split('#')[0]}${shareHash(state.stamps)}`;

export const start = () => {
  const parsedContent = parseContent(els.data.textContent ?? '');
  if (!parsedContent.ok) {
    console.error(`Chiang Khan content error: ${parsedContent.error}`);
    els.planMessage.dataset.state = 'warn';
    setText(els.planMessage, 'ข้อมูลทริปไม่พร้อมใช้งานในขณะนี้');
    return;
  }
  const content = parsedContent.value;

  const stored = parseStoredState(readStorage(), content);
  let state = initialState(stored.ok ? stored.value : null);

  const shared = parseShareHash(window.location.hash, content);
  if (shared.ok) {
    state = withStamps(state, shared.value, content);
    writeStorage(state);
  }

  /**
   * @param {AppState} next
   */
  const commit = (next) => {
    if (next === state) return;
    const stampsChanged = next.stamps !== state.stamps;
    const persist = stampsChanged || next.saved !== state.saved;
    state = next;
    render(state, content);
    if (persist) writeStorage(state);
    if (stampsChanged) syncHash(state);
  };

  for (const button of els.stampButtons) {
    button.addEventListener('click', () => {
      const id = parseStopId(button.dataset.stamp, content);
      if (!id.ok) return;
      commit(toggleStamp(state, id.value, content));
    });
  }

  for (const input of els.planInputs) {
    input.addEventListener('change', () => {
      const id = parseStopId(input.value, content);
      if (!id.ok) {
        input.checked = false;
        return;
      }
      const result = setPlanStop(state, id.value, input.checked, content);
      if (!result.ok) {
        input.checked = !input.checked;
        els.planMessage.dataset.state = 'warn';
        setText(els.planMessage, `เลือกได้สูงสุด ${content.stops.length} หมุด`);
        return;
      }
      commit(result.value);
    });
  }

  els.savePlan.addEventListener('click', () => {
    const result = savePlan(state, content);
    if (!result.ok) {
      els.planMessage.dataset.state = 'warn';
      setText(els.planMessage, `เลือกอย่างน้อย ${MIN_PLAN_STOPS} หมุดก่อนบันทึก`);
      return;
    }
    commit(result.value);
  });

  els.randomPlan.addEventListener('click', () => {
    commit(selectRandomPlan(state, Math.random, content));
  });

  els.print.addEventListener('click', () => {
    window.print();
  });

  els.share.addEventListener('click', () => {
    void copyText(shareUrl(state)).then((copied) => {
      setText(
        els.shareStatus,
        copied
          ? 'คัดลอกลิงก์แชร์แล้ว'
          : 'คัดลอกอัตโนมัติไม่ได้ — ลองคัดลอกจากแถบที่อยู่'
      );
    });
  });

  window.addEventListener('hashchange', () => {
    const nextShare = parseShareHash(window.location.hash, content);
    if (!nextShare.ok) return;
    commit(withStamps(state, nextShare.value, content));
  });

  render(state, content);
  if (window.location.hash.startsWith('#stamps=')) syncHash(state);
};
