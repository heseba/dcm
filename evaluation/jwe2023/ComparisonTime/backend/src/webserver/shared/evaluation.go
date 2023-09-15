package shared

import (
	"crypto/sha256"
	"encoding/hex"
	"time"
)

//func WasmStartupTime() int64 {
//	return time.Now().UnixMilli()
//}

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

func Add(a, b int) int {
	return a + b
}

func CalcDiscount(total float64, discount float64) float64 {
	if total <= 0 || discount <= 0 {
		return 0
	}
	return (total / 100) * discount
}

func IncrementNumber(num int) int {
	return num + 1
}

func GetHash(str string) string {
	hasher := sha256.New()
	hasher.Write([]byte(str))
	sha := hasher.Sum(nil)
	return hex.EncodeToString(sha)
}
