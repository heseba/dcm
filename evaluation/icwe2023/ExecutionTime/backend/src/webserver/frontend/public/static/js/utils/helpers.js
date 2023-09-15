/**
 * Shortcut for querySelector
 *
 * @param {string} selector
 * @returns {HTMLElement} the HTMLElement
 */
const selectElement = (selector) => document.querySelector(selector);

/**
 * Shortcut for querySelectorAll
 *
 * @param {string} selector
 * @returns {Array<HTMLElement>} array of HTMLElements
 */
const selectElements = (selector) => document.querySelectorAll(selector);

/* waits for x miliseconds, a function can be passed */
const wait = (ms, cb) => {
  cb = cb || null;
  return new Promise((resolve, reject) => {
    if (cb) setTimeout(() => resolve(cb), ms);
    setTimeout(() => resolve(), ms);
  });
};

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

const getLang = () => {
  if (navigator.languages != undefined) return navigator.languages[0];
  return navigator.language;
};

const stringToNumber = (str) => {
  const num = Number(str);

  if (isNaN(num)) {
    return str;
  } else {
    return num;
  }
};

const isArray = (arr) => {
  return typeof arr === 'object' && Array.isArray(arr);
};

/**
 * Attaches multiple EventListener on elements.
 * @param {(HTMLElement|Array<HTMLElement>)} elements Element(s) to which the event(s) should be attached.
 * @param {String|Array<String>} eventNames Event(s) on which should be listened to, seperated by space or in array.
 * @param {Function} listener Callback - decide what should happen after attaching the events.
 * @param {Object} [options={capture:false}] EventListener options like capture, once or bubble. useCapture defaults to false.
 * @example addEventListenerMulti(item, "event1 event2", (e) => {e.stopPropagation(); e.preventDefault();}, {once: true})
 * @example addEventListenerMulti(item, ["event1", "event2"], (e) => {e.stopPropagation(); e.preventDefault();}, {once: true})
 */
const addEventListenerMulti = (
  elements,
  eventNames,
  listener,
  options = { capture: false }
) => {
  // one element with multiple events
  if (typeof elements === 'object' && typeof elements.length === 'undefined') {
    const events = isArray(eventNames) ? eventNames : eventNames.split(' ');
    for (let i = 0; i < events.length; i++) {
      elements.addEventListener(events[i], listener, options);
    }
  }
  // multiple elements with multiple events
  else if (
    typeof elements === 'object' &&
    typeof elements.length === 'number'
  ) {
    for (let i = 0; i < elements.length; i++) {
      const events = isArray(eventNames) ? eventNames : eventNames.split(' ');
      for (let j = 0; j < events.length; j++) {
        elements[i].addEventListener(events[j], listener, options);
      }
    }
  } else {
    throw new Error(`Wrong type of elements passed: '${typeof elements}'`);
  }
};

const promiseAllFromObject = async (promisesObject) =>
  Object.keys(promisesObject).reduce(async (acc, key) => {
    const lastResult = await acc;
    return Object.assign(lastResult, { [key]: await promisesObject[key] });
  }, Promise.resolve({}));

export {
  selectElement,
  selectElements,
  wait,
  isUndefined,
  stringToNumber,
  getLang,
  addEventListenerMulti,
  promiseAllFromObject,
};
