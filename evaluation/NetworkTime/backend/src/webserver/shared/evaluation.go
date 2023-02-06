package shared

import (
	"math"
)

// fibonacci returns a function that returns
// successive fibonacci numbers from each
// successive call
func fibonacciSequence() func() (int64, bool) {
	// var addUintInt64 = func(x uint64, y int64) (uint64, bool) {
	// 	result := uint64(int64(x) + y)
	// 	before := x >> 63
	// 	after := result >> 63
	// 	ok := before == after || (before == 0 && y >= 0) || (before == 1 && y < 0)
	// 	return result, ok
	// }

	var Add64 = func(a, b int64) (int64, bool) {
		c := a + b
		if (c < a) == (b < 0) {
			return c, true
		}

		return c, false
	}

	var first int64 = 0
	var second int64 = 1
	var next bool = true

	return func() (int64, bool) {
		ret := first

		if !next {
			return ret, true
		}

		sum, ok := Add64(first, second)

		if !ok {
			next = false
		}

		first, second = second, sum

		return ret, false
	}
}

func Fibonacci(maxNum int) []int64 {
	nums := []int64{}
	var num int64
	var isIntOverflow bool
	f := fibonacciSequence()

	for i := 0; i < maxNum; i++ {
		num, isIntOverflow = f()

		if isIntOverflow {
			nums = append(nums, num)
			break
		}
		nums = append(nums, num)
	}

	return nums
}

func NthPrimeSlow(n int) int {
	var result int = 2
	var isPrime = func(n int) bool {
		switch {
		case n == 2:
			return true
		case n < 2 || n%2 == 0:
			return false

		default:
			for i := 3; i*i <= n; i += 2 {
				if n%i == 0 {
					return false
				}
			}
		}
		return true
	}

	for {

		if isPrime(result) {
			n--
		}

		if n == 0 {
			return result
		}

		result++
	}
}

func isDivisible(candidate, by int) bool {
	return candidate%by == 0
}

func NthPrime(limit int) int {
	primes := make([]int, limit)
	count := 0

	isPrimeDivisible := func(candidate int) bool {
		for j := 0; j < count; j++ {
			if math.Sqrt(float64(candidate)) < float64(primes[j]) {
				return false
			}
			isDivisibe := isDivisible(candidate, primes[j])
			if isDivisibe {
				return true
			}
		}
		return false
	}
	for candidate := 2; ; {
		if count < limit {
			if !isPrimeDivisible(candidate) {
				primes[count] = candidate
				count++
			}
			candidate++
		} else {
			break
		}
	}
	return primes[limit-1]
}

func NthPrimeIterations(iterations, numOfElements int) []int {
	var nums []int

	for i := 0; i < iterations; i++ {
		nums = append(nums, NthPrime(numOfElements))
	}

	return nums
}
