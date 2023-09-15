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

const NthPrimeSlow = async (...args) => {
  return codeDistributor.call({
    wasmId: 3,
    wasmFunc: 'NthPrimeSlow',
    wasmParams: args,
  });
}

const NthPrime = async (...args) => {
  return codeDistributor.call({
    wasmId: 5,
    wasmFunc: 'NthPrime',
    wasmParams: args,
  });
}

const NthPrimeIterations = async (...args) => {
  return codeDistributor.call({
    wasmId: 6,
    wasmFunc: 'NthPrimeIterations',
    wasmParams: args,
  });
}

export { Fibonacci, NthPrimeSlow, NthPrime, NthPrimeIterations }