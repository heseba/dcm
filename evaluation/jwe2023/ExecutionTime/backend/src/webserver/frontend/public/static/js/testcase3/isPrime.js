// Returns true if the passed BigInt value is a prime number
const isPrime = (p) => {
  for (let i = 2n; i * i <= p; i++) {
    if (p % i === 0n) return false;
  }
  return true;
};

// Takes a BigInt value as an argument, returns nth prime number as a BigInt value
const nthPrimeSlow = (nth) => {
  let maybePrime = 2n;
  let prime = 0n;

  while (nth > 0n) {
    if (isPrime(maybePrime)) {
      nth--;
      prime = maybePrime;
    }
    maybePrime++;
  }

  return prime;
};

const nextPrime = (value) => {
  if (value > 2) {
    let i, q;
    do {
      i = 3;
      value += 2;
      q = Math.floor(Math.sqrt(value));
      while (i <= q && value % i) {
        i += 2;
      }
    } while (i <= q);
    return value;
  }
  return value === 2 ? 3 : 2;
};

const nthPrime = (userValue) => {
  let value = 0,
    result = [];
  for (let i = 0; i < userValue; i++) {
    value = nextPrime(value);
    result.push(value);
  }
  return result.at(-1);
};

export { nthPrimeSlow, nthPrime };
