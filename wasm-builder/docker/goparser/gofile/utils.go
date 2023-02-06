package gofile

import (
	"fmt"
	"go/ast"
	"go/types"
	"strconv"
	"strings"
)

func unquoteString(s string) string {
	t, err := strconv.Unquote(s)
	if err != nil {
		return ""
	}
	return t
}

// importPath returns the unquoted import path of s,
// or "" if the path is not properly quoted.
func unquoteImportPath(s *ast.ImportSpec) string {
	return unquoteString(s.Path.Value)
}

func filterLibraries(imports PackageImports, moduleName string) Libraries {
	var libs Libraries

	for _, imp := range imports {
		if !strings.HasPrefix(imp.Name, moduleName) {
			libs = append(libs, Library(imp))
		}
	}

	return libs
}

func GetVarType(x ast.Expr) (currentType string, isVariadic bool) {

	// check for different parameter types
	switch v__type := x.(type) {
	// regular: int, float64, string
	case *ast.Ident:
		currentType = v__type.String()
	// type: arrays
	case *ast.ArrayType:
		switch expr := v__type.Elt.(type) {
		// rebular array
		case *ast.Ident:
			currentType = fmt.Sprintf("[]%s", expr.String())
		// struct array
		case *ast.SelectorExpr:
			currentType = fmt.Sprintf("[]%s", expr.Sel.String())
		default:
			return "", false
		}
	// type variadic
	case *ast.Ellipsis:
		switch expr := v__type.Elt.(type) {
		// rebular array
		case *ast.Ident:
			currentType = fmt.Sprintf("...%s", expr.String())
		// struct array
		case *ast.SelectorExpr:
			currentType = fmt.Sprintf("...%s", expr.Sel.String())
		default:
			return "", false
		}
		isVariadic = true
		// structs
	case *ast.StructType:
		currentType = types.ExprString(x)
	// interfaces
	case *ast.InterfaceType:
		currentType = types.ExprString(x)
	// imported methods
	case *ast.SelectorExpr:
		currentType = fmt.Sprintf("%s.%s", v__type.X, v__type.Sel.String())
	// pointer
	case *ast.StarExpr:
		switch expr := v__type.X.(type) {
		// struct name
		case *ast.Ident:
			currentType = fmt.Sprintf("*%s", expr.Name)
		// imported methods
		case *ast.SelectorExpr:
			currentType = fmt.Sprintf("*%s.%s", expr.X, expr.Sel.String())
		default:
			return "", false
		}
	default:
		return types.ExprString(x), false
	}

	// currentType = types.ExprString(x)

	return
}

type Stringer interface {
	splitAfter() string
}

// splits string on first occurrence
func splitPathAfterKeyword(path string, keyword string) (string, error) {
	n := strings.Index(path, keyword)

	if n == -1 {
		return "", fmt.Errorf("couldn't split string")
	}

	return path[n:], nil
}

func splitModuleName(path string) string {
	splitPath := strings.Split(path, "/")
	return splitPath[len(splitPath)-1]
}
