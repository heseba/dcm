'use strict';

//#region IMPORTS
const dataFragmentList = require('../FragmentList/DataFragmentList');
const goFragmentList = require('../FragmentList/GoFragmentList');
const FileSystem = require('../utils/FileSystem');
const Comparer = require('../utils/Comparer');
const CFDPreprocessor = require('../utils/CFDPreprocessor');
const CFDValidator = require('../utils/CFDValidator');
const DataFragment = require('../DataFragment');
const GoFragmentGlobalVariable = require('../GoFragment/GoFragmentGlobalVariable');
const GoFragmentTypeDefinition = require('../GoFragment/GoFragmentTypeDefinition');
const GoFragmentFunction = require('../GoFragment/GoFragmentFunction');
const Utils = require('../utils/Utils');
const Config = require('../utils/Config');
//#endregion

// Types
/** @typedef {import("../types").YamlDoc} YamlDoc */

/**
 * This class creates a list filled with GoFragment instances.
 * It first extracts all function bodies and then creates all necessary function headers with dependencies and libraries. Lastly it creates the files.
 *
 */
class WasmBuilder {
  // private fields
  #cfdPath = '';
  #pluginTempPath = '';
  #goTempPath = '';
  #goParserExportPath = '';
  #functionsPath = '';
  #wsPath = '';
  #apiPath = '';
  #maxReconnectAttempts = '';
  /** @type {YamlDoc|undefined} */
  #cfdDocument = undefined;
  /** @type {YamlDoc|undefined} */
  #cfdDocumentCopy = undefined;

  /**
   *
   * @param {string} cfdPath
   * @param {string} goOutputPath
   */
  constructor(cfdPath, pluginTempPath, goOutputPath, goParserExportPath, functionsPath, wsPath, apiPath, maxReconnectAttempts) {
    this.#cfdPath = cfdPath;
    this.#pluginTempPath = pluginTempPath;
    this.#functionsPath = functionsPath;
    this.#wsPath = wsPath;
    this.#apiPath = apiPath;
    this.#maxReconnectAttempts = maxReconnectAttempts;
    this.#goTempPath = goOutputPath;
    this.#goParserExportPath = goParserExportPath;
    this.#cfdDocument = FileSystem.loadCfdFile(cfdPath);

    /**
     * A copy of the original document. This is the object we will be working on.
     * Deep clone object, to compare against the newly parsed information the GoParser found to provide suggestions to the developer what to change in their configuration. (Comparer class)
     * We could use the method structuredClone(value[, options]) from node 17.0 but since we know the structure of the document we can predict that everything should be copied correctly using the JSON API.
     */
    this.#cfdDocumentCopy = Utils.cloneObject(this.#cfdDocument);
  }

  /**
   * Creates GO function strings, generates the GO file structure and creates the files.
   */
  build = () => {
    const cfdPreprocessor = new CFDPreprocessor(this.#cfdDocument);
    const cfdValidator = new CFDValidator(this.#cfdDocument);
    let maxId = 0;
    let updateMaxId = (newId) => {maxId = newId};

    if (!cfdValidator.validate(maxId, updateMaxId)) {
      process.exit(1);
    }

    if (!cfdPreprocessor.preprocess()) {
      process.exit(1);
    }

    this.#cfdDocumentCopy = Utils.cloneObject(this.#cfdDocument);

    // create fragmentCode snippets and fill the goFragmentList
    // NOTE we need each fragmentCode string first to reference them as dependency later when we create the header section
    try {
      for (const [_, yamlData] of Object.entries(
        this.#cfdDocumentCopy.fragments
      )) {
        // reading from CFD YAML
        const dataFragment = new DataFragment(yamlData, this.#cfdPath);
        dataFragment.update(this.#goParserExportPath, maxId );

        if (this.#isIdInUse(dataFragment)) {
          process.exit(1);
        }
        dataFragmentList.add(dataFragment);

        // generate the correct objects and add them to the list
        if (dataFragment.globalVar) {
          goFragmentList.add(new GoFragmentGlobalVariable(dataFragment));
        } else if (dataFragment.typeDef) {
          goFragmentList.add(new GoFragmentTypeDefinition(dataFragment));
        } else {
          goFragmentList.add(new GoFragmentFunction(dataFragment));
        }
      }
    } catch (err) {
      throw err;
    }

    this.#generateCodeAndFiles();

    /**
     * At this point we have all information we need to generate the code, otherwise the validator would have been yelling at us already that's why we can make suggestions for the configuration. Put it at the end so it doesn't hinder the file generation.
     */
    new Comparer(this.#cfdPath, this.#cfdDocument, dataFragmentList).compare();
  };

  /**
   * Checks if a ID of a giving DataFragment is already in use. Was replaced by the isExported property parsed by the GoParser.
   *
   * @param {DataFragment} fragment
   * @returns {boolean} true/false
   */
  #isIdInUse = (fragment) => {
    if (dataFragmentList.contains({ id: fragment.id })) {
      console.error(
        `Dublicate ID found: #${fragment.id} for fragments "${
          dataFragmentList.getFragmentById(fragment.id).name
        }" and "${fragment.name}".`
      );
      return true;
    }
    return false;
  };

  /**
   * Generate the WASMGoCode, PluginGoCode und create files
   */
  #generateCodeAndFiles = () => {
    let snippets = [`import CodeDistributor from './index.js';

const codeDistributor = new CodeDistributor({
  moduleDir: './CodeDistributor',
  wasmDir: './CodeDistributor/wasm',
  // host: '127.0.0.1:5005',
  wsPath: '${this.#wsPath}',
  apiPath: '${this.#apiPath}',
  maxReconnectAttempts: ${this.#maxReconnectAttempts},
});`];
    let funcs = [];
    for (const goFragment of goFragmentList.list) {
      // we only create files of exported functions that we want to use
      // interfaces cannot be called directly like regular functions, they belong to an object
      const skipFileCreationWhen = [
        !goFragment.isExported,
        goFragment.fragmentCode === '',
        /** @type {GoFragmentGlobalVariable} */ (goFragment).globalVar ?? false,
        /** @type {GoFragmentTypeDefinition} */ (goFragment).typeDef ?? false,
        /** @type {GoFragmentFunction} */ (goFragment).isInterface ?? false,
      ];

      if (skipFileCreationWhen.some((elem) => elem === true)) {
        continue;
      }

      // type casting
      /** @type {GoFragmentFunction} */ (goFragment).buildWasmCode();
      /** @type {GoFragmentFunction} */ (goFragment).buildPluginCode();

      if (!Config.debug.skipFileGeneration) {
        FileSystem.createGoFile(goFragment, this.#goTempPath, 'wasm');
        FileSystem.createGoFile(goFragment, this.#pluginTempPath, 'plugin');
      }
      funcs.push(goFragment.name)
      snippets.push(`const ${goFragment.fragment_name} = async (...args) => {
  return codeDistributor.call({
    wasmId: ${goFragment.id},
    wasmFunc: '${goFragment.fragment_name}',
    wasmParams: args,
  });
}`);
    }
    snippets.push(`export { ${funcs.join(", ")} }`)
    FileSystem.createJSFile(snippets.join("\n\n"), this.#functionsPath, 'functions')
    console.log(`Wrote functions file to '${this.#functionsPath}'`)
  };
}

module.exports = WasmBuilder;
