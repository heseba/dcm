import { measureJs, measureWasm } from '../measure.js';
import { fibonacci_limited, fibonacci } from './fibonacci.js';

const _fibonacci = ({ numberOfElements }) => {
  const num = numberOfElements;
  const maxInt = BigInt(Math.pow(2, 63)) - 1n;
  const maxUint = BigInt(Math.pow(2, 64)) - 1n;

  const test = async (evt) => {
    let results = {};
    let res;
    evt.target.classList.add('loading');

    // res = measureJs(fibonacci_limited, num);
    // console.log(res);
    // console.log(res.result.at(-1) < Number.MAX_SAFE_INTEGER);

    res = measureJs(fibonacci, num, false);
    // console.log(res.result.at(-1) < maxInt);
    results['js'] = {
      funcName: 'Fibonacci',
      totalTimeInMs: res.tookInMs,
      totalTimeInSec: res.tookInSec,
      results: res.result,
    };

    // res = measureJs(fibonacci, num, true);
    // console.log(res);
    // console.log(res.result.at(-1) < maxUint);

    res = await measureWasm(1, 'Fibonacci', num);
    // console.log(res.result.at(-1) < maxInt);
    results['wasm/server'] = {
      funcName: 'Fibonacci',
      totalTimeInMs: res.tookInMs,
      totalTimeInSec: res.tookInSec,
      results: res.result,
    };

    console.table(results);
    evt.target.classList.remove('loading');
  };

  const btn = document.createElement('button');
  btn.onclick = test;
  btn.classList.add('btn');
  btn.textContent = 'Fibonacci';
  document.querySelector('#part-fibo').appendChild(btn);
};

export const testcase1 = () => {
  // up to max. int64 range, stopps early if needed
  _fibonacci({ numberOfElements: 100 });
};
