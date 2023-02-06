/**
 * Waits for x milliseconds, a function can be passed.
 *
 * @param {Number} ms - Time in milliseconds.
 * @param {Function} [cb=null] - Callback function which should wait.
 * @returns Promise
 */
const wait = (ms, cb) => {
  cb = cb ?? null;
  return new Promise((resolve, reject) => {
    if (cb) setTimeout(() => resolve(cb), ms);
    setTimeout(() => resolve(), ms);
  });
};

/**
 * Logs a string with timestamp.
 *
 * @param {String} message - Message string
 */
const logMessage = function (message) {
  message = new Date().toLocaleTimeString() + ' ' + message;
  console.log(message);
};

/**
 * Combines the current URL directory path with a given relative path.
 *
 * @param {*} baseUrl - URL of the current directory path.
 * @param {*} relative - Relative path to a file from the current directory.
 * @return {String} - Generates a absolute URL path to a directory.
 * @example
 * const folderPath = getAbsolutePath(
 *   "http://127.0.0.1:5005/js/callerFolder",
      "./to/this/path",
    );
 */
const getAbsolutePath = function (baseUrl, relative) {
  let splitRelativeArray = relative.split('/');
  let absolutePath = baseUrl.split('/');
  // to get on the same level as the current folder
  absolutePath.pop();

  for (let i = 0; i < splitRelativeArray.length; i++) {
    if (splitRelativeArray[i] === '.') {
      continue;
    } else if (splitRelativeArray[i] === '..') {
      absolutePath.pop();
      continue;
    }

    absolutePath.push(splitRelativeArray[i]);
  }

  return absolutePath.join('/');
};

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj);
const isError = (err) => err instanceof Error;

const stringToNumber = (str) => {
  const num = Number(str);

  if (isNaN(num)) {
    return str;
  } else {
    return num;
  }
};

// expects same time formats in unix UTC
const getTimeDiff = (end, start, precise) => {
  precise = precise ?? true;
  const diff = end - start;
  let MS = diff;

  const calcPrecision = (num) => {
    return precise ? num : Math.floor(num);
  };

  const D = calcPrecision(MS / 1000 / 60 / 60 / 24);
  MS -= D * 1000 * 60 * 60 * 24;
  const H = calcPrecision(MS / 1000 / 60 / 60);
  MS -= H * 1000 * 60 * 60;
  const M = calcPrecision(MS / 1000 / 60);
  MS -= M * 1000 * 60;
  const S = calcPrecision(MS / 1000);
  MS -= S * 1000;

  return {
    diffInMs: diff,
    print: D + ':' + H + ':' + M + ':' + S + '.' + MS,
    d: D,
    h: H,
    m: M,
    s: S,
    ms: MS,
  };
};

export {
  wait,
  logMessage,
  getAbsolutePath,
  isUndefined,
  isObject,
  isError,
  stringToNumber,
  getTimeDiff,
};
