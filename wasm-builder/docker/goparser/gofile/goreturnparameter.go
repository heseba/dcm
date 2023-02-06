package gofile

import (
	"fmt"
	"go/ast"
)

// named and unnamed return values cannot be mixed
func parseFunctionReturnValues(valueList []*ast.Field) (ReturnParameterList, int) {
	var rvList ReturnParameterList
	var numOfReturnValues = 0
	var currentReturnValueType string
	var isVariadic bool = false

	// early exit
	if len(valueList) == 0 {
		return rvList, numOfReturnValues
	}

	// iterate through each return value
	for _, value := range valueList {

		currentReturnValueType, isVariadic = GetVarType(value.Type)

		// count return values, names are optional
		if len(value.Names) == 0 {
			numOfReturnValues = numOfReturnValues + 1
			var rV ReturnParameter = ReturnParameter{}
			rV.Name = ""
			rV.ParamType = currentReturnValueType
			rV.IsVariadic = isVariadic

			rvList = append(rvList, rV)
		} else {
			numOfReturnValues = numOfReturnValues + len(value.Names)
			for _, p__name := range value.Names {
				var rV ReturnParameter = ReturnParameter{}
				rV.Name = p__name.Name
				rV.ParamType = currentReturnValueType
				rV.IsVariadic = isVariadic

				rvList = append(rvList, rV)
			}
		}
	}

	return rvList, numOfReturnValues
}

func (rvL ReturnParameterList) Print() {
	if len(rvL) == 0 {
		fmt.Printf("\tReturnParameters: none\n")
	} else {
		fmt.Printf("\tReturnParameters: (")
		for i, rv := range rvL {
			rv.Print()
			if i < len(rvL)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf(")\n")
	}
}

func (rV ReturnParameter) Print() {
	if rV.Name == "" {
		fmt.Printf("%s", rV.ParamType)
	} else {
		fmt.Printf("%s %s", rV.Name, rV.ParamType)
	}
}

func (rvL ReturnParameterList) PrintInfo() {
	if len(rvL) == 0 {
		fmt.Println("Nothing to return.")
		return
	}
	for _, rv := range rvL {
		rv.PrintInfo()
	}
}

func (rV ReturnParameter) PrintInfo() {
	fmt.Printf("%v\n", "====== Return Parameter ======")

	fmt.Printf("\tName: %s\n", rV.Name)
	fmt.Printf("\tType: %s\n", rV.ParamType)
	fmt.Printf("\tisVariadic: %t\n", rV.IsVariadic)
}
