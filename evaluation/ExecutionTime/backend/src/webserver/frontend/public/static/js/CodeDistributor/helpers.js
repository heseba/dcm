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

export {
  wait,
  logMessage,
  getAbsolutePath,
  isUndefined,
  isObject,
  isError,
  stringToNumber,
};
