// @ts-check
/**
 * Effectful browser shell for the ครัวตำย่า demo.
 *
 * The shell owns the document, storage, timers, and animation. It asks the
 * pure core for every decision and commits a new immutable state instead of
 * editing the previous one.
 */

import {
  DEFAULT_STATE,
  DISHES,
  HEAT,
  MAX_CHILIES,
  MAX_QTY,
  STORAGE_KEY,
  applyGrandmaStandard,
  err,
  formatBaht,
  formatNumber,
  isDishId,
  isToppingId,
  needleTarget,
  ok,
  parseStoredState,
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
} from './core.mjs';
import { maybe, must, mustAll } from './dom.mjs';

/** @typedef {'thai' | 'crab' | 'larb' | 'chicken'} DishId */
/** @typedef {'egg' | 'sausage' | 'plara' | 'chili' | 'greens'} ToppingId */
/** @typedef {'sour' | 'salt' | 'sweet'} TasteName */
/** @typedef {ReturnType<typeof import('./core.mjs').sanitizeState>} State */

/** @type {ReadonlyArray<TasteName>} */
const TASTE_NAMES = Object.freeze(['sour', 'salt', 'sweet']);

const els = Object.freeze({
  heatRange: /** @type {HTMLInputElement} */ (must('#heatRange')),
  heatButtons: /** @type {ReadonlyArray<HTMLButtonElement>} */ (mustAll('.heat-btn')),
  shuValue: /** @type {HTMLElement} */ (must('#shuValue')),
  heatName: /** @type {HTMLElement} */ (must('#heatName')),
  heatCountLine: /** @type {HTMLElement} */ (must('#heatCountLine')),
  grandmaQuote: /** @type {HTMLElement} */ (must('#grandmaQuote')),
  heatWarning: /** @type {HTMLElement} */ (must('#heatWarning')),
  grandmaPanel: /** @type {HTMLElement} */ (must('#grandmaPanel')),
  needle: /** @type {HTMLElement} */ (must('#gaugeNeedle')),
  chiliPips: /** @type {HTMLElement} */ (must('#chiliPips')),
  chiliCount: /** @type {HTMLElement} */ (must('#chiliCount')),
  chiliMinus: /** @type {HTMLButtonElement} */ (must('#chiliMinus')),
  chiliPlus: /** @type {HTMLButtonElement} */ (must('#chiliPlus')),
  qtyMinus: /** @type {HTMLButtonElement} */ (must('#qtyMinus')),
  qtyPlus: /** @type {HTMLButtonElement} */ (must('#qtyPlus')),
  qtyValue: /** @type {HTMLElement} */ (must('#qtyValue')),
  buildArt: /** @type {HTMLElement} */ (must('#buildArt')),
  buildArtCaption: /** @type {HTMLElement} */ (must('#buildArtCaption')),
  artChiliCount: /** @type {HTMLElement} */ (must('#artChiliCount')),
  buildDishName: /** @type {HTMLElement} */ (must('#buildDishName')),
  buildDishDesc: /** @type {HTMLElement} */ (must('#buildDishDesc')),
  buildQtyBadge: /** @type {HTMLElement} */ (must('#buildQtyBadge')),
  buildHeatTag: /** @type {HTMLElement} */ (must('#buildHeatTag')),
  buildChiliTag: /** @type {HTMLElement} */ (must('#buildChiliTag')),
  buildTasteLine: /** @type {HTMLElement} */ (must('#buildTasteLine')),
  buildExtrasLine: /** @type {HTMLElement} */ (must('#buildExtrasLine')),
  buildBasePrice: /** @type {HTMLElement} */ (must('#buildBasePrice')),
  buildToppingsPrice: /** @type {HTMLElement} */ (must('#buildToppingsPrice')),
  buildQtyNote: /** @type {HTMLElement} */ (must('#buildQtyNote')),
  buildTotal: /** @type {HTMLElement} */ (must('#buildTotal')),
  orderDishName: /** @type {HTMLElement} */ (must('#orderDishName')),
  orderDishDesc: /** @type {HTMLElement} */ (must('#orderDishDesc')),
  orderQtyBadge: /** @type {HTMLElement} */ (must('#orderQtyBadge')),
  orderHeatLine: /** @type {HTMLElement} */ (must('#orderHeatLine')),
  orderTasteLine: /** @type {HTMLElement} */ (must('#orderTasteLine')),
  orderToppingsLine: /** @type {HTMLElement} */ (must('#orderToppingsLine')),
  orderQtyLine: /** @type {HTMLElement} */ (must('#orderQtyLine')),
  orderTotal: /** @type {HTMLElement} */ (must('#orderTotal')),
  confirmDialog: /** @type {HTMLDialogElement} */ (must('#confirmDialog')),
  successDialog: /** @type {HTMLDialogElement} */ (must('#successDialog')),
  confirmQtyHead: /** @type {HTMLElement} */ (must('#confirmQtyHead')),
  confirmDish: /** @type {HTMLElement} */ (must('#confirmDish')),
  confirmHeat: /** @type {HTMLElement} */ (must('#confirmHeat')),
  confirmTaste: /** @type {HTMLElement} */ (must('#confirmTaste')),
  confirmToppings: /** @type {HTMLElement} */ (must('#confirmToppings')),
  confirmQty: /** @type {HTMLElement} */ (must('#confirmQty')),
  confirmTotal: /** @type {HTMLElement} */ (must('#confirmTotal')),
  toast: /** @type {HTMLElement} */ (must('#toast')),
  grandmaStandard: /** @type {HTMLButtonElement} */ (must('#grandmaStandard')),
  buildMyself: /** @type {HTMLButtonElement} */ (must('#buildMyself')),
  confirmPlate: /** @type {HTMLButtonElement} */ (must('#confirmPlate')),
  orderConfirm: /** @type {HTMLButtonElement} */ (must('#orderConfirm')),
  confirmClose: /** @type {HTMLButtonElement} */ (must('#confirmClose')),
  confirmBack: /** @type {HTMLButtonElement} */ (must('#confirmBack')),
  confirmSubmit: /** @type {HTMLButtonElement} */ (must('#confirmSubmit')),
  successClose: /** @type {HTMLButtonElement} */ (must('#successClose')),
  successCloseX: /** @type {HTMLButtonElement} */ (must('#successCloseX')),
  successAgain: /** @type {HTMLButtonElement} */ (must('#successAgain')),
  dishInputs: /** @type {ReadonlyArray<HTMLInputElement>} */ (mustAll('input[name="dish"]')),
  sourInputs: /** @type {ReadonlyArray<HTMLInputElement>} */ (mustAll('input[name="sour"]')),
  saltInputs: /** @type {ReadonlyArray<HTMLInputElement>} */ (mustAll('input[name="salt"]')),
  sweetInputs: /** @type {ReadonlyArray<HTMLInputElement>} */ (mustAll('input[name="sweet"]')),
  toppingInputs: /** @type {ReadonlyArray<HTMLInputElement>} */ (mustAll('input[name="topping"]')),
  pickDishButtons: /** @type {ReadonlyArray<HTMLButtonElement>} */ (mustAll('[data-pick-dish]')),
  navLinks: /** @type {ReadonlyArray<HTMLAnchorElement>} */ (mustAll('.nav-link'))
});

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionQuery.matches;
let currentAngle = -90;
/** @type {Animation | null} */
let needleAnimation = null;
let toastTimer = 0;

