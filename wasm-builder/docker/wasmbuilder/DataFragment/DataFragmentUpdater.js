'use strict';

const path = require('path');
const { lstatSync } = require('fs');

const Utils = require('../utils/Utils');
const Debug = require('../utils/Debug');
const dataFragmentList = require('../FragmentList/DataFragmentList');

// Types
/** @typedef { import(".") } DataFragment */
/** @typedef { import("../types").Import } Import */

// goes through the dataFragment properties which were read from the CFD file and updates properties based on the results of the GoParser if necessary
class DataFragmentUpdater {
  #GoFilesList = undefined;
  /** @type {DataFragment} */
  #dataFragment = undefined;

  /**
   *
   * @param {DataFragment} dataFragment
   */
  constructor(dataFragment, goParserExportPath) {
    this.#dataFragment = dataFragment;

    let exportPath = lstatSync(goParserExportPath).isDirectory()
      ? path.join(goParserExportPath, 'export.json')
      : goParserExportPath;

    const { GoFiles: GoFilesList } = require(exportPath);
    this.#GoFilesList = GoFilesList;
  }

  update = () => {
    let goFileData = this.#findGoFileData(this.#GoFilesList);

    // check first for global variables and type definitions if it was defined by the developer
    if (this.#dataFragment.globalVar) {
      if (goFileData.global_variables.length == 0)
        Debug.printInfo(
          `Fragment #${this.#dataFragment.id} '${
            this.#dataFragment.name
          }' is not a global variable.`
        );

      this.#updateGlobalVars(goFileData.global_variables);
      return;
    } else if (this.#dataFragment.typeDef) {
      if (goFileData.type_definitions.length == 0)
        Debug.printInfo(
          `Fragment #${this.#dataFragment.id} '${
            this.#dataFragment.name
          }' is not a type definition.`
        );
      this.#updateTypeDefinitions(goFileData.type_definitions);
      return;
    }

    if (goFileData.functions.length != 0) {
      this.#updateFunctions(goFileData.functions);
    }

    // if by now nothing was found, we have to look through our data and adjust properties if the developer missed to declare something
    if (!this.#dataFragment.fragmentCode) {
      if (!Utils.isUndefined(goFileData.global_variables)) {
        this.#updateGlobalVars(goFileData.global_variables);
      }

      if (Utils.isUndefined(this.#dataFragment.globalVar)) {
        this.#updateTypeDefinitions(goFileData.type_definitions);
      }
    }

    // if it's still undefined the GoParser did a mistake or the developer entered wrong values
    if (!this.#dataFragment.fragmentCode) {
      Debug.printInfo(
        `Couldn't find Fragment #${this.#dataFragment.id} '${
          this.#dataFragment.name
        }'. Please check your CFD configuration.`
      );
    }
  };

  /**
   * Retrieves the data for the corresponding Datafragment.
   * @param {*} goFilesList export.json goparser import
   * @returns
   */
  #findGoFileData(goFilesList) {
    for (const goFileData of Object.values(goFilesList)) {
      // found file we are looking for
      if (
        goFileData.rel_filepath.endsWith(this.#dataFragment.location.filepath)
      ) {
        return goFileData;
      }
    }
  }

  #updateGlobalVars(global_variables) {
    // developer provided exact location
    const { start, end } = this.#dataFragment.location || {};
    const setProperties = (entity) => {
      this.#dataFragment.imports = entity.imports;
      this.#dataFragment.fragmentCode = entity.code;

      this.#dataFragment.fragmentCode = this.#replaceLocalImportReferences(
        this.#dataFragment.imports,
        this.#dataFragment.fragmentCode
      );

      this.#dataFragment.isExported = entity.is_exported;
      this.#dataFragment.packagePath = entity.location.rel_dirpath;

      this.#dataFragment.globalVar = true;
      this.#dataFragment.type = entity.type;
      this.#dataFragment.kind = entity.token;
      this.#dataFragment.value = entity.value;

      this.#updateLibraries(entity);
    };

