package shared

import (
	"fmt"
	mathematics "math"
)

var NumberFive5 int = 5

var NumberSix = 6

const NumberSeven int = 7

var (
	NumberEight     = 8
	NumberNine  int = 9
	NumberTen   int
)

type Mentor struct {
	Name string
	Age  int
}

var MyObj *Mentor = &Mentor{
	Name: "Eugen",
	Age:  2,
}

type Colleague struct {
	Name   string
	Skills []string
}

type Employee struct {
	Name   string
	Skills []string
}

type Profile struct {
	Age          int
	Name         string
	Salary       float64
	TechInterest bool
}

type CustomError struct {
	StatusCode int
	Err        error
}

func (r *CustomError) Error() string {
	return fmt.Sprintf("status %d: err %v", r.StatusCode, r.Err)
}

type IShape interface {
	Area() float64
}

type Rectangle struct {
	Width, Height float64
}

type Circle struct {
	Radius float64
}

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func (c Circle) Area() float64 {
	return mathematics.Pi * c.Radius * c.Radius
}

func getArea(shape IShape) float64 {
	return shape.Area()
}