const tasteInputs = Object.freeze({
  sour: els.sourInputs,
  salt: els.saltInputs,
  sweet: els.sweetInputs
});

/**
 * @returns {{ ok: true, value: string | null } | { ok: false, error: string }}
 */
const readStoredRaw = () => {
  try {
    return ok(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return err('storage-unavailable');
  }
};

/** @returns {State} */
const loadState = () => {
  const raw = readStoredRaw();
  if (!raw.ok || raw.value === null) return DEFAULT_STATE;
  const parsed = parseStoredState(raw.value);
  return parsed.ok ? parsed.value : DEFAULT_STATE;
};

let state = loadState();

/** @param {State} next */
const saveState = (next) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeState(next));
  } catch {
    /* Private browsing may disable localStorage; the demo still works. */
  }
};

/** @param {number} level @param {boolean} animate */
const setNeedle = (level, animate) => {
  const target = needleTarget(level);
  const canAnimate = animate && !reduceMotion;

  if (needleAnimation) {
    needleAnimation.cancel();
    needleAnimation = null;
  }

  els.needle.style.transform = `rotate(${target}deg)`;

  if (canAnimate && Math.abs(target - currentAngle) > 0.1) {
    const from = currentAngle;
    const direction = target >= from ? 1 : -1;
    needleAnimation = els.needle.animate(
      [
        { transform: `rotate(${from}deg)`, offset: 0 },
        { transform: `rotate(${target + direction * 2.8}deg)`, offset: 0.68 },
        { transform: `rotate(${target - direction * 1.2}deg)`, offset: 0.86 },
        { transform: `rotate(${target}deg)`, offset: 1 }
      ],
      {
        duration: 390,
        easing: 'cubic-bezier(.2, .8, .3, 1)'
      }
    );
    needleAnimation.onfinish = () => {
      needleAnimation = null;
    };
  }

  currentAngle = target;
};

