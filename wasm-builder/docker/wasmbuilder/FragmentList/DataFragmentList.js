'use strict';

const FragmentList = require('.');

// TYPES
/** @typedef { import("../DataFragment") } DataFragment */

/**
 * Creates an array that holds all parsed GoFragments with utility functions.
 */
class DataFragmentList extends FragmentList {
  constructor() {
    super();

    /**
     * @override
     * @type {DataFragment[]}
     */
    this.list = [];
  }
}

const dataFragmentList = new DataFragmentList();

module.exports = dataFragmentList;
