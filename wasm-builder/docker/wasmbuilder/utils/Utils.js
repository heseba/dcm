'use strict';

module.exports = class Utils {
  /**
   * Check if variable is undefined or uninitialized.
   * @param {any} obj - The variable to check against.
   */
  static isUndefined = (obj) => typeof obj === 'undefined' || obj === null;

  /**
   * Returns the class name of an object or undefined.
   * @param {any} obj
   * @returns {(string|undefined)}
   */
  static getClassName = (obj) => {
    if (typeof obj !== 'object') {
      return undefined;
    }
    const className = Object.getPrototypeOf(obj).constructor.name;

    return className === 'Object' ? undefined : className;
  };

  /**
   * Creates a shallow copy (only one level of primitive types is copied) of a existing array to resolve the reference problem.
   * @param {any[]} list
   * @returns {any[]} Copy of the array list.
   */
  static cloneList = (list) => Object.assign([], list) ?? [];

  /**
   * Creates a shallow copy (only one level of primitive types is copied) of a existing object to resolve the reference problem.
   * @param {any} list
   * @returns {any} Copy of the object.
   */
  static cloneObject = (obj) => JSON.parse(JSON.stringify(obj)) ?? {};
};
