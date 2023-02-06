'use strict';

const Utils = require('./Utils');

// Types
/** @typedef {import("../types").YamlDoc} YamlDoc */

class CFDValidator {
  /** @type {YamlDoc} */
  #document = undefined;
  /** @type {string[]} */
  #validRunOnLocations = undefined;

  #validKeys = [
    'id',
    'name',
    'globalVar',
    'typeDef',
    'runOn',
    'location',
    'filepath',
    'start',
    'end',
    'libs',
    'dependsOn',
  ];

  /**
   *
   * @param {YamlDoc} document
   * @param {YamlDoc} newDocument
   */
  constructor(document) {
    this.#document = document;
    this.#validRunOnLocations = ['client', 'server'];
  }

  /**
   * Checks if a given GoFragment is private to the file and is not meant to be exposed to other packages. Compares the first letter.
   *
   * @param {GoFragmentGlobalVariable|GoFragmentTypeDefinition|GoFragmentFunction} frag
   * @returns {boolean} true/false
   */
  #isPrivateToFile = (frag) => frag.name[0] === frag.name[0].toLowerCase();

  #fillInvalidKeys = (obj, arr) => {
    for (var k in obj) {
      if (!this.#validKeys.includes(k)) {
        arr.push(k);
      }
      if (
        typeof obj[k] === 'object' &&
        !Array.isArray(obj[k]) &&
        obj[k] !== null
      ) {
        this.#fillInvalidKeys(obj[k], arr);
      }
    }
  };

  /**
   * Checks if the structure of the CFD YAML file is valid.
   * @description
   * RULES:
   * * Document must not be empty
   * * Document must start with 'fragments' root key
   * * Only one root key is allowed
   * * Document must have at least one fragment
   * * Every fragment must provide 'runOn' property
   */
  validate = () => {
    /** @type {string[]} */
    const errors = [];

    if (Utils.isUndefined(this.#document)) {
      console.error(`Invalid CFD file structure.\n\t- CFD file is empty.`);
      return false;
    }

    if (
      Utils.isUndefined(this.#document.fragments) ||
      Utils.isUndefined(this.#document.fragments[0])
    ) {
      console.error(
        "Invalid CFD file structure.\n\t- CFD file doesn't contain any fragment definitions."
      );
      return false;
    }

    // document root key
    const rootKeys = Object.keys(this.#document);
    if (rootKeys[0] !== 'fragments') {
      errors.push("Document must begin with 'fragments' object.");
    }

    for (const [_, fragment] of this.#document.fragments.entries()) {
      const collectedInvalidKeys = [];
      const isPrivateToFile = this.#isPrivateToFile(fragment);
      this.#fillInvalidKeys(fragment, collectedInvalidKeys);

      // check possible typos in properties
      for (const prop of collectedInvalidKeys) {
        let testCase = {
          lib: new RegExp(/^lib/i).test(prop),
          depend: new RegExp(/^depend/i).test(prop),
          run: new RegExp(/^run/i).test(prop),
        };
        let exactRegex = {
          libs: new RegExp(/^libs$/).test(prop),
          dependsOn: new RegExp(/^dependsOn$/).test(prop),
          runOn: new RegExp(/^runOn$/).test(prop),
        };

        if (testCase.lib && !exactRegex.libs) {
          errors.push(
            `Fragment #${fragment.id} '${fragment.name}' has probably invalid property: '${prop}'. Did you mean: 'libs'?`
          );
          continue;
        }
        if (testCase.depend && !exactRegex.dependsOn) {
          errors.push(
            `Fragment #${fragment.id} '${fragment.name}' has probably invalid property: '${prop}'. Did you mean: 'dependsOn'?`
          );
          continue;
        }
        if (!isPrivateToFile && testCase.run && !exactRegex.runOn) {
          errors.push(
            `Fragment #${fragment.id} '${fragment.name}' has probably invalid property: '${prop}'. Did you mean: 'runOn'?`
          );
          continue;
        }

        errors.push(
          `Fragment #${fragment.id} '${fragment.name}' has unknown property: '${prop}'.`
        );
      }

      const checkRunOnPropertyWhen = [
        isPrivateToFile,
        fragment.globalVar ?? false,
        fragment.typeDef ?? false,
      ];

      // check if runOn property is defined for all non private functions
      // private functions are not migratebale and therefore do not need runOn
      if (checkRunOnPropertyWhen.every((elem) => elem === false)) {
        // if a key is defined, check if it's a valid value
        if (fragment.hasOwnProperty('runOn')) {
          if (
            typeof fragment.runOn !== 'string' ||
            !this.#validRunOnLocations.includes(fragment.runOn.trim())
          ) {
            errors.push(
              `Fragment #${fragment.id} '${
                fragment.name
              }' doesn't have valid 'runOn' value of: '${
                fragment.runOn
              }'. Options: [${this.#validRunOnLocations.join(', ')}]`
            );
          }
        } else {
          // otherwise check if the key is missing on the fragment
          const runOnKey =
            Object.keys(fragment).filter((prop) =>
              new RegExp(/^runOn$/i).test(prop)
            )[0] ?? '';

          if (!runOnKey) {
            errors.push(
              `Fragment #${fragment.id} '${fragment.name}' doesn't have property: 'runOn'.`
            );
          }
        }
      }
    }

    return errors.length === 0
      ? true
      : (() => {
          console.error(
            `Invalid CFD file structure.\n\t- ${errors.join('\n\t- ')}`
          );
          return false;
        })();
  };
}

module.exports = CFDValidator;
