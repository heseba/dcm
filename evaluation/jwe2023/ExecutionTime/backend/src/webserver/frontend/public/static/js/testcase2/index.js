import { getLang } from '../utils/helpers.js';
import { measureJs, measureWasm } from '../measure.js';
import { fibonacci } from '../testcase1/fibonacci.js';

/**
 *
 * @param {Object} options
 * @param {Boolean} options.saveIterations Works together with noArrayLimitation. Uses the previous array length to determine the new maximum amount of elements to save unnecessary loops.
 * @param {Boolean} options.noArrayLimitation Toggles whether the result array should be cut off the integer range or not.
 */
const _fibonacci = ({
  numberOfElements,
  numberOfIterations,
  saveIterations,
  noArrayLimitation,
}) => {
  let numOfElements = numberOfElements;
  const execIterations = numberOfIterations;
  const wasmId = 2;
  const wasmName = 'Fibonacci';

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
          funcName: 'Fibonacci',
          iterations: execIterations,
          elementsPerIteration: Intl.NumberFormat(getLang()).format(
            numOfElements
          ),
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

  const trigger = async (evt) => {
    const usePromiseAll = evt.target.dataset.promise === 'true';

    const measurements = { js: [], wasm: [] };
    evt.target.classList.add('loading');
    document.body.classList.add('calculating');

    for (const _ of [...Array(execIterations).keys()]) {
      const res = measureJs(fibonacci, numOfElements, false, noArrayLimitation);
      if (saveIterations) {
        numOfElements = res.result.length;
      }
      measurements.js.push(res);
    }
    console.log(measurements.js);

    if (usePromiseAll) {
      // this is slower because it queues only 4 in chunks (depends on available CPU cores) due to how WebWorker pool task queue is working
      const res = await Promise.all(
        Array(execIterations)
          .fill(measureWasm)
          .map((fn) => fn.call(this, wasmId, wasmName, numOfElements))
      );
      console.log(res);
      measurements.wasm.push(...res);
    } else {
      // this is faster then Promise.all, because it queues all tasks in the WebWorker pool task queue as soon as the iteration hits
      for (const _ of [...Array(execIterations).keys()]) {
        const res = await measureWasm(wasmId, wasmName, numOfElements);
        measurements.wasm.push(res);
      }
      console.log(measurements.wasm);
    }

    const jsKey = 'js';
    const wasmKey = 'wasm/server';

    const results = { js: {}, 'wasm/server': {} };
    results[jsKey] = accumulateResults(measurements.js);
    results[wasmKey] = accumulateResults(measurements.wasm);

    // shift bestTimeInSec and worstTimeInSec to another object
    const timeAnalysis = { js: {}, 'wasm/server': {} };
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
    evt.target.classList.remove('loading');
    document.body.classList.remove('calculating');
  };

  let btn = document.createElement('button');
  btn.onclick = trigger;
  btn.classList.add('btn');
  btn.textContent = 'Fibonacci Iterations (for loop)';
  document.querySelector('#part-fiboPromise').appendChild(btn);

  btn = document.createElement('button');
  btn.onclick = trigger;
  btn.dataset.promise = true;
  btn.classList.add('btn');
  btn.textContent = 'Fibonacci Iterations (Promise.all)';
  document.querySelector('#part-fiboPromise').appendChild(btn);
};

export const testcase2 = () => {
  // up to max. int64 range in JS and Go, useUint64 option is only for JS
  // cannot go higher than Go int64 implementation
  _fibonacci({
    numberOfElements: 93,
    numberOfIterations: 1000,
    saveIterations: true,
    // if you have some time
    noArrayLimitation: false,
  });
};
