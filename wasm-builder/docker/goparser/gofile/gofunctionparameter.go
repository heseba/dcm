package gofile

import (
	"fmt"
	"go/ast"
)

func parseFunctionParameters(parameterList []*ast.Field) (FunctionParameterList, int) {
	var params FunctionParameterList
	var numOfParameters = 0
	var currentParamType string
	var isVariadic bool = false

	// early exit
	if len(parameterList) == 0 {
		return params, numOfParameters
	}

	// iterate through each parameter
	for _, p := range parameterList {

		// count parameters func(a,b int) or func(a int,b int)
		numOfParameters = numOfParameters + len(p.Names)

		currentParamType, isVariadic = GetVarType(p.Type)

		for _, p__name := range p.Names {
			var param FunctionParameter = FunctionParameter{}
			param.Name = p__name.Name
			param.ParamType = currentParamType
			param.IsVariadic = isVariadic

			params = append(params, param)
		}
	}

	return params, numOfParameters
}

func (params FunctionParameterList) Print(label ...string) {
	var lbl string

	if len(label) > 0 {
		lbl = label[0]
	} else {
		lbl = "Function Parameters"
	}

	if len(params) == 0 {
		fmt.Printf("\t%s: none\n", lbl)
	} else {
		fmt.Printf("\t%s: (", lbl)
		for i, param := range params {
			param.Print()
			if i < len(params)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf(")\n")
	}
}

func (param FunctionParameter) Print() {
	fmt.Printf("%s %s", param.Name, param.ParamType)
}

func (params FunctionParameterList) PrintInfo() {
	if len(params) == 0 {
		fmt.Println("No parameters expected.")
		return
	}
	for _, param := range params {
		param.PrintInfo()
	}
}

func (param FunctionParameter) PrintInfo() {
	fmt.Printf("%v\n", "====== FUNCTION PARAMETER ======")

	fmt.Printf("\tName: %s\n", param.Name)
	fmt.Printf("\tType: %s\n", param.ParamType)
	fmt.Printf("\tisVariadic: %t\n", param.IsVariadic)
}
