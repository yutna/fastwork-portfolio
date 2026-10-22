// @ts-check
/**
 * Small DOM lookup helpers for the Chiang Khan browser shell. Missing required
 * elements are programmer errors, so they fail loudly instead of producing a
 * cascade of null checks in every render function.
 */

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T}
 */
export const must = (selector, root = document) => {
  const element = root.querySelector(selector);
  if (element === null) throw new Error(`Missing required element: ${selector}`);
  return /** @type {T} */ (element);
};

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {ReadonlyArray<T>}
 */
export const mustAll = (selector, root = document) =>
  Object.freeze(
    Array.from(root.querySelectorAll(selector), (element) => /** @type {T} */ (element))
  );

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T | null}
 */
export const maybe = (selector, root = document) =>
  /** @type {T | null} */ (root.querySelector(selector));
