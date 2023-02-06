'use strict';

const GoFragment = require('./index');

// TYPES
/** @typedef { import("../DataFragment") } DataFragment */

class GoFragmentTypeDefinition extends GoFragment {
  /**
   *
   * @param {DataFragment} dataFragment
   */
  constructor(dataFragment) {
    super(dataFragment);

    /** @type {boolean} */
    this.typeDef = dataFragment.typeDef; // boolean
    /** @type {string} */
    this.type = dataFragment.type;
  }
}

module.exports = GoFragmentTypeDefinition;