/** @param {State} current @param {boolean} animate */
const renderMeter = (current, animate) => {
  const level = HEAT[current.heat - 1];
  els.heatRange.value = String(current.heat);
  els.heatRange.setAttribute(
    'aria-valuetext',
    `ระดับ ${current.heat} ${level.name} ประมาณ ${formatNumber(level.shu)} SHU`
  );
  els.shuValue.textContent = formatNumber(level.shu);
  els.heatName.textContent = level.name;
  els.heatCountLine.textContent = `ระดับ ${current.heat}/5`;
  els.grandmaQuote.textContent = level.quote;
  els.heatWarning.textContent = level.warning;
  els.grandmaPanel.dataset.heat = String(current.heat);

  els.heatButtons.forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.heat === String(current.heat) ? 'true' : 'false');
  });

  setNeedle(current.heat, animate);
};

/** @param {State} current */
const renderControls = (current) => {
  els.dishInputs.forEach((input) => {
    input.checked = input.value === current.dish;
  });

  for (const name of TASTE_NAMES) {
    tasteInputs[name].forEach((input) => {
      input.checked = Number(input.value) === current[name];
    });
  }

  els.toppingInputs.forEach((input) => {
    input.checked = current.toppings.includes(/** @type {ToppingId} */ (input.value));
  });

  const pips = Array.from(els.chiliPips.querySelectorAll('svg'));
  pips.forEach((pip, index) => {
    pip.classList.toggle('on', index < current.chilies);
  });
  els.chiliCount.textContent = String(current.chilies);
  els.chiliMinus.disabled = current.chilies <= 1;
  els.chiliPlus.disabled = current.chilies >= MAX_CHILIES;
  els.qtyValue.textContent = String(current.qty);
  els.qtyMinus.disabled = current.qty <= 1;
  els.qtyPlus.disabled = current.qty >= MAX_QTY;
};

