'use strict';

const Utils = require('../utils/Utils');
const GoFragment = require('.');
const WasmCodeHelper = require('../WasmBuilder/WasmCodeHelper');
const PluginCodeHelper = require('../WasmBuilder/PluginCodeHelper');
const Debug = require('../utils/Debug');
const Config = require('../utils/Config');
const Indenter = require('../utils/Indenter');
const StringBuilder = require('../utils/StringBuilder');

// TYPES
/** @typedef { import("../DataFragment") } DataFragment */
/** @typedef { import("../types").InterfaceParameter } InterfaceParameter */
/** @typedef { import("../types").GenericTypeParameter } GenericTypeParameter */
/** @typedef { import("../types").FunctionParameter } FunctionParameter */
/** @typedef { import("../types").ReturnParameter } ReturnParameter */

class GoFragmentFunction extends GoFragment {
  /**
   *
   * @param {DataFragment} dataFragment
   */
  constructor(dataFragment) {
    super(dataFragment);

    /** @type {boolean} */
    this.isInterface = dataFragment.isInterface;
    /** @type {InterfaceParameter[]} */
    this.interfaceParameterList = Utils.cloneList(
      dataFragment.interfaceParameterList
    );

    /** @type {GenericTypeParameter[]} */
    this.genericTypeParameterList = Utils.cloneList(
      dataFragment.genericTypeParameterList
    );
    /** @type {FunctionParameter[]} */
    this.functionParameterList = Utils.cloneList(dataFragment.functionParameterList);
    /** @type {ReturnParameter[]} */
    this.returnParameterList = Utils.cloneList(dataFragment.returnParameterList);

    // we need to assemble this as soon as we have all dataFragments constructed and identified
    this.wasmGoCode = '';
    this.pluginGoCode = '';
  }

  buildWasmCode = () => {
    const helper = new WasmCodeHelper(this);
    helper.setDefaultLines();

    // dependencies and their libraries might depend on other dependencies and we need to get them
    helper.collectDependencies();

    // depending on the function parameters we might need to add libraries before creating the libstring
    const functionWrapper = helper.createFunctionWrapper();

    this.wasmGoCode += StringBuilder.createLibraryString(this.libs);
    this.wasmGoCode += StringBuilder.createDependencyString(
      this.dependsOn,
      this.packagePrefix
    );

    this.wasmGoCode += functionWrapper + '\n\n';

    // fragmentCode marked as exportable for WASM
    this.wasmGoCode += `//export ${this.name}\n${this.fragmentCode}\n\n`;

    this.wasmGoCode += Indenter.undent`
    func main(){
      emptyObject := make(map[string]interface{})
      js.Global().Set("${Config.globalObject}", js.ValueOf(emptyObject))
      js.Global().Get("${Config.globalObject}").Set("${this.name}", __wrapper())
      select{}
    }`;

    Debug.printCode(Config.debug.functionName, this, { type: 'wasm' });
    // Debug.printHeapUsage();
  };

  buildPluginCode = () => {
    const helper = new PluginCodeHelper(this);

    helper.setDefaultLines();

    const functionWrapper = helper.createFunctionWrapper();

    this.pluginGoCode += StringBuilder.createLibraryString(this.libs);
    this.pluginGoCode += StringBuilder.createDependencyString(
      this.dependsOn,
      this.packagePrefix
    );

    this.pluginGoCode += functionWrapper + '\n\n';

    this.pluginGoCode += this.fragmentCode + '\n\n';

    this.pluginGoCode += `func main() {}`;

    Debug.printCode(Config.debug.functionName, this, { type: 'plugin' });
    // Debug.printHeapUsage();
  };

  /**
   * Adds one or multiple libraries to the fragment. Skips if it's already included.
   * @description Allows comma separated strings or a string array as parameter.
   * @param {...string|string[]} libs
   */
  addLib = (...libs) => {
    if (
      libs.length === 1 &&
      Object.getPrototypeOf(libs[0]).constructor.name == 'Array'
    ) {
      libs = libs[0];
    }

    if (this.libs.length == 0) {
      this.libs = libs;
      return;
    }

    for (const lib of libs) {
      if (!this.libs.includes(lib)) {
        this.libs.push(lib);
      }
    }
  };

  /**
   * Removes one or multiple libraries from the fragment.
   * @description Allows comma separated strings or a string array as parameter.
   * @param {...string|string[]} libs
   */
  removeLib = (...libs) => {
    if (
      libs.length === 1 &&
      Object.getPrototypeOf(libs[0]).constructor.name == 'Array'
    ) {
      libs = libs[0];
    }

    if (this.libs.length == 0) {
      return;
    }

    let pos = 0;
    for (const lib of libs) {
      pos = this.libs.indexOf(lib);
      if (pos === -1) continue;

      this.libs.splice(pos, 1);
    }
  };
}

module.exports = GoFragmentFunction;
