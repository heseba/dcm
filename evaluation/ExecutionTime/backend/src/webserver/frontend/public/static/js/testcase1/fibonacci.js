const fibonacciSequence_limited = () => {
  let [a, b] = [0, 1];
  let n = 0;
  return (fiboNum = a) => {
    [a, b] = [b, a + b];
    return {
      n: n++,
      fiboNum: fiboNum,
    };
  };
};

// JavaScript only supports integer up to (2^53-1) = 9007199254740991
// Number.MAX_SAFE_INTEGER => Math.pow(2, 53) - 1 => !Number.isSafeInteger(num)
const fibonacci_limited = (maxNum) => {
  let nums = [];
  const f = fibonacciSequence_limited();
  let num;
  for (let i = 0; i < maxNum; i++) {
    num = f().fiboNum;

    if (num > Number.MAX_SAFE_INTEGER) {
      // console.info('max JavaScript safety integer range reached');
      nums = nums.slice(0, i);
      break;
    }

    nums[i] = num;
  }
  return nums;
};

/****************************************
 * BigInt Fibonacci
 ****************************************/

const fibonacciSequence = () => {
  let [a, b] = [0n, 1n];
  let n = 0;
  return (fiboNum = a) => {
    [a, b] = [b, a + b];
    return {
      n: n++,
      fiboNum: BigInt(fiboNum),
    };
  };
};

const fibonacci = (maxNum, uint = false, noLimits = false) => {
  if (!uint) {
    let nums = new BigInt64Array(maxNum);
    const maxInt = BigInt(Math.pow(2, 63)) - 1n;

    const f = fibonacciSequence();
    let num;

    for (let i = 0; i < maxNum; i++) {
      num = f().fiboNum;

      if (!noLimits) {
        if (num > maxInt) {
          // console.info('max BigInt int64 range reached');
          nums = nums.slice(0, i);
          break;
        }
      }

      nums[i] = num;
    }
    return nums;
  }

  let nums = new BigUint64Array(maxNum);
  const maxUint = BigInt(Math.pow(2, 64)) - 1n;

  const f = fibonacciSequence();
  let num;

  for (let i = 0; i < maxNum; i++) {
    num = BigInt(f().fiboNum);

    if (!noLimits) {
      if (num > maxUint) {
        // console.info('max BigInt uint64 range reached');
        nums = nums.slice(0, i);
        break;
      }
    }

    nums[i] = num;
  }
  return nums;
};

export { fibonacci, fibonacci_limited };