    for (const entity of Object.values(global_variables)) {
      if (start && end) {
        if (
          entity.location.line_start === start &&
          entity.location.line_end === end
        ) {
          setProperties(entity);
          return;
        }
      } else if (entity.name !== this.#dataFragment.name) {
        continue;
      } else {
        setProperties(entity);
        return;
      }
    }
  }

  #updateTypeDefinitions(type_definitions) {
    // developer provided exact location
    const { start, end } = this.#dataFragment.location || {};

    const setProperties = (entity) => {
      this.#dataFragment.imports = entity.imports;
      this.#dataFragment.fragmentCode = entity.code;

      this.#dataFragment.fragmentCode = this.#replaceLocalImportReferences(
        this.#dataFragment.imports,
        this.#dataFragment.fragmentCode
      );

      this.#dataFragment.isExported = entity.is_exported;
      this.#dataFragment.packagePath = entity.location.rel_dirpath;

      this.#dataFragment.typeDef = true;
      this.#dataFragment.type = entity.type;

      this.#updateLibraries(entity);
    };

    for (const entity of Object.values(type_definitions)) {
      if (start && end) {
        if (
          entity.location.line_start === start &&
          entity.location.line_end === end
        ) {
          setProperties(entity);
          return;
        }
      } else if (entity.name !== this.#dataFragment.name) {
        continue;
      } else {
        setProperties(entity);
        return;
      }
    }
  }

  /**
   * Updates the current Datafragment with the exported data of the goparser.
   * @description There might be different criterias to search for the functions in export.json file. Looking only for a name is naive because there might be functions/interfaces with the same name on different structs. Instead check if we have already seen a function with the same signature (InterfaceParams, TypeParams, Params, ReturnValues).
   * @param {*} functions
   */
  #updateFunctions(functions) {
    // developer provided exact location
    const { start, end } = this.#dataFragment.location || {};

    const setProperties = (entity) => {
      this.#dataFragment.imports = entity.imports;
      this.#dataFragment.fragmentCode = entity.code;

      // e.g. models.Profile => shared__models__profile
      this.#dataFragment.fragmentCode = this.#replaceLocalImportReferences(
        this.#dataFragment.imports,
        this.#dataFragment.fragmentCode
      );

      this.#dataFragment.isExported = entity.is_exported;
      this.#dataFragment.packagePath = entity.location.rel_dirpath;

      this.#updateLibraries(entity);
      this.#dataFragment.isInterface = entity.is_interface;
      this.#dataFragment.interfaceParameterList =
        entity.interface_parameter_list;
      this.#dataFragment.genericTypeParameterList = entity.type_parameter_list;
      this.#dataFragment.functionParameterList = entity.parameter_list;
      this.#dataFragment.returnParameterList = entity.return_values_list;
    };

    for (const entity of Object.values(functions)) {
      // we know exactly the location
      if (start && end) {
        if (
          entity.location.line_start === start &&
          entity.location.line_end === end
        ) {
          setProperties(entity);
          return;
        }
      } else if (entity.name !== this.#dataFragment.name) {
        continue;
      } else {
        if (entity.is_interface) {
          // Problem: the interface fragment function in the CFD can match multiple functions with the same name found by the goparser but on different structs => compare associated dependencies with interface parameters
          // go through each dependency of the interface method (must be provided in the CFD) and if the found type definition matches the interface parameters we found our entity

          this.#dataFragment.dependsOn.forEach((dependency) => {
            const fragment = dataFragmentList.getFragmentById(dependency);
            if (fragment && fragment.typeDef) {
              /** @type {string} */
              let interfaceParameter = entity.interface_parameter_list[0].type;
              interfaceParameter = interfaceParameter.startsWith('*')
                ? interfaceParameter.substring(1)
                : interfaceParameter;

              // naive compare
              if (fragment.name.endsWith(interfaceParameter)) {
                setProperties(entity);
                return;
              }
            }
          });
        } else {
          setProperties(entity);
          return;
        }
      }
    }
  }

  /**
   * prioritise libraries found by GoParser and check against config of developer
   * @param {*} goFragment - current fragment object from the CFD file
   * @param {*} entity - information object about the function parsed by GoParser
   */
  #updateLibraries(entity) {
    // GoParser didn't find any libraries in function
    if (Utils.isUndefined(entity.libraries) || entity.libraries?.length === 0) {
      // developer also didn't specified any
      if (
        Utils.isUndefined(this.#dataFragment.libs) ||
        this.#dataFragment.libs?.length === 0
      ) {
        return;
      }

      // developer specified library by mistake
      if (
        !Utils.isUndefined(this.#dataFragment.libs) ||
        this.#dataFragment.libs?.length !== 0
      ) {
        Debug.printInfo(
          `Fragment #${this.#dataFragment.id} '${
            this.#dataFragment.name
          }' does not use any libraries. Check the CFD configuration.`
        );
      }
    }

    let libSet = new Set();

    // formatting ["alias name"] or ["name"] seperated by space
    for (const lib of entity.libraries) {
      if (lib.alias === '') libSet.add(lib.name);
      else libSet.add(`${lib.alias} ${lib.name}`);
    }

    if (
      !Utils.isUndefined(this.#dataFragment.libs) &&
      this.#dataFragment.libs?.length !== 0
    ) {
      for (const lib of this.#dataFragment.libs) {
        if (!libSet.has(lib.trim())) {
          Debug.printInfo(
            `Library '${lib}' not used in fragment #${this.#dataFragment.id} '${
              this.#dataFragment.name
            }'.`
          );
        }

        libSet.add(lib);
      }
    }

    this.#dataFragment.libs = [...libSet];
  }

  /**
   * Replaces all in the fragmentcode referenced local module imports.
   * @description When putting everything together in one file, we don't care about imports from our own project module and do not add them in the import statement on the top. Instead we have to replace all referenced imports with a unique string because they might have the same name but are coming from a different package. e.g.
   * @param {Import[]} imports
   * @param {string} fragmentCode
   * @returns
   */
  #replaceLocalImportReferences = (imports, fragmentCode) => {
    if (!imports) {
      return fragmentCode;
    }

    let prefix = '';
    let fragNameRegex = undefined;

    for (const imp of imports) {
      // skip imports which are not in our module (e.g. libs)
      if (!imp.local) continue;

      // cut off the main module name with .slice(1)
      prefix = imp.name.split('/').slice(1).join('__') + '__';

      if (!imp.alias) {
        imp.alias = imp.name.split('/').pop();
      }

      fragNameRegex = new RegExp(`${imp.alias}\.`, 'i');
      fragmentCode = fragmentCode.replace(fragNameRegex, prefix);
    }

    return fragmentCode;
  };
}

module.exports = DataFragmentUpdater;