/** @param {State} current */
const renderArt = (current) => {
  Array.from(els.buildArt.querySelectorAll('[data-dish-art]'), (element) => /** @type {HTMLElement} */ (element)).forEach((layer) => {
    layer.style.display = layer.dataset.dishArt === current.dish ? '' : 'none';
  });
  Array.from(els.buildArt.querySelectorAll('[data-topping-art]'), (element) => /** @type {HTMLElement} */ (element)).forEach((layer) => {
    layer.style.display = current.toppings.includes(/** @type {ToppingId} */ (layer.dataset.toppingArt)) ? '' : 'none';
  });
  Array.from(els.buildArt.querySelectorAll('[data-heat-chili]'), (element) => /** @type {HTMLElement} */ (element)).forEach((layer) => {
    layer.style.display = Number(layer.dataset.heatChili) <= current.heat ? '' : 'none';
  });
  Array.from(els.buildArt.querySelectorAll('[data-sour-garnish]'), (element) => /** @type {HTMLElement} */ (element)).forEach((layer) => {
    layer.style.display = Number(layer.dataset.sourGarnish) <= current.sour ? '' : 'none';
  });

  const dish = DISHES[current.dish];
  const level = HEAT[current.heat - 1];
  const names = toppingNames(current);
  const description = `${dish.name} พริก ${current.chilies} เม็ด ระดับ${level.name}${
    names.length ? ` พร้อม${names.join('และ')}` : ''
  }`;
  els.buildArt.setAttribute('aria-label', `ภาพวาดจาน${description}`);
  els.buildArtCaption.textContent = `${dish.name} · ระดับ${level.name}`;
  els.artChiliCount.textContent = `${current.chilies} เม็ด`;
};

/** @param {State} current */
const renderBuildSummary = (current) => {
  const dish = DISHES[current.dish];
  const level = HEAT[current.heat - 1];
  const money = totals(current);
  const names = toppingNames(current);

  els.buildDishName.textContent = dish.name;
  els.buildDishDesc.textContent = dish.desc;
  els.buildQtyBadge.textContent = `×${current.qty}`;
  must('span', els.buildHeatTag).textContent = level.name;
  els.buildChiliTag.textContent = `พริก ${current.chilies} เม็ด`;
  els.buildTasteLine.textContent = tasteSummary(current);
  els.buildBasePrice.textContent = formatBaht(money.base);
  els.buildToppingsPrice.textContent = formatBaht(money.extras);
  els.buildQtyNote.textContent = `${current.qty} จาน`;
  els.buildTotal.textContent = formatBaht(money.total);

  if (names.length) {
    els.buildExtrasLine.textContent = `+ ${names.join(' · ')}`;
    els.buildExtrasLine.classList.add('is-added');
  } else {
    els.buildExtrasLine.textContent = 'ยังไม่เพิ่มอะไร';
    els.buildExtrasLine.classList.remove('is-added');
  }
};

/** @param {State} current */
const renderOrderSummary = (current) => {
  const dish = DISHES[current.dish];
  const level = HEAT[current.heat - 1];
  const money = totals(current);
  const names = toppingNames(current);

  els.orderDishName.textContent = dish.name;
  els.orderDishDesc.textContent = dish.desc;
  els.orderQtyBadge.textContent = `×${current.qty}`;
  els.orderHeatLine.textContent = `${level.name} · พริก ${current.chilies} เม็ด`;
  els.orderTasteLine.textContent = tasteSummary(current);
  els.orderToppingsLine.textContent = names.length ? names.join(' · ') : 'ไม่เพิ่ม';
  els.orderQtyLine.textContent = `${current.qty} จาน`;
  els.orderTotal.textContent = formatBaht(money.total);
};

/** @param {State} current */
const renderModalSummary = (current) => {
  const dish = DISHES[current.dish];
  const level = HEAT[current.heat - 1];
  const money = totals(current);
  const names = toppingNames(current);

  els.confirmQtyHead.textContent = `×${current.qty}`;
  els.confirmDish.textContent = `${dish.name} · ${formatBaht(dish.price)}`;
  els.confirmHeat.textContent = `${level.name} · พริก ${current.chilies} เม็ด`;
  els.confirmTaste.textContent = tasteSummary(current);
  els.confirmToppings.textContent = names.length ? names.join(' · ') : 'ไม่เพิ่ม';
  els.confirmQty.textContent = `${current.qty} จาน`;
  els.confirmTotal.textContent = formatBaht(money.total);
};

/**
 * @param {State} current
 * @param {{ animateMeter?: boolean }} [options]
 */
const renderAll = (current, options = {}) => {
  renderMeter(current, Boolean(options.animateMeter));
  renderControls(current);
  renderArt(current);
  renderBuildSummary(current);
  renderOrderSummary(current);
  renderModalSummary(current);
};

