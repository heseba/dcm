'use strict';

const FragmentList = require('.');

//#region TYPES
/**
 * @typedef { import("../GoFragment/GoFragmentFunction") } GoFragmentFunction
 * @typedef { import("../GoFragment/GoFragmentGlobalVariable") } GoFragmentGlobalVariable
 * @typedef { import("../GoFragment/GoFragmentTypeDefinition") } GoFragmentTypeDefinition
 */
//#endregion

/**
 * Creates an array that holds all parsed GoFragments with utility functions.
 */
class GoFragmentList extends FragmentList {
  constructor() {
    super();

    /**
     * @override
     * @type {(GoFragmentFunction|GoFragmentGlobalVariable|GoFragmentTypeDefinition)[]}
     */
    this.list = [];
  }
}

const goFragmentList = new GoFragmentList();

module.exports = goFragmentList;
