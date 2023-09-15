'use strict';

const DataFragmentUpdater = require('./DataFragmentUpdater');

/** @typedef {import('../types').YamlData} YamlData */
/** @typedef {import('../types').GenericTypeParameter} GenericTypeParameter */
/** @typedef {import('../types').InterfaceParameter} InterfaceParameter */
/** @typedef {import('../types').FunctionParameter} FunctionParameter */
/** @typedef {import('../types').ReturnParameter} ReturnParameter */
/** @typedef {import('../types').Import} Import */

/**
 * This class holds all possible fragment properties and updates the one provided by the developer against what the GoParser found.
 */
class DataFragment {
  /**
   * @param {YamlData} yamlData
   * @param {string} cfdPath
   */
  constructor(yamlData, cfdPath) {
    this.cfdPath = cfdPath;

    // from the YAML file
    this.id = yamlData.id ?? 'auto';
    this.name = yamlData.name;
    this.fragment_name = yamlData.fragment_name;
    this.runOn = yamlData.runOn;
    this.location = yamlData.location;
    this.libs = yamlData.libs;
    this.dependsOn = yamlData.dependsOn;
    this.globalVar = yamlData.globalVar;
    this.typeDef = yamlData.typeDef;

    // from the GoParser json file
    /** @type {Import[]} */
    this.imports = [];
    this.isExported = false;
    this.packagePath = '';
    /** @type {boolean} */
    this.isInterface = undefined;

    /** @type {InterfaceParameter[]|undefined} */
    this.interfaceParameterList = undefined;
    /** @type {GenericTypeParameter[]|undefined} */
    this.genericTypeParameterList = undefined;

    /** @type {FunctionParameter[]|undefined} */
    this.functionParameterList = undefined;
    /** @type {ReturnParameter[]|undefined} */
    this.returnParameterList = undefined;

    // for global variable and type definitions
    /** @type {string|undefined} */
    this.type = undefined;
    // var | const
    /** @type {string|undefined} */
    this.kind = undefined;
    /** @type {string|undefined} */
    this.value = undefined;

    this.fragmentCode = '';
  }

  update = (goParserExportPath, maxId) => {
    new DataFragmentUpdater(this, goParserExportPath, maxId).update();
  };
}

module.exports = DataFragment;
