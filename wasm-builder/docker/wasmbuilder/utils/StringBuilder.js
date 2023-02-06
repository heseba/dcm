'use strict';

const goFragmentList = require('../FragmentList/GoFragmentList');
const Utils = require('./Utils');

// Types
/** @typedef {import("../GoFragment/GoFragmentFunction")} GoFragmentFunction */
/** @typedef {import("../GoFragment/GoFragmentTypeDefinition")} GoFragmentTypeDefinition */
/** @typedef {import("../GoFragment/GoFragmentGlobalVariable")} GoFragmentGlobalVariable */

class StringBuilder {
  /**
   * If the library has an alias, we need to set quotes around the package import and insert the alias in front.
   * @param {string} lib The library which needs to be parsed and imported in the go file.
   * @returns {string}
   */
  static #prepareLibraryString(lib) {
    let libString = '';

    const [alias, _lib] = lib.split(' ');
    if (Utils.isUndefined(_lib)) {
      libString = `"${alias}"`;
    } else {
      libString = `${alias} "${_lib}"`;
    }

    return libString;
  }

  /**
   * Creates the GO import syntax for libraries.
   * @param {string[]}
   * @returns {string}
   */
  static createLibraryString = (libs) => {
    if (libs.length === 0) return '';
    let libString = '';
    let libStr = '';

    if (libs.length === 1) {
      libStr = this.#prepareLibraryString(libs[0]);
      libString += `import ${libStr}\n`;
    } else {
      libString += `import (\n`;
      for (const lib of libs) {
        libStr = this.#prepareLibraryString(lib);
        libString += `  ${libStr}\n`;
      }
      libString += `)\n`;
    }

    return libString + '\n';
  };

  /**
   * Accumulates all parsed fragmentCode strings which were listed as dependency.
   * @param {number[]} dependsOn All dependencies which are used by the current fragment.
   * @param {string} originatedPackagePrefix Package prefix to identify if a dependency is from the same package.
   * @returns {string}
   */
  static createDependencyString = (dependsOn, originatedPackagePrefix) => {
    if (dependsOn.length === 0) return '';

    let dependencyString = '';
    /** @type {GoFragmentFunction|GoFragmentTypeDefinition|GoFragmentGlobalVariable} */
    let retrievedGoFragment = undefined;

    for (const dependencyId of dependsOn) {
      retrievedGoFragment = goFragmentList.getFragmentById(dependencyId);
      if (retrievedGoFragment.fragmentCode === '') {
        throw new Error(
          `FragmentCode for '${retrievedGoFragment.name}' is undefined. Dependency isn't parsed yet and might appear later.`
        );
      }

      // skip prefixing dependencies in the same package since there will never be name collisions
      if (originatedPackagePrefix === retrievedGoFragment.packagePrefix) {
        dependencyString += `${retrievedGoFragment.fragmentCode}\n`;
        continue;
      }

      const fragNameRegex = new RegExp(retrievedGoFragment.name, 'i');
      // rename our own locally imported dependencies
      dependencyString += `${retrievedGoFragment.fragmentCode.replace(
        fragNameRegex,
        retrievedGoFragment.packagePrefix + retrievedGoFragment.name
      )}\n`;
    }

    return dependencyString + '\n';
  };
}

module.exports = StringBuilder;
