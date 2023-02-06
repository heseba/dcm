'use strict';

// TYPES
/**
 * @typedef { import("../DataFragment") } DataFragment
 * @typedef { import("../GoFragment") } GoFragment
 */

/**
 * Creates an array that holds all parsed fragments with utility functions.
 */
class FragmentList {
  constructor() {
    this.list = [];
  }

  /**
   * Retrieves a fragment with a given ID.
   *
   * @param {number} id - ID of the fragment
   * @return {DataFragment|GoFragment|undefined} The found fragment or undefined.
   */
  getFragmentById = (id) => {
    for (const fragment of this.list) {
      if (fragment.id === id) return fragment;
    }
    return undefined;
  };

  /**
   * Adds a fragment to the list.
   *
   * @param {DataFragment|GoFragment} frag - fragment
   */
  add = (frag) => {
    this.list.push(frag);
  };

  /**
   * Check if a fragment is in the list.
   *
   * @param {Object} args - Different criteria to search for.
   * @param {number=} args.id - ID of the fragment.
   * @param {string=} args.name - Name of the fragment.
   * @param {string=} args.code - Code of the fragment.
   * @return {boolean}
   */
  contains = (args) => {
    const { id, name, code } = args || {};

    if (id) {
      for (const fragment of this.list) {
        if (fragment.id === id) return true;
      }
    } else if (name && code) {
      for (const fragment of this.list) {
        if (fragment.name === name && fragment.fragmentCode === code)
          return true;
      }
    }

    return false;
  };
}

module.exports = FragmentList;
