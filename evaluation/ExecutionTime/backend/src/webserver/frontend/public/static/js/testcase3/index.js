import { getLang, promiseAllFromObject } from '../utils/helpers.js';
import { measureJs, measureWasm } from '../measure.js';
import { nthPrimeSlow, nthPrime } from './isPrime.js';

// calculates prime numbers until it hits the 100.000th prime number and returns it
const _primeNumbers = ({ numberOfElements, numberOfExecIterations }) => {
  const num = numberOfElements;
  const execIterations = numberOfExecIterations;

  const test = async (evt) => {
    /** @return {Promise} */
    const tasks = () => {
      return promiseAllFromObject({
        js: measureJs(nthPrime, num),
        wasm: measureWasm(4, 'NthPrime', num),
      });
      // return new Promise(async (resolve, reject) => {
      //   const results = {};
      //   results['js'] = measureJs(nthPrime, num);
      //   const res = await measureWasm(4, 'NthPrime', num);
      //   results['wasm'] = res;
      //   resolve(results);
      // });
    };

    const measurements = { js: [], wasm: [] };
    evt.target.classList.add('loading');
    document.body.classList.add('calculating');
    for (const _ of [...Array(execIterations).keys()]) {
      const results = await tasks();
      // console.log(results);
      measurements.js.push(results['js']);
      measurements.wasm.push(results['wasm']);
    }

    // iterating inside the wasm container
    const res = await measureWasm(5, 'NthPrimeIterations', execIterations, num);
    console.log('js: ', measurements.js);
    console.log('wasm/server: ', measurements.wasm);
    console.log('wasm/server opti: ', res.result);
    measurements.wasmOpti = {
      funcName: 'NthPrimeIterations',
      iterations: execIterations,
      elementsPerIteration: Intl.NumberFormat(getLang()).format(num),
      totalTimeInMs: res.tookInMs,
      totalTimeInSec: res.tookInSec,
    };
    evt.target.classList.remove('loading');
    document.body.classList.remove('calculating');

    const accumulateResults = (arr) =>
      arr.reduce(
        (acc, item, i) => {
          const bestTime =
            i === 0
              ? item.tookInSec
              : item.tookInSec < acc.bestTimeInSec
              ? item.tookInSec
              : acc.bestTimeInSec;
          const worstTime =
            i === 0
              ? item.tookInSec
              : item.tookInSec > acc.worstTimeInSec
              ? item.tookInSec
              : acc.worstTimeInSec;

          return {
            funcName: 'nthPrime',
            iterations: execIterations,
            elementsPerIteration: Intl.NumberFormat(getLang()).format(num),
            bestTimeInSec: bestTime,
            worstTimeInSec: worstTime,
            totalTimeInMs: acc.totalTimeInMs + item.tookInMs,
            totalTimeInSec: acc.totalTimeInSec + item.tookInSec,
          };
        },
        {
          bestTimeInSec: 0,
          worstTimeInSec: 0,
          totalTimeInMs: 0,
          totalTimeInSec: 0,
        }
      );

    const jsKey = 'js';
    const wasmKey = 'wasm/server';
    const wasmOptiKey = 'wasm/server opti';

    const results = {};
    results[jsKey] = accumulateResults(measurements.js);
    results[wasmKey] = accumulateResults(measurements.wasm);
    results[wasmOptiKey] = measurements.wasmOpti;

    // shift bestTimeInSec and worstTimeInSec to another object, wasm opti not included because it's calculating inside WASM (we only get total time)
    const timeAnalysis = {
      js: {},
      'wasm/server': {},
    };
    timeAnalysis[jsKey].avgTimeInSec = parseFloat(
      (results[jsKey].totalTimeInSec / execIterations).toFixed(2)
    );
    timeAnalysis[jsKey].bestTimeInSec = results[jsKey].bestTimeInSec;
    timeAnalysis[jsKey].worstTimeInSec = results[jsKey].worstTimeInSec;
    delete results[jsKey].bestTimeInSec;
    delete results[jsKey].worstTimeInSec;

    // shift bestTimeInSec and worstTimeInSec to another object
    timeAnalysis[wasmKey].avgTimeInSec = parseFloat(
      (results[wasmKey].totalTimeInSec / execIterations).toFixed(2)
    );
    timeAnalysis[wasmKey].bestTimeInSec = results[wasmKey].bestTimeInSec;
    timeAnalysis[wasmKey].worstTimeInSec = results[wasmKey].worstTimeInSec;
    delete results[wasmKey].bestTimeInSec;
    delete results[wasmKey].worstTimeInSec;

    console.table(results);
    console.table(timeAnalysis);
  };

  const btn = document.createElement('button');
  btn.onclick = test;
  btn.classList.add('btn');
  btn.textContent = 'NthPrime';
  document.querySelector('#part-nthPrime').appendChild(btn);
};

export const testcase3 = () => {
  _primeNumbers({
    numberOfElements: 500_000,
    numberOfExecIterations: 50,
  });
};
