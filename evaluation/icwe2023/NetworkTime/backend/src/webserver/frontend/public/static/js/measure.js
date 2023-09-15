import { codeDistributor } from './initCodeDistributor.js';
const measureJs = (fn, ...args) => {
  let t0 = performance.now();
  const result = fn(...args);
  let t1 = performance.now();
  return {
    tookInMs: t1 - t0,
    tookInSec: parseFloat(((t1 - t0) / 1000).toFixed(2)),
    result,
  };
};

const measureWasm = async (id, name, ...args) => {
  let t0 = performance.now();
  const result = await codeDistributor.call(id, name, ...args);
  let t1 = performance.now();
  return {
    tookInMs: t1 - t0,
    tookInSec: parseFloat(((t1 - t0) / 1000).toFixed(2)),
    result,
  };
};

export { measureJs, measureWasm };
