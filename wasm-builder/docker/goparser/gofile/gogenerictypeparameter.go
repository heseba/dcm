package gofile

import (
	"fmt"
	"go/ast"
)

func parseFunctionTypeParameters(typeParameterList []*ast.Field) (GenericTypeParameterList, int) {
	var typeParams GenericTypeParameterList
	var numOfTypeParameters = 0
	var currentParamType string
	var isVariadic bool = false

	// early exit
	if len(typeParameterList) == 0 {
		return typeParams, numOfTypeParameters
	}

	// iterate through each parameter
	for _, p := range typeParameterList {

		// count parameters func(a,b int) or func(a int,b int)
		numOfTypeParameters = numOfTypeParameters + len(p.Names)

		currentParamType, isVariadic = GetVarType(p.Type)

		for _, p__name := range p.Names {
			var param GenericTypeParameter = GenericTypeParameter{}
			param.Name = p__name.Name
			param.ParamType = currentParamType
			param.IsVariadic = isVariadic

			typeParams = append(typeParams, param)
		}
	}

	return typeParams, numOfTypeParameters
}

func (typeparams GenericTypeParameterList) Print(label ...string) {
	var lbl string

	if len(label) > 0 {
		lbl = label[0]
	} else {
		lbl = "Generic Type Parameters"
	}

	if len(typeparams) == 0 {
		fmt.Printf("\t%s: none\n", lbl)
	} else {
		fmt.Printf("\t%s: (", lbl)
		for i, param := range typeparams {
			param.Print()
			if i < len(typeparams)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf(")\n")
	}
}

func (typeparam GenericTypeParameter) Print() {
	fmt.Printf("%s %s", typeparam.Name, typeparam.ParamType)
}

func (typeparams GenericTypeParameterList) PrintInfo() {
	if len(typeparams) == 0 {
		fmt.Println("No type parameters expected.")
		return
	}
	for _, param := range typeparams {
		param.PrintInfo()
	}
}

func (typeparam GenericTypeParameter) PrintInfo() {
	fmt.Printf("%v\n", "====== GENERIC TYPE PARAMETER ======")

	fmt.Printf("\tName: %s\n", typeparam.Name)
	fmt.Printf("\tType: %s\n", typeparam.ParamType)
	fmt.Printf("\tisVariadic: %t\n", typeparam.IsVariadic)
}
