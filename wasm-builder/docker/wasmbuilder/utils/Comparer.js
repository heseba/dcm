'use strict';

const UserInput = require('./UserInput');
const FileSystem = require('./FileSystem');
const Utils = require('./Utils');

// TYPES
/** @typedef {import("../DataFragment")} DataFragment*/
/** @typedef {typeof import("../FragmentList/DataFragmentList")} DataFragmentList*/
/** @typedef {import("../types").Suggestions} Suggestions*/
/** @typedef {import("../types").YamlDoc} YamlDoc*/
/** @typedef {import("../types").YamlData} YamlData*/

/**
 * Compares the differences between the Code-Fragment-Description and the results of the GoParser.
 */
class Comparer {
  /** @type {Suggestions[]} */
  #suggestions = [];
  // parsed
  /** @type {DataFragment[]} */
  #dataFragmentList = [];
  // CFD
  /** @type {YamlData[]} */
  #docFragmentList = [];
  #cfdPath = '';
  /** @type {YamlDoc} */
  #doc = undefined;

  /** @type {DataFragment} */
  #currentFragment = undefined;
  #currentIndex = 0;

  /**
   *
   * @param {string} cfdPath
   * @param {YamlDoc} cfdDocument
   * @param {DataFragmentList} dataFragmentList
   */
  constructor(cfdPath, cfdDocument, dataFragmentList) {
    this.#cfdPath = cfdPath;
    this.#doc = cfdDocument;
    this.#docFragmentList = cfdDocument.fragments;
    this.#dataFragmentList = dataFragmentList.list;
  }

  /**
   * Compares the internally parsed GoFragmentList against the provided CFD file. Offers to backup the current file and write the suggested changes into the new CFD.
   */
  compare = async () => {
    for (const [i, dataFragment] of this.#dataFragmentList.entries()) {
      this.#currentFragment = dataFragment;
      this.#currentIndex = i;

      if (!Utils.isUndefined(dataFragment.globalVar)) {
        this.#compareGlobalVariables();
      } else if (!Utils.isUndefined(dataFragment.typeDef)) {
        this.#compareTypeDefinitions();
      }

      if (!Utils.isUndefined(dataFragment.libs)) {
        this.#compareLibraries();
      }
    }

    // early exit, no changes needed
    if (this.#suggestions.length === 0) return;

    await this.#suggestChanges();
  };

  #suggestChanges = async () => {
    let descriptions = this.#suggestions.map(
      (suggestion) => suggestion.description
    );

    console.info(
      `Parser found possibly missing or wrongly set properties:\n\t- ${descriptions.join(
        '\n\t- '
      )}`
    );

    try {
      const shouldWriteChanges = await UserInput.yesOrNoQuestion(
        `Do you want to backup your CFD file and write the displayed changes? [y/n]\nAnswer: `
      );

      if (shouldWriteChanges) {
        // make backup
        await FileSystem.backupCfdFile(this.#cfdPath);

        // write yaml file
        for (const [i, docFragment] of this.#docFragmentList.entries()) {
          const adjustment = this.#suggestions
            .filter((suggestion) => docFragment.id === suggestion.id)
            .map((suggestion) => {
              return suggestion.adjustment;
            });

          if (adjustment.length === 0) continue;
          else if (adjustment[0]['globalVar']) {
            this.#docFragmentList[i].globalVar = adjustment[0]['globalVar'];
          } else if (adjustment[0]['typeDef']) {
            this.#docFragmentList[i].typeDef = adjustment[0]['typeDef'];
          } else if (adjustment[0]['libs']) {
            this.#docFragmentList[i].libs = adjustment[0]['libs'];
          }
        }

        FileSystem.saveCfdFile(this.#doc, this.#cfdPath);
      } else {
        console.log('Skipped suggestions.');
      }
    } catch (err) {
      throw err;
    }
  };

  #compareGlobalVariables = () => {
    if (
      Utils.isUndefined(this.#docFragmentList[this.#currentIndex].globalVar)
    ) {
      this.#suggestions.push({
        id: this.#currentFragment.id,
        name: this.#currentFragment.name,
        adjustment: { globalVar: true },
        description: `'globalVar' property for fragment #${
          this.#currentFragment.id
        } '${
          this.#currentFragment.name
        }' is not set. Suggesting setting it to 'globalVar: true'.`,
      });
    } else if (
      this.#currentFragment.globalVar !=
      this.#docFragmentList[this.#currentIndex].globalVar
    ) {
      this.#suggestions.push({
        id: this.#currentFragment.id,
        name: this.#currentFragment.name,
        adjustment: { globalVar: true },
        description: `'globalVar' property for fragment #${
          this.#currentFragment.id
        } '${this.#currentFragment.name}' is set to 'globalVar: ${
          this.#docFragmentList[this.#currentIndex].globalVar
        }'. Suggesting setting it to 'globalVar: true'.`,
      });
    }
  };

  #compareTypeDefinitions = () => {
    if (Utils.isUndefined(this.#docFragmentList[this.#currentIndex].typeDef)) {
      this.#suggestions.push({
        id: this.#currentFragment.id,
        name: this.#currentFragment.name,
        adjustment: { typeDef: true },
        description: `'typeDef' property for fragment #${
          this.#currentFragment.id
        } '${
          this.#currentFragment.name
        }' is not set. Suggesting setting it to 'typeDef: true'.`,
      });
    } else if (
      this.#currentFragment.typeDef !=
      this.#docFragmentList[this.#currentIndex].typeDef
    ) {
      this.#suggestions.push({
        id: this.#currentFragment.id,
        name: this.#currentFragment.name,
        adjustment: { typeDef: true },
        description: `'typeDef' property for fragment #${
          this.#currentFragment.id
        } '${this.#currentFragment.name}' is set to 'typeDef: ${
          this.#docFragmentList[this.#currentIndex].typeDef
        }'. Suggesting setting it to 'typeDef: true'.`,
      });
    }
  };
  #compareLibraries = () => {
    if (Utils.isUndefined(this.#docFragmentList[this.#currentIndex].libs)) {
      this.#suggestions.push({
        id: this.#currentFragment.id,
        name: this.#currentFragment.name,
        adjustment: { libs: this.#currentFragment.libs },
        description: `'libs' property for fragment #${
          this.#currentFragment.id
        } '${
          this.#currentFragment.name
        }' is not set. Suggesting setting it to 'libs: [${this.#currentFragment.libs.join(
          ', '
        )}]'.`,
      });
      return;
    }

    const fragmentLibSet = new Set(this.#currentFragment.libs);
    const docLibSet = new Set(this.#docFragmentList[this.#currentIndex].libs);
    const differentLibs = new Set(
      [...fragmentLibSet].filter((x) => !docLibSet.has(x))
    );

    if (differentLibs.size != 0) {
      const currentFragmentLibString = `[${this.#currentFragment.libs.join(
        ', '
      )}]`;
      const docFragmentLibString = Utils.isUndefined(
        this.#docFragmentList[this.#currentIndex].libs
      )
        ? 'undefined'
        : `[${this.#docFragmentList[this.#currentIndex].libs.join(', ')}]`;

      this.#suggestions.push({
        id: this.#currentFragment.id,
        name: this.#currentFragment.name,
        adjustment: { libs: this.#currentFragment.libs },
        description: `'libs' property for fragment #${
          this.#currentFragment.id
        } '${
          this.#currentFragment.name
        }' is set to 'libs: ${docFragmentLibString}'. Suggesting adding missing libraries to 'libs: ${currentFragmentLibString}'.`,
      });
    }
  };
}

module.exports = Comparer;
