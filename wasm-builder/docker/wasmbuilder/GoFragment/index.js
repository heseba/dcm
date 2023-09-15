'use strict';

const Utils = require('../utils/Utils');

// TYPES
/** @typedef { import("../DataFragment") } DataFragment */

class GoFragment {
  /**
   *
   * @param {DataFragment} dataFragment
   */
  constructor(dataFragment) {
    this.id = dataFragment.id;
    this.name = dataFragment.name;
    this.fragment_name = dataFragment.fragment_name;
    this.runOn = dataFragment.runOn;
    /** @type {string[]} */
    this.libs = Utils.cloneList(dataFragment.libs);
    /** @type {string[]} */
    this.imports = Utils.cloneList(dataFragment.imports);
    /** @type {number[]} */
    this.dependsOn = Utils.cloneList(dataFragment.dependsOn);
    this.fragmentCode = dataFragment.fragmentCode;
    this.isExported = dataFragment.isExported;

    this.packagePath = dataFragment.packagePath;
    this.packagePrefix =
      dataFragment.packagePath.split('/').slice(1).join('__') + '__';
  }
}

module.exports = GoFragment;