/**
 * @param {State} next
 * @param {{ animateMeter?: boolean }} [options]
 */
const commit = (next, options = {}) => {
  state = next;
  saveState(state);
  renderAll(state, options);
};

/** @param {string} id */
const scrollToSection = (id) => {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  const heading = /** @type {HTMLElement | null} */ (section.querySelector('h1, h2'));
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
};

/** @param {string} message */
const showToast = (message) => {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 3200);
};

const syncModalLock = () => {
  const anyOpen = Boolean(document.querySelector('dialog.modal[open]'));
  document.body.classList.toggle('modal-open', anyOpen);
};

/** @param {HTMLDialogElement} dialog */
const openDialog = (dialog) => {
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
  const card = /** @type {HTMLElement | null} */ (dialog.querySelector('.modal-card'));
  if (card) card.scrollTop = 0;
  document.body.classList.add('modal-open');
};

/** @param {HTMLDialogElement} dialog */
const closeDialog = (dialog) => {
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
  }
  syncModalLock();
};

const openConfirm = () => {
  renderModalSummary(state);
  openDialog(els.confirmDialog);
};

/**
 * @param {KeyboardEvent} event
 */
const trapDialogFocus = (event) => {
  if (event.key !== 'Tab') return;
  const dialog = /** @type {HTMLDialogElement} */ (event.currentTarget);
  const focusable = Array.from(
    dialog.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'),
    (element) => /** @type {HTMLElement} */ (element)
  ).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

/** @returns {void} */
export const start = () => {
  /* ---- meter ---- */
  els.heatRange.addEventListener('input', (event) => {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);
    commit(setHeat(state, Number(input.value)), { animateMeter: true });
  });
  els.heatButtons.forEach((button) => {
    button.addEventListener('click', () => {
      commit(setHeat(state, Number(button.dataset.heat)), { animateMeter: true });
    });
  });

  els.grandmaStandard.addEventListener('click', () => {
    commit(applyGrandmaStandard(state), { animateMeter: true });
    showToast('ย่าจัดชุดมาตรฐานให้แล้ว · ระดับ 3 พริก 5 เม็ด');
    scrollToSection('build');
  });

  els.buildMyself.addEventListener('click', () => {
    scrollToSection('build');
  });

  /* ---- builder options ---- */
  els.dishInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked || !isDishId(input.value)) return;
      commit(setDish(state, input.value));
    });
  });
  for (const name of TASTE_NAMES) {
    tasteInputs[name].forEach((input) => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        commit(setTaste(state, name, Number(input.value)));
      });
    });
  }
  els.toppingInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!isToppingId(input.value)) return;
      commit(toggleTopping(state, input.value));
    });
  });

  els.chiliMinus.addEventListener('click', () => {
    commit(setChilies(state, state.chilies - 1), { animateMeter: true });
  });
  els.chiliPlus.addEventListener('click', () => {
    commit(setChilies(state, state.chilies + 1), { animateMeter: true });
  });
  els.qtyMinus.addEventListener('click', () => {
    commit(setQty(state, state.qty - 1));
  });
  els.qtyPlus.addEventListener('click', () => {
    commit(setQty(state, state.qty + 1));
  });

  /* ---- dish cards ---- */
  els.pickDishButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const dishId = button.dataset.pickDish;
      if (!isDishId(dishId)) return;
      commit(setDish(state, dishId));
      showToast(`เลือก${DISHES[dishId].name}แล้ว · ไปตั้งความแซ่บต่อเลย`);
      scrollToSection('meter');
    });
  });

  /* ---- dialogs ---- */
  els.confirmPlate.addEventListener('click', openConfirm);
  els.orderConfirm.addEventListener('click', openConfirm);

  const closeConfirm = () => closeDialog(els.confirmDialog);
  els.confirmClose.addEventListener('click', closeConfirm);
  els.confirmBack.addEventListener('click', () => {
    closeConfirm();
    scrollToSection('build');
  });
  els.confirmSubmit.addEventListener('click', () => {
    closeDialog(els.confirmDialog);
    openDialog(els.successDialog);
  });

  const closeSuccess = () => closeDialog(els.successDialog);
  els.successClose.addEventListener('click', closeSuccess);
  els.successCloseX.addEventListener('click', closeSuccess);
  els.successAgain.addEventListener('click', () => {
    closeSuccess();
    scrollToSection('build');
  });

  [els.confirmDialog, els.successDialog].forEach((dialog) => {
    dialog.addEventListener('close', syncModalLock);
    dialog.addEventListener('keydown', trapDialogFocus);
  });

  /* ---- scroll spy ---- */
  if ('IntersectionObserver' in window) {
    const navLinks = els.navLinks;
    /** @type {ReadonlyArray<Element>} */
    const sections = Object.freeze(
      navLinks
        .map((link) => {
          const href = link.getAttribute('href');
          return href ? maybe(href) : null;
        })
        .filter((section) => section !== null)
    );
    /** @type {Map<string, boolean>} */
    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));
        const active = sections.find((section) => visible.get(section.id));
        navLinks.forEach((link) => {
          link.classList.toggle('active', Boolean(active) && link.getAttribute('href') === `#${active?.id}`);
        });
        if (active) {
          const activeLink = navLinks.find((link) => link.getAttribute('href') === `#${active.id}`);
          const nav = /** @type {HTMLElement | null} */ (activeLink ? activeLink.closest('.main-nav') : null);
          if (nav && nav.scrollWidth > nav.clientWidth + 1) {
            const navRect = nav.getBoundingClientRect();
            const linkRect = activeLink?.getBoundingClientRect();
            if (!linkRect) return;
            let delta = 0;
            if (linkRect.left < navRect.left) delta = linkRect.left - navRect.left - 4;
            else if (linkRect.right > navRect.right) delta = linkRect.right - navRect.right + 4;
            if (delta) {
              nav.scrollTo({
                left: nav.scrollLeft + delta,
                behavior: reduceMotion ? 'auto' : 'smooth'
              });
            }
          }
        }
      },
      { rootMargin: '-32% 0px -58% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* ---- reduced motion ---- */
  /** @param {MediaQueryListEvent} event */
  const handleMotionPreference = (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      if (needleAnimation) {
        needleAnimation.cancel();
        needleAnimation = null;
      }
      els.needle.style.transform = `rotate(${needleTarget(state.heat)}deg)`;
      currentAngle = needleTarget(state.heat);
    }
  };
  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionPreference);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(handleMotionPreference);
  }

  /* ---- header offset ---- */
  const headerEl = /** @type {HTMLElement | null} */ (maybe('.site-header'));
  const summaryCard = /** @type {HTMLElement | null} */ (maybe('.build-summary'));

  const syncHeaderHeight = () => {
    if (!headerEl) return;
    const height = Math.ceil(headerEl.getBoundingClientRect().height);
    if (height > 0) document.documentElement.style.setProperty('--header-h', `${height}px`);
  };

  const syncSummarySticky = () => {
    if (!summaryCard) return;
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const canStick =
      window.innerWidth >= 981 && summaryCard.offsetHeight + headerHeight + 14 <= window.innerHeight;
    summaryCard.classList.toggle('can-stick', canStick);
  };

  const syncLayout = () => {
    syncHeaderHeight();
    syncSummarySticky();
  };

  syncLayout();
  window.addEventListener('resize', syncLayout, { passive: true });
  if ('ResizeObserver' in window) {
    if (headerEl) new ResizeObserver(() => syncHeaderHeight()).observe(headerEl);
    if (summaryCard) new ResizeObserver(() => syncSummarySticky()).observe(summaryCard);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncLayout).catch(() => {});
  }

  /* ---- init ---- */
  currentAngle = needleTarget(state.heat);
  renderAll(state, { animateMeter: false });
  saveState(state);
  syncLayout();
  requestAnimationFrame(syncLayout);
};
