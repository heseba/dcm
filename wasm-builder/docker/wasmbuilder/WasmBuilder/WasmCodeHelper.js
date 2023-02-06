'use strict';

const GoDatatype = require('../utils/GoDatatype');
const goFragmentList = require('../FragmentList/GoFragmentList');
const Indenter = require('../utils/Indenter');
const Utils = require('../utils/Utils');
const GoHelperFunctions = require('../utils/GoHelperFunctions');
const Debug = require('../utils/Debug');

// Types
/** @typedef {import("../GoFragment/GoFragmentFunction")} GoFragmentFunction */
/** @typedef {import("../GoFragment/GoFragmentTypeDefinition")} GoFragmentTypeDefinition */
/** @typedef {import("../GoFragment/GoFragmentGlobalVariable")} GoFragmentGlobalVariable */

class WasmCodeHelper {
  /** @type {GoFragmentFunction} */
  #frag = undefined;
  #hasFunctionParameters = false;
  #hasReturnValues = false;

  // for including helper functions and transformations after we went through all parameters
  #hasVariadicParameter = false;
  #hasObjectParameterDatatype = false;
  #hasObjectArrayParameterDatatype = false;
  #hasObjectReturnValueDatatype = false;
  #hasArrayReturnValueDatatype = false;
  #hasErrorReturnValueDatatype = false;

  // final parameter string for the function
  #parameterString = '';
  // group variadic and array transformations in one block
  #groupedArrayTransformations = ``;
  // group object transformations in one block
  #groupedObjectTransformations = ``;
  /** @type {number[]} */
  #arrayOrObjectParamPos = [];

  /**
   * helper functions outside the wrapper function, require an unique name or it might interfere with developer function names
   * @description currently not used/filled
   *  @type {string[]}
   */
  #outerHelpers = [];
  /**
   * helper functions inside the wrapper function
   *  @type {string[]}
   */
  #innerHelpers = [];

  /**
   *
   * @param {GoFragmentFunction} frag
   */
  constructor(frag) {
    this.#frag = frag;

    this.#hasFunctionParameters = frag.functionParameterList.length !== 0;
    this.#hasReturnValues = frag.returnParameterList.length !== 0;

    this.#detectSpecialReturnDatatypes();
  }

