import CodeDistributor from './index.js';

const codeDistributor = new CodeDistributor({
  moduleDir: './CodeDistributor',
  wasmDir: './CodeDistributor/wasm',
  // host: '127.0.0.1:5005',
  wsPath: '/ws',
  apiPath: '/api/v1',
  maxReconnectAttempts: 3,
});

const Fibonacci = async (...args) => {
  return codeDistributor.call({
    wasmId: 2,
    wasmFunc: 'Fibonacci',
    wasmParams: args,
  });
}

const Add = async (...args) => {
  return codeDistributor.call({
    wasmId: 3,
    wasmFunc: 'Add',
    wasmParams: args,
  });
}

const CalcDiscount = async (...args) => {
  return codeDistributor.call({
    wasmId: 4,
    wasmFunc: 'CalcDiscount',
    wasmParams: args,
  });
}

const IncrementNumber = async (...args) => {
  return codeDistributor.call({
    wasmId: 5,
    wasmFunc: 'IncrementNumber',
    wasmParams: args,
  });
}

const GetHash = async (...args) => {
  return codeDistributor.call({
    wasmId: 6,
    wasmFunc: 'GetHash',
    wasmParams: args,
  });
}

export { Fibonacci, Add, CalcDiscount, IncrementNumber, GetHash }