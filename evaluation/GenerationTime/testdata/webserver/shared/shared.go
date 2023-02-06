package shared

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
)

func Add(a, b int) int {
	// not cool
	/* { test */
	/* even }
	* science /*
	/*
	*/ //fmt.Printf(`is "this" valid?`)
	/*===============
	 *==  COMMENTS {
	 =================*/
	return a + b
}

func Sub(a, b int) int {
	return a - b
}

func Mul(a, b int) int {
	return a * b
}

func Div(a, b float64) float64 {
	if b == 0.0 {
		fmt.Println("Error: division by 0")
		return 0.0
	}
	return a / b
}

func MultiplyByTwo(a int) int {
	return a * getNumberTwo()
}

func getNumberTwo() int {
	return 2
}

func GetHash(str string) string {
	hasher := sha256.New()
	hasher.Write([]byte(str))
	sha := hasher.Sum(nil)
	return hex.EncodeToString(sha)
}

func FuncFunction(number int) func() int {
	a := number

	return func() int {
		return a + 1
	}
}

func BoolFunction(a bool) bool {
	return a
}

func Pythagoras(a, b float64) float64 {
	return math.Sqrt(a*a + b*b)
}

func SumArray(arr []int, arr2 []int, number int) int {
	result := 0
	result2 := 0

	for i := 0; i < len(arr); i++ {
		result += arr[i]
	}
	for i := 0; i < len(arr2); i++ {
		result += arr2[i]
	}

	return result + result2 + number
}

func VariadicFunction(number int, args ...int) int {
	result := 0
	for i := 0; i < len(args); i++ {
		result += args[i]
	}
	return number + result
}

func ExternalVariable() int {
	NumberTen = 10
	return NumberFive5 + NumberSix + NumberSeven + NumberEight + NumberNine + NumberTen + MyObj.Age
}

func CreatingEmployee(col Colleague, col2 Colleague) *Employee {
	emp := &Employee{
		Name:   col.Name,
		Skills: col2.Skills,
	}

	return emp
}

func MultiReturn(col Colleague, skills []string) (*Employee, []int, error) {
	emp := &Employee{
		Name:   col.Name,
		Skills: skills,
	}
	arr := []int{1, 2, 3}

	return emp, arr, nil
}

// https://go.dev/play/p/JHlj7X7SYqe
func ObjectInArray(ments []Mentor, number int) int {
	m := &Mentor{}
	for i, ment := range ments {
		if i == 0 {
			m.Name = ment.Name
		} else if i == 1 {
			m.Age = ment.Age
		}
	}

	m.Age = m.Age + number

	return m.Age
}

func ModifyMap(expenses map[string]int) map[string]int {
	expenses["food"] = 4500
	return expenses
}

func ReturnError() (string, error) {
	return "Attention", &CustomError{
		StatusCode: 503,
		Err:        errors.New("unavailable"),
	}
}

func ModifyBasicTypes(name *string, age *int, cash *float64, techInterest *bool, countries *[3]string, myProfile *Profile) {
	*name = "Golang"
	*age = 90
	*cash = 50.45
	*techInterest = !(*techInterest)
	*countries = [3]string{"sudanese", "belgium", "zambia"}
	*myProfile = Profile{
		Age:          100,
		Name:         "GOOGLE",
		Salary:       40.54,
		TechInterest: true,
	}
}

func Check() {
	fmt.Println("check")
}

func CalcArea() float64 {
	rect := Rectangle{
		Width:  100.0,
		Height: 100.0,
	}
	return getArea(rect)
}