  /**
   * Checks if return values have an unconvertable datatype which needs to be handled by us.
   */
  #detectSpecialReturnDatatypes = () => {
    if (this.#hasReturnValues) {
      for (const returnValue of this.#frag.returnParameterList) {
        if (GoDatatype.isArrayDatatype(returnValue.type)) {
          this.#hasArrayReturnValueDatatype = true;
        } else if (GoDatatype.isObjectDatatype(returnValue.type)) {
          this.#hasObjectReturnValueDatatype = true;
        } else if (GoDatatype.isErrorDatatype(returnValue.type)) {
          this.#hasErrorReturnValueDatatype = true;
        } else if (GoDatatype.isUnknownDatatype(returnValue.type)) {
          this.#hasObjectReturnValueDatatype = true;
          // add bytes and json library if there is an unknown datatype we cannot handle with the syscall library or cannot return easily
          this.#frag.addLib('bytes', 'encoding/json');
        }
      }
    }
  };

  setDefaultLines() {
    this.#frag.wasmGoCode =
      '//go:build wasm && js\n// +build wasm,js\n\npackage main\n\n';

    // always add this GO package because we attach the function to global window and convert parameter datatypes if present
    this.#frag.addLib('syscall/js');
  }

  /**
   * Gathers deoendencies of dependencies and priotizes Type Definitions or Interfaces to be on top in the file string.
   * @returns
   */
  collectDependencies_old = () => {
    // early exit if there aren't any dependencies
    if (this.#frag.dependsOn.length === 0) return;

    let commonDependencies = this.#getCommonDependencies_old(
      this.#frag.dependsOn,
      0,
      this.#frag.dependsOn
    );

    // type definitions and their interfaces should come first
    let prioritizedDependencies = commonDependencies.filter((dependencyId) => {
      const frag = goFragmentList.getFragmentById(dependencyId);
      return frag?.typeDef || frag?.isInterface;
    });

    // prepend prioritized IDs first, then merge them and remove all duplicates
    this.#frag.dependsOn = [
      ...new Set([...prioritizedDependencies, ...commonDependencies]),
    ];
  };

  /**
   * Recursively resolve dependencies in other dependencies, collect them into one list and add their used libraries as well.
   *
   * @param {array<number>} dependencyList - The dependency list of the current fragment function.
   * @param {number} i - The index to keep track where we currently are.
   * @param {number[]} commonList - The curated list of dependencies which are required by every found dependency.
   * @return {number[]} - Returns the list of common depencency IDs.
   */
  #getCommonDependencies_old = (dependencyList, i, commonList) => {
    // if we went through all dependencies of the current fragment function
    if (dependencyList.length === i) return commonList;

    let retrievedFragment = goFragmentList.getFragmentById(dependencyList[i]);

    // add libraries from the dependency to the sourceFragment and ignore duplicates
    if (retrievedFragment.libs.length !== 0)
      this.#frag.libs = Array.from(
        new Set(this.#frag.libs.concat(retrievedFragment.libs))
      );

    if (retrievedFragment.dependsOn.length !== 0) {
      for (const dependencyId of retrievedFragment.dependsOn) {
        // skip already known dependencies and the source fragment to avoid circular dependencies
        if (commonList.includes(dependencyId) || dependencyId === this.#frag.id)
          continue;

        commonList.push(dependencyId);

        this.#getCommonDependencies_old(
          retrievedFragment.dependsOn,
          0,
          [...commonList] // new array, do not reference the old array for every new deep iteration
        );
      }
    }

    i++;
    return this.#getCommonDependencies_old(dependencyList, i, commonList);
  };

  /**
   * Gathers deoendencies of dependencies and priotizes Type Definitions or Interfaces to be on top in the file string.
   * @returns
   */
  collectDependencies = () => {
    // early exit if there aren't any dependencies
    if (this.#frag.dependsOn.length === 0) return;

    this.#getCommonDependencies(this.#frag.dependsOn);

    // type definitions and their interfaces should come first
    let prioritizedDependencies = this.#frag.dependsOn.filter(
      (dependencyId) => {
        const frag = goFragmentList.getFragmentById(dependencyId);
        return frag?.typeDef || frag?.isInterface;
      }
    );

    // prepend prioritized IDs first, then merge them and remove all duplicates
    this.#frag.dependsOn = [
      ...new Set([...prioritizedDependencies, ...this.#frag.dependsOn]),
    ];
  };

  /**
   * Recursively resolve dependencies in other dependencies, collect them into one list and add their used libraries as well.
   *
   * @param {number[]} currentDependencies - The dependency list of the current fragment function.
   */
  #getCommonDependencies = (currentDependencies) => {
    if (currentDependencies.length === 0) return;

    let retrievedFragment = undefined;

    for (const dependencyId of currentDependencies) {
      retrievedFragment = goFragmentList.getFragmentById(dependencyId);

      // stop never ending loop if two fragments are referenced to each other
      // array is filled when there are still differences
      let dependencyDifference = retrievedFragment.dependsOn.filter(
        (dependency) => !this.#frag.dependsOn.includes(dependency)
      );

      if (Utils.isUndefined(retrievedFragment)) {
        Debug.printInfo(
          `Fragment #${dependencyId} not found in dependency list.`
        );
      } else if (retrievedFragment.id === this.#frag.id) {
        continue;
      }

      // add libraries from the dependency to the sourceFragment and ignore duplicates
      if (retrievedFragment.libs.length !== 0)
        this.#frag.libs = Array.from(
          new Set(this.#frag.libs.concat(retrievedFragment.libs))
        );

      this.#frag.dependsOn = Array.from(
        new Set(this.#frag.dependsOn.concat(retrievedFragment.dependsOn))
      );

      if (
        retrievedFragment.dependsOn.length !== 0 &&
        dependencyDifference.length !== 0
      ) {
        this.#getCommonDependencies(retrievedFragment.dependsOn);
      }
    }
  };

  /**
   * Creates the wrapper function. Checks if the original function returns 0, 1 or more values and transforms it accordingly.
   * @returns {string}
   */
  #createFunctionWrapperWithoutParameters() {
    const functionHead = Indenter.undent`
    func __wrapper() js.Func {
      return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
        if len(args) > 0 {
          panic("Function '${this.#frag.name}' does not expect any arguments.")
        }
    `;

    // if we don't have any return values, just execute the function and return nil interface (we need to return anything of type interface{})
    if (!this.#hasReturnValues) {
      return Indenter.undent`
      ${functionHead}

          ${this.#frag.name}()

          return nil
        })
      }`;
    } else if (this.#frag.returnParameterList.length === 1) {
      const isF = GoDatatype.isFuncDatatype(
        this.#frag.returnParameterList[0].type
      );

      // TODO what happens if we return an object or anything else?
      // if we have return values, check if we need double invocation (don't care about returning values, since we are only returning the function but already invoked) - GO functions cannot be in multiple return values
      return Indenter.undent`
      ${functionHead}
          return ${this.#frag.name}()${isF ? '()' : ''}
        })
      }`;
    } else if (this.#frag.returnParameterList.length > 1) {
      const [functionCall, returnValues] = this.#prepareMultiReturnValues();

      if (this.#hasObjectReturnValueDatatype) {
        this.#addInnerHelpers(GoHelperFunctions.transcodeHelperFunction);
      }
      if (this.#hasErrorReturnValueDatatype) {
        this.#addInnerHelpers(GoHelperFunctions.newErrorHelperFunction);
      }

      return Indenter.undent`
      ${functionHead}
          ${this.#innerHelpers.join('')}
          ${functionCall}
          return map[string]interface{}{
            ${returnValues}
          }
        })
      }`;
    }
  }

  /**
   * Adds one or multiple strings. Skips if it's already included.
   * @description Allows comma separated strings or a string array as parameter.
   * @param {...string|string[]} helpers
   */
  #addInnerHelpers = (...helpers) => {
    if (
      helpers.length === 1 &&
      Object.getPrototypeOf(helpers[0]).constructor.name == 'Array'
    ) {
      helpers = helpers[0];
    }

    if (this.#innerHelpers.length == 0) {
      this.#innerHelpers = helpers;
      return;
    }

    for (const helper of helpers) {
      if (!this.#innerHelpers.includes(helper)) {
        this.#innerHelpers.push(helper);
      }
    }
  };
  /**
   * Adds one or multiple strings. Skips if it's already included.
   * @description Allows comma separated strings or a string array as parameter.
   * @param {...string|string[]} helpers
   */
  #addOuterHelpers = (...helpers) => {
    if (
      helpers.length === 1 &&
      Object.getPrototypeOf(helpers[0]).constructor.name == 'Array'
    ) {
      helpers = helpers[0];
    }

    if (this.#outerHelpers.length == 0) {
      this.#outerHelpers = helpers;
      return;
    }

    for (const helper of helpers) {
      if (!this.#outerHelpers.includes(helper)) {
        this.#outerHelpers.push(helper);
      }
    }
  };

  /**
   * Constructs the parameters which needs to be converted to GO types.
   * e.g. func(args[0].Int())
   * @returns {Object}
   */
  #createParameterString = () => {
    let hasVariadicParameter = false;
    let hasObjectParameterDatatype = false;
    let hasObjectArrayParameterDatatype = false;

    let parameterString = '';
    let groupedArrayTransformations = '';
    let groupedObjectTransformations = '';
    let arrayOrObjectParamPos = [];

    for (const [i, param] of this.#frag.functionParameterList.entries()) {
      if (GoDatatype.isSpecialIntegerDatatype(param.type)) {
        // use GO's integer conversion functions int8(),int16()...
        parameterString += `${param.type}(args[${i}]${
          GoDatatype.dtconv[param.type]
        })`;
      } else if (GoDatatype.isFloat32Datatype(param.type)) {
        // use GO's float32 conversion function
        parameterString += `float32(args[${i}]${
          GoDatatype.dtconv[param.type]
        })`;
      } else if (GoDatatype.isArrayDatatype(param.type)) {
        // TODO take care of int8,int16... or float32 typed arrays
        arrayOrObjectParamPos.push(i);

        // cut off brackets [] to get the datatype of the array and check if we can convert it in dtconv
        const dtConversionFunction =
          GoDatatype.dtconv[param.type.replace(/\[\]/, '')];
        const hasKnownDatatype = !Utils.isUndefined(dtConversionFunction);

        if (hasKnownDatatype) {
          groupedArrayTransformations +=
            Indenter.undent`
          var arr${i} ${param.type}
          for i := 0; i < args[${i}].Length(); i++ {
            arr${i} = append(arr${i}, args[${i}].Index(i)${dtConversionFunction})
          }` + '\n\n';
        } else if (/^\[\]interface/.test(param.type)) {
          // TODO deal with interfaces in arrays
          Debug.printInfo(
            'Interface types in array parameters are not supported.'
          );
        } else {
          hasObjectArrayParameterDatatype = true;

          groupedArrayTransformations +=
            Indenter.undent`
          var arr${i} ${param.type}
          unmarshalJSON(args[${i}], &data_arr)
          transcode(data_arr, &arr${i})` + '\n\n';
        }

        parameterString += `arr${i}`;
      } else if (
        GoDatatype.isVariadicDatatype(param.type) &&
        param.is_variadic
      ) {
        // TODO take care of int8,int16... or float32 typed variadic parameters
        hasVariadicParameter = true;
        // func(arg1, arg2 | arg3, arg4, arg5)
        // cut off brackets [] to get the datatype of the array and check if we can convert it in dtconv
        const dtConversionFunction =
          GoDatatype.dtconv[param.type.replace(/^\.\.\./, '')];
        const hasKnownDatatype = !Utils.isUndefined(dtConversionFunction);

        if (hasKnownDatatype) {
          groupedArrayTransformations +=
            Indenter.undent`
          var arr${i} ${param.type.replace(/^\.\.\./, '[]')}
          for i := ${i}; i < len(args); i++ {
            arr${i} = append(arr${i}, args[i]${dtConversionFunction})
          }` + '\n\n';
        } else if (/^\.\.\.interface/.test(param.type)) {
          // TODO deal with interfaces in arrays of variadic functions
          Debug.printInfo(
            'Interface types in variadic parameters are not supported.'
          );
        } else {
          hasObjectArrayParameterDatatype = true;

          groupedArrayTransformations +=
            Indenter.undent`
          var arr${i} ${param.type.replace(/^\.\.\./, '[]')}
          for i := ${i}; i < len(args); i++ {
            if args[i].Type() == js.TypeObject && isArray(args[i]){
              var arrTemp ${param.type.replace(/^\.\.\./, '[]')}
              unmarshalJSON(args[i], &data_arr)
              transcode(data_arr, &arrTemp)
              arr${i} = append(arr${i}, arrTemp...)
            }
          }` + '\n\n';
        }

        parameterString += `arr${i}...`;
      } else if (GoDatatype.isUnknownDatatype(param.type)) {
        arrayOrObjectParamPos.push(i);
        hasObjectParameterDatatype = true;

        groupedObjectTransformations +=
          Indenter.undent`
        objTemp${i} := ${param.type}{}
        unmarshalJSON(args[${i}], &data_obj)
        transcode(data_obj, &objTemp${i})
        ` + '\n\n';

        parameterString += `objTemp${i}`;
      } else {
        // basic: bool, int, string, float64
        parameterString += `args[${i}]${GoDatatype.dtconv[param.type]}`;
      }

      // add comma for each additional parameter
      if (i < this.#frag.functionParameterList.length - 1) {
        parameterString += `,`;
      }
    }

    return {
      hasVariadicParameter,
      hasObjectParameterDatatype,
      hasObjectArrayParameterDatatype,
      parameterString,
      groupedArrayTransformations,
      groupedObjectTransformations,
      arrayOrObjectParamPos,
    };
  };

  /**
   * Currently only adds checks for arrays and unknown datatypes (objects).
   * @returns {string}
   */
  #addTypeCheckIfStatements() {
    let ifStatementsString = ``;

    for (const i of this.#arrayOrObjectParamPos) {
      // throw error if it's not an object and array
      if (
        GoDatatype.isArrayDatatype(this.#frag.functionParameterList[i].type)
      ) {
        ifStatementsString +=
          Indenter.undent`
        if(!(args[${i}].Type() == js.TypeObject && isArray(args[${i}]))){
          panic("Argument #${i + 1} in function '${
            this.#frag.name
          }' is not type of ${this.#frag.functionParameterList[i].type} array.")
        }` + '\n';
      } else if (
        GoDatatype.isUnknownDatatype(this.#frag.functionParameterList[i].type)
      ) {
        // throw error if it's not an object OR if it's an object but an array
        ifStatementsString +=
          Indenter.undent`
        if(args[${i}].Type() != js.TypeObject || (args[${i}].Type() == js.TypeObject && isArray(args[${i}]))){
          panic("Argument #${i + 1} in function '${
            this.#frag.name
          }' is not type of ${
            this.#frag.functionParameterList[i].type
          } object.")
        }` + '\n';
      }
    }

    return ifStatementsString;
  }

  /**
   * Based on the parsed GO code we include helper functions for processing/transforming code in our wrapper function.
   */
  #organizeHelpers = () => {
    // this includes this.#hasObjectArrayParameterDatatype
    const hasArray = this.#arrayOrObjectParamPos.some((i) => {
      return GoDatatype.isArrayDatatype(
        this.#frag.functionParameterList[i].type
      );
    });

    // add error message if less or too much arguments were passed except when it's a variadic function because we can add any amount
    if (!this.#hasVariadicParameter) {
      this.#addInnerHelpers(
        Indenter.undent`
      if len(args) < ${this.#frag.functionParameterList.length} {
        panic("Function '${
          this.#frag.name
        }' has insufficient amount of arguments.")
      } else if len(args) > ${this.#frag.functionParameterList.length} {
        panic("Function '${
          this.#frag.name
        }' received more arguments then specified.")
      }` + '\n\n'
      );
    }

    //#################################### helpers

    // check length because we don't need it with multi return values
    if (
      this.#hasObjectArrayParameterDatatype ||
      this.#hasObjectParameterDatatype ||
      (this.#hasArrayReturnValueDatatype &&
        this.#frag.returnParameterList.length === 1) ||
      this.#hasObjectReturnValueDatatype
    ) {
      this.#frag.addLib('bytes', 'encoding/json');
      this.#addInnerHelpers(GoHelperFunctions.transcodeHelperFunction + '\n\n');
    }
    // unmarshal function not needed for return values
    if (
      this.#hasObjectArrayParameterDatatype ||
      this.#hasObjectParameterDatatype
    ) {
      this.#addInnerHelpers(
        GoHelperFunctions.unmarshalJSONHelperFunction + '\n\n'
      );
    }

    // if there are objects or arrays or object arrays we need to check even against "is not an array"
    // hasArray || this.#hasObjectParameterDatatype
    if (
      this.#arrayOrObjectParamPos.length !== 0 ||
      this.#hasObjectArrayParameterDatatype
    ) {
      this.#addInnerHelpers(GoHelperFunctions.isArrayHelperFunction + '\n\n');
    }
    // check length because we don't need it with multi return values
    if (
      this.#hasObjectArrayParameterDatatype ||
      (this.#hasArrayReturnValueDatatype &&
        this.#frag.returnParameterList.length === 1)
    ) {
      this.#addInnerHelpers('var data_arr []interface{}' + '\n\n');
    }
    if (
      this.#hasObjectParameterDatatype ||
      this.#hasObjectReturnValueDatatype
    ) {
      this.#addInnerHelpers('var data_obj map[string]interface{}' + '\n\n');
    }

    if (this.#hasErrorReturnValueDatatype) {
      this.#addInnerHelpers(GoHelperFunctions.newErrorHelperFunction + '\n\n');
    }

    //#################################### type checks
    this.#addInnerHelpers(this.#addTypeCheckIfStatements() + '\n');

    //#################################### add array or object transformations
    this.#groupedArrayTransformations.length !== 0
      ? this.#addInnerHelpers(this.#groupedArrayTransformations)
      : null;
    this.#groupedObjectTransformations.length !== 0
      ? this.#addInnerHelpers(this.#groupedObjectTransformations)
      : null;
  };

  /**
   * Generates the necessary strings to handle multiple return values.
   * @returns {[string,string]} Function call with multiple return values and return values seperated by commas.
   */
  #prepareMultiReturnValues = () => {
    let functionCall = ``;

    let arrayOrObjectTransform = ``;
    // we need to pack all return values in an object, and differenciate between known datatypes and arrays or objects
    let returnValueMapping = {};

    for (const [i, returnValue] of this.#frag.returnParameterList.entries()) {
      if (GoDatatype.isArrayDatatype(returnValue.type)) {
        arrayOrObjectTransform +=
          Indenter.undent`
        var data_return${i} []interface{}
        transcode(returnValue${i},&data_return${i})` + '\n';
        returnValueMapping[`returnValue${i}`] = `data_return${i}`;
      } else if (GoDatatype.isErrorDatatype(returnValue.type)) {
        returnValueMapping[`returnValue${i}`] = `newError(returnValue${i})`;
      } else if (GoDatatype.isUnknownDatatype(returnValue.type)) {
        arrayOrObjectTransform +=
          Indenter.undent`
        var data_return${i} map[string]interface{}
        transcode(returnValue${i},&data_return${i})` + '\n';
        returnValueMapping[`returnValue${i}`] = `data_return${i}`;
      } else {
        returnValueMapping[`returnValue${i}`] = `returnValue${i}`;
      }

      functionCall += `returnValue${i}`;
      // seperate by comma
      if (i < this.#frag.returnParameterList.length - 1) functionCall += `, `;
    }

    functionCall += ` := ${this.#frag.name}(${this.#parameterString})\n\n`;
    functionCall += arrayOrObjectTransform;

    let returnValues = ``;

    for (let j = 0, k = Object.keys(returnValueMapping).length; j < k; j++) {
      returnValues += `"${Object.keys(returnValueMapping)[j]}": ${
        returnValueMapping[Object.keys(returnValueMapping)[j]]
      },`;

      // line break
      if (j < k - 1) {
        returnValues += `\n`;
      }
    }

    return [functionCall, returnValues];
  };

  createFunctionWrapper = () => {
    if (!this.#hasFunctionParameters)
      return this.#createFunctionWrapperWithoutParameters();

    ({
      hasVariadicParameter: this.#hasVariadicParameter,
      hasObjectParameterDatatype: this.#hasObjectParameterDatatype,
      hasObjectArrayParameterDatatype: this.#hasObjectArrayParameterDatatype,
      parameterString: this.#parameterString,
      groupedArrayTransformations: this.#groupedArrayTransformations,
      groupedObjectTransformations: this.#groupedObjectTransformations,
      arrayOrObjectParamPos: this.#arrayOrObjectParamPos,
    } = this.#createParameterString());

    this.#organizeHelpers();

    const functionHead = Indenter.undent`
      func __wrapper() js.Func {
        return js.FuncOf(func(this js.Value, args []js.Value) interface{} {`;

    if (!this.#hasReturnValues) {
      return Indenter.undent`
      ${this.#outerHelpers.join('')}${functionHead}
          ${this.#innerHelpers.join('')}
          ${this.#frag.name}(${this.#parameterString})
          return nil
        })
      }`;
    } else if (this.#frag.returnParameterList.length === 1) {
      if (this.#hasArrayReturnValueDatatype) {
        return Indenter.undent`
        ${this.#outerHelpers.join('')}${functionHead}
            ${this.#innerHelpers.join('')}transcode(${this.#frag.name}(${
          this.#parameterString
        }), &data_arr)

            return data_arr
          })
        }`;
      } else if (this.#hasObjectReturnValueDatatype) {
        return Indenter.undent`
        ${this.#outerHelpers.join('')}${functionHead}
            ${this.#innerHelpers.join('')}transcode(${this.#frag.name}(${
          this.#parameterString
        }), &data_obj)

            return data_obj
          })
        }`;
      } else {
        const isF = GoDatatype.isFuncDatatype(
          this.#frag.returnParameterList[0].type
        );

        return Indenter.undent`
        ${this.#outerHelpers.join('')}${functionHead}
            ${this.#innerHelpers.join('')}
            return ${this.#frag.name}(${this.#parameterString})${
          isF ? `()` : ''
        }
          })
        }`;
      }
    } else if (this.#frag.returnParameterList.length > 1) {
      const [functionCall, returnValues] = this.#prepareMultiReturnValues();

      return Indenter.undent`
      ${this.#outerHelpers.join('')}${functionHead}
          ${this.#innerHelpers.join('')}
          ${functionCall}
          return map[string]interface{}{
            ${returnValues}
          }
        })
      }`;
    }
  };
}

module.exports = WasmCodeHelper;
