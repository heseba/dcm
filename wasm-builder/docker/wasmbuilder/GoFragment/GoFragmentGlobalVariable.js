'use strict';

const GoFragment = require('./index');

// TYPES
/** @typedef { import("../DataFragment") } DataFragment */

class GoFragmentGlobalVariable extends GoFragment {
  /**
   *
   * @param {DataFragment} dataFragment
   */
  constructor(dataFragment) {
    super(dataFragment);

    /** @type {boolean} */
    this.globalVar = dataFragment.globalVar; // boolean

    /** @type {string} */
    this.type = dataFragment.type;
    /** @type {string} */
    this.kind = dataFragment.kind;
    /** @type {string} */
    this.value = dataFragment.value;
  }
}

module.exports = GoFragmentGlobalVariable;
