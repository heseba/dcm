'use strict';

const Utils = require('./Utils');

// Types
/** @typedef {import("../types").YamlDoc} YamlDoc */

class CFDPreprocessor {
  /** @type {YamlDoc} */
  #document = undefined;
  /** @type {string[]} */

  /**
   *
   * @param {YamlDoc} document
   */
  constructor(document) {
    this.#document = document;
  };

  /**
   * Preprocesses a YAML file by deriving integer keys and adjusting the structure to the old format.
   *
   * @returns {boolean} true/false
   */
  preprocess = () => {
    let id_map = {};
    for (const [idx, fragment] of this.#document.fragments.entries()) {
      let fragment_name = "";
      let code_name = "";
      let id_actual = idx+1;
      if (!Utils.isUndefined(fragment.id)) {
        fragment_name = fragment.id;
      } else if (!Utils.isUndefined(fragment.name)){
        fragment_name = fragment.name
      }
      if (Utils.isUndefined(fragment.name)) {
        code_name = fragment_name
      } else {
        code_name = fragment.name
      }
      fragment.id = id_actual;
      fragment.name = code_name;
      fragment.fragment_name = fragment_name
      id_map[fragment_name] = id_actual;
    }
    for (const [_, fragment] of this.#document.fragments.entries()) {
      if (Utils.isUndefined(fragment.dependsOn))
        continue;
      let dependsOn = [];
      for (const [_, ref] of fragment.dependsOn.entries()) {
        let id_actual = id_map[ref]
        if (Utils.isUndefined(id_actual)) {
          console.error(`Unknown fragment '${ref}' referenced in fragment '${fragment.fragment_name}'`)
          return false;
        }
        dependsOn.push(id_actual);
      }
      fragment.dependsOn = dependsOn;
    }
    return true;
  };
}

module.exports = CFDPreprocessor;
