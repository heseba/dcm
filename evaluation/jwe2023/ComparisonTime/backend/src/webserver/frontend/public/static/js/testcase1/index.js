import { measureJsAsync } from '../measure.js';
import { Fibonacci, Add, CalcDiscount, IncrementNumber, GetHash } from '../CodeDistributor/functions.js'

const calc = async () => {
    let val = 10;
    val = await Fibonacci(val);
    val = val[val.length-1]
    val = await Add(val, 10);
    val = await CalcDiscount(val, 20);
    val = await IncrementNumber(val);
    val = await GetHash(val);
    return val
}

const _run = ({ iterations }) => {

  const test = async (evt) => {
    let results = [];
    let res;
    evt.target.classList.add('loading');

    for (let i = 0; i < iterations; i++) {
        res = await measureJsAsync(calc);
        results.push({
          funcName: 'calc',
          totalTimeInMs: res.tookInMs,
          totalTimeInSec: res.tookInSec,
          results: res.result,
        });
    }

    console.log(results);
    evt.target.classList.remove('loading');
  };

  const btn = document.createElement('button');
  btn.onclick = test;
  btn.classList.add('btn');
  btn.textContent = 'Run';
  document.querySelector('#part-calc').appendChild(btn);
};

export const testcase1 = () => {
  _run({ iterations: 100 });
};
