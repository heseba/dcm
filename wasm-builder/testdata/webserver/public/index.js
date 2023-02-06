'use strict';

import './wasm_exec.js';

import instantiateWasm from './instantiateWasm.js';

const go = new Go(); // Defined in wasm_exec.js. Don't forget to add this in your index.html.

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

/**
 * Execute a wasm function.
 *
 * @param {number} wasmPath - The specified function ID from the CFD.yaml file.
 * @param {string} funcName - The function name to call.
 * @param {...any} funcParams - All function parameters.
 * @returns {Promise} The result or undefined.
 * @example
 * await runWasm("wasm/0_FuncName.wasm", "FuncName", 34,[3,4],"params")
 */
const runWasm = async (wasmPath, funcName, ...funcParams) => {
  // Get the importObject from the go instance.
  let importObject = go.importObject;

  // regex  to extract functionName from wasmPath, but later on there might be multiple GO function in one wasm file, therefore it makes no sense to autodetext the functionName from the fileName
  // (?<=\/[\d]+\_).*(?=\.wasm)

  // support multiple parameter instead of using arrays only
  funcParams.length > 1 ? [...funcParams] : (funcParams = funcParams[0]);

  // keep the previous env object and add our own properties
  importObject.env = {
    ...importObject.env,
    // Tinygo: remove the message: syscall/js.finalizeRef not implemented
    // 'syscall/js.finalizeRef': () => {},
  };

  // prepare single argument vs array of arguments
  if (!isUndefined(funcParams)) {
    funcParams = [
      ...[],
      ...(Array.isArray(funcParams) ? funcParams : [funcParams]),
    ];
  }

  try {
    // Instantiate our wasm module
    const wasmModule = await instantiateWasm(wasmPath, importObject);

    // Allow the wasm_exec go instance, bootstrap and execute our wasm module
    go.run(wasmModule.instance);

    // const wasm = wasmModule.instance.exports;
    // Call the function export from wasm, return the result
    // const result = wasm[funcName](...funcParams);

    let result = undefined;
    if (!isUndefined(funcParams)) {
      result = window['codedistributor'][funcName](...funcParams);
    } else {
      // console.log(window['codedistributor']);
      result = window['codedistributor'][funcName]();
    }

    return result;
  } catch (error) {
    console.error(`WASM Function '${funcName}' couldn't be executed: ${error}`);
    return undefined;
  }
};

async function tests() {
  let result = undefined;
  result = await runWasm('wasm/0_Add.wasm', 'Add', 1, 2);
  console.log(result);
  result = await runWasm('wasm/1_Sub.wasm', 'Sub', [2, 1]);
  console.log(result);
  result = await runWasm('wasm/4_MultiplyByTwo.wasm', 'MultiplyByTwo', 5);
  console.log(result);
  result = await runWasm('wasm/6_GetHash.wasm', 'GetHash', 'WASM');
  console.log(result);
  result = await runWasm('wasm/7_FuncFunction.wasm', 'FuncFunction', 6);
  console.log(result);
  result = await runWasm('wasm/8_BoolFunction.wasm', 'BoolFunction', false);
  console.log(result);
  result = await runWasm('wasm/9_Pythagoras.wasm', 'Pythagoras', [2, 3]);
  console.log(result);
  result = await runWasm('wasm/10_SumArray.wasm', 'SumArray', [
    [1, 2],
    [3, 4],
    5,
  ]);
  console.log(result);
  result = await runWasm(
    'wasm/11_VariadicFunction.wasm',
    'VariadicFunction',
    [1e3, 5, 2, 1, 2, 2, 5, 5]
  );
  console.log(result);
  result = await runWasm('wasm/12_ExternalVariable.wasm', 'ExternalVariable');
  console.log(result);
  result = await runWasm(
    'wasm/21_CreatingEmployee.wasm',
    'CreatingEmployee',
    {
      Name: 'Andrew',
      Skills: ['programming', 'communication'],
    },
    {
      Name: 'Mario',
      Skills: ['drawing', 'charisma'],
    }
  );
  console.log(result);
  result = await runWasm(
    'wasm/24_MultiReturn.wasm',
    'MultiReturn',
    {
      Name: 'Andrew',
      Skills: ['programming', 'communication'],
    },
    ['drawing']
  );
  console.log(result);
  result = await runWasm('wasm/25_ObjectInArray.wasm', 'ObjectInArray', [
    [
      { Name: 'Andrew', Age: 34 },
      { Name: 'Eugen', Age: 22 },
    ],
    4,
  ]);
  console.log(result);
  result = await runWasm('wasm/26_ModifyMap.wasm', 'ModifyMap', {
    transport: 30,
    food: 300,
    rent: 100,
  });
  console.log(result);
  result = await runWasm('wasm/27_ReturnError.wasm', 'ReturnError');
  console.log(result);
  result = await runWasm('wasm/37_CalcArea.wasm', 'CalcArea');
  console.log(result);

  const startTime = +new Date();
  result = await runWasm('wasm/38_WasmStartupTime.wasm', 'WasmStartupTime');
  console.log('Wasm Container startup time: ', result - startTime);
}

(async () => {
  tests();

  // REFERENCE POINTER
  // message = 'Go';
  // age = 30;
  // cash = 10.5;
  // old = false;
  // country = ['nigeria', 'egypt', 'sweden'];
  // myProfile = {
  //   Age: 0,
  //   Name: '',
  //   Salary: 0,
  //   TechInterest: false,
  // };
  // console.log(message, age, cash, old, country, myProfile);
  // await runWasm(
  //   'wasm/27_ModifyBasicTypes.wasm',
  //   'ModifyBasicTypes',
  //   message,
  //   age,
  //   cash,
  //   old,
  //   country,
  //   myProfile,
  // );
  // console.log(message, age, cash, old, country, myProfile);
})();
