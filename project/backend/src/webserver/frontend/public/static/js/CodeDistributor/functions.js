import CodeDistributor from './index.js';

const codeDistributor = new CodeDistributor({
  moduleDir: './CodeDistributor',
  wasmDir: './CodeDistributor/wasm',
  // host: '127.0.0.1:5005',
  wsPath: '/ws',
  apiPath: '/api/v1',
  maxReconnectAttempts: 3,
});

const Add = async (...args) => {
  return codeDistributor.call({
    wasmId: 1,
    wasmFunc: 'Add',
    wasmParams: args,
  });
}

const GetHash = async (...args) => {
  return codeDistributor.call({
    wasmId: 2,
    wasmFunc: 'GetHash',
    wasmParams: args,
  });
}

const CalcMwst = async (...args) => {
  return codeDistributor.call({
    wasmId: 3,
    wasmFunc: 'CalcMwst',
    wasmParams: args,
  });
}

const GenObj = async (...args) => {
  return codeDistributor.call({
    wasmId: 5,
    wasmFunc: 'GenObj',
    wasmParams: args,
  });
}

const SortStrings = async (...args) => {
  return codeDistributor.call({
    wasmId: 7,
    wasmFunc: 'SortStrings',
    wasmParams: args,
  });
}

const SortFloats = async (...args) => {
  return codeDistributor.call({
    wasmId: 8,
    wasmFunc: 'SortFloats',
    wasmParams: args,
  });
}

const IncrementNumber = async (...args) => {
  return codeDistributor.call({
    wasmId: 9,
    wasmFunc: 'IncrementNumber',
    wasmParams: args,
  });
}

const DecrementNumber = async (...args) => {
  return codeDistributor.call({
    wasmId: 10,
    wasmFunc: 'DecrementNumber',
    wasmParams: args,
  });
}

const AddFloats = async (...args) => {
  return codeDistributor.call({
    wasmId: 11,
    wasmFunc: 'AddFloats',
    wasmParams: args,
  });
}

const ValidateCouponInput = async (...args) => {
  return codeDistributor.call({
    wasmId: 12,
    wasmFunc: 'ValidateCouponInput',
    wasmParams: args,
  });
}

const ValidateCoupon = async (...args) => {
  return codeDistributor.call({
    wasmId: 14,
    wasmFunc: 'ValidateCoupon',
    wasmParams: args,
  });
}

const IsStringInSlice = async (...args) => {
  return codeDistributor.call({
    wasmId: 15,
    wasmFunc: 'IsStringInSlice',
    wasmParams: args,
  });
}

const CalcDiscount = async (...args) => {
  return codeDistributor.call({
    wasmId: 16,
    wasmFunc: 'CalcDiscount',
    wasmParams: args,
  });
}

const RoundFloat = async (...args) => {
  return codeDistributor.call({
    wasmId: 17,
    wasmFunc: 'RoundFloat',
    wasmParams: args,
  });
}

const NewSubtract = async (...args) => {
  return codeDistributor.call({
    wasmId: 18,
    wasmFunc: 'NewSubtract',
    wasmParams: args,
  });
}

export { Add, GetHash, CalcMwst, GenObj, SortStrings, SortFloats, IncrementNumber, DecrementNumber, AddFloats, ValidateCouponInput, ValidateCoupon, IsStringInSlice, CalcDiscount, RoundFloat, NewSubtract }