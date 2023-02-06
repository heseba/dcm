'use strict';

const GoDatatype = require('../utils/GoDatatype');
const GoHelperFunctions = require('../utils/GoHelperFunctions');
const Indenter = require('../utils/Indenter');

// Types
/** @typedef {import("../GoFragment/GoFragmentFunction")} GoFragmentFunction */

class PluginCodeHelper {
  /** @type {GoFragmentFunction} */
  #frag = undefined;

  #functionCallString = '';

  #hasFunctionParameters = false;
  #hasReturnValues = false;

  #hasErrorReturnValue = false;

  /**
   * helper functions inside the wrapper function
   *  @type {string[]}
   */
  #innerHelpers = [];

  constructor(frag) {
    this.#frag = frag;

    this.#hasFunctionParameters = frag.functionParameterList.length !== 0;
    this.#hasReturnValues = frag.returnParameterList.length !== 0;
  }

  setDefaultLines() {
    this.#frag.pluginGoCode = 'package main\n\n';

    // we don't need this lib anymore and the wasm code is done at this point so we can modify the lib list
    this.#frag.removeLib('syscall/js');

    // always add this GO package because we get a JSON string in our wrapper function and need to unmarshal it
    this.#frag.addLib('encoding/json');

    // transform the incoming JSON string into an object array we can use
    const unmarshalBytesSnippet = Indenter.undent`
    var jsonObj []interface{}
    err := json.Unmarshal(jsonBytes, &jsonObj)
    if err != nil {
      panic(err.Error())
    }`;
    this.#addInnerHelpers(unmarshalBytesSnippet + '\n');
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
   * Creates a string which calls the function and handles different situation of different return values (multiple, callbacks, objects)
   * @returns {Object}
   */
  #createFunctionCallString() {
    let functionCallString = '';
    let hasErrorReturnValue = false;

    // create an array filled with numbers corresponding to the length of the parameterlist and prepend "arg" infront of it
    const parameterString = [...Array(this.#frag.functionParameterList.length).keys()]
      .map((num) => {
        if (GoDatatype.isVariadicDatatype(this.#frag.functionParameterList[num].type)) {
          return `arg${num}...`;
        }
        return `arg${num}`;
      })
      .join(', ');

    if (!this.#hasReturnValues) {
      functionCallString += Indenter.undent`
    ${this.#frag.name}(${parameterString})
    `;
    } else if (this.#frag.returnParameterList.length === 1) {
      const isF = GoDatatype.isFuncDatatype(this.#frag.returnParameterList[0].type);
      const isErr = GoDatatype.isErrorDatatype(
        this.#frag.returnParameterList[0].type
      );
      if (isErr) hasErrorReturnValue = true;

      functionCallString += Indenter.undent`
    returnValue0 := ${this.#frag.name}(${parameterString})${isF ? '()' : ''}

    var results []interface{}
    results = append(results, ${
      isErr ? `newError(returnValue0)` : `returnValue0`
    })
    `;
    } else if (this.#frag.returnParameterList.length > 1) {
      const returnString = [...Array(this.#frag.returnParameterList.length).keys()]
        .map((num) => `returnValue${num}`)
        .join(', ');

      // last comma for the last attribute is necessary
      const returnObjectString =
        [...Array(this.#frag.returnParameterList.length).keys()]
          .map((num) => {
            if (
              GoDatatype.isErrorDatatype(this.#frag.returnParameterList[num].type)
            ) {
              hasErrorReturnValue = true;
              return `"returnValue${num}": newError(returnValue${num})`;
            }

            return `"returnValue${num}": returnValue${num}`;
          })
          .join(',\n') + ',';

      functionCallString += Indenter.undent`
      ${returnString} := ${this.#frag.name}(${parameterString})

      var results []interface{}
      results = append(results, map[string]interface{}{
        ${returnObjectString}
      })
      `;
    }

    return { functionCallString, hasErrorReturnValue };
  }

  #createFunctionWrapperWithoutParameters() {
    return Indenter.undent`
      func Execute__(jsonBytes []byte) []byte {
        ${this.#innerHelpers.join('')}

        ${this.#functionCallString}

        jsonBytes, _ = json.Marshal(${
          !this.#hasReturnValues ? 'nil' : 'results'
        })
        return jsonBytes
      }`;
  }

  createFunctionWrapper() {
    ({
      functionCallString: this.#functionCallString,
      hasErrorReturnValue: this.#hasErrorReturnValue,
    } = this.#createFunctionCallString());

    if (this.#hasErrorReturnValue)
      this.#addInnerHelpers(
        GoHelperFunctions.newPluginErrorHelperFunction + '\n'
      );

    // without parameter we don't need anything to transform
    if (!this.#hasFunctionParameters) {
      return this.#createFunctionWrapperWithoutParameters();
    }

    // transforming parameters requires this package
    this.#frag.addLib('bytes');
    this.#addInnerHelpers(GoHelperFunctions.transcodeHelperFunction + '\n');

    // arguments, here we need the jsonObj array
    let transformedArgumentsString = '';
    for (const [i, param] of this.#frag.functionParameterList.entries()) {
      if (GoDatatype.isVariadicDatatype(param.type)) {
        transformedArgumentsString +=
          Indenter.undent`
      var arg${i} ${param.type.replace(/^\.\.\./, '[]')}
      transcode(jsonObj[${i}:], &arg${i})
      ` + '\n';
      } else {
        transformedArgumentsString +=
          Indenter.undent`
        var arg${i} ${param.type}
        transcode(jsonObj[${i}], &arg${i})
        ` + '\n';
      }
    }

    return Indenter.undent`
      func Execute__(jsonBytes []byte) []byte {
        ${this.#innerHelpers.join('')}

        ${transformedArgumentsString}
        ${this.#functionCallString}

        jsonBytes, _ = json.Marshal(${
          !this.#hasReturnValues ? 'nil' : 'results'
        })
        return jsonBytes
      }`;
  }
}

module.exports = PluginCodeHelper;
