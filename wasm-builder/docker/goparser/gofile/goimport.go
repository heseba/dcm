package gofile

import (
	"fmt"
	"go/ast"
	"strings"
)

type visitFn func(fn ast.Node)

func (fn visitFn) Visit(node ast.Node) ast.Visitor {
	fn(node)
	return fn
}

// returns the import spec if the import is in imports or nil otherwise.
// it's important to know that we check the alias against the original spec, if we define the last segment as alias we would need to split it here as well
func isImportInImportsOfFile(fileImports []*ast.ImportSpec, searchedImport PackageImport) *ast.ImportSpec {

	// look for an alias first
	if searchedImport.Alias != "" {
		for _, imp := range fileImports {
			if imp.Name != nil {
				if imp.Name.String() == searchedImport.Alias {
					return imp
				}
			}
		}
	} else {
		for _, imp := range fileImports {
			if unquoteImportPath(imp) == searchedImport.Name {
				return imp
			}
		}
	}

	return nil
}

// isTopName returns true if n is a top-level unresolved identifier with the given name.
func isTopName(n ast.Expr, name string) bool {
	id, ok := n.(*ast.Ident)
	return ok && id.Name == name && id.Obj == nil
}

// UsesImport reports whether a given import is used.
func usesImport(fileImports []*ast.ImportSpec, node ast.Node, searchedImport PackageImport) (used bool) {
	spec := isImportInImportsOfFile(fileImports, searchedImport)
	if spec == nil {
		return
	}

	name := spec.Name.String()
	switch name {
	case "<nil>":
		// If the package name is not explicitly specified,
		// make an educated guess. This is not guaranteed to be correct.
		lastSlash := strings.LastIndex(searchedImport.Name, "/")
		if lastSlash == -1 {
			name = searchedImport.Name
		} else {
			name = searchedImport.Name[lastSlash+1:]
		}
	case "_", ".":
		// Not sure if this import is used - err on the side of caution.
		return true
	}

	ast.Walk(visitFn(func(n ast.Node) {
		sel, ok := n.(*ast.SelectorExpr)
		if ok && isTopName(sel.X, name) {
			used = true
		}
	}), node)

	return
}

// compares file imports with used function calls and creates an array of used imports of the FUNCTION
func ParseImports(goFile *GoFile, node ast.Node) PackageImports {
	var imps PackageImports

	for _, imp := range goFile.Imports {
		// fmt.Printf("%v\n", decl.Name.Name)
		// fmt.Printf("imp: %v\n", imp.name)
		// fmt.Printf("imp used in function: %t\n", usesImport(goFile.File.Imports, fn, imp))
		// fmt.Printf("is imp not in imps: %t\n", !imps.contains(imp))
		if usesImport(goFile.File.Imports, node, imp) && !imps.contains(imp) {
			imps = append(imps, imp)
		}
	}

	return imps
}

// check if a library is already included in the library array,
// can pass the library name as string or Library object
func (imps PackageImports) contains(newLib PackageImport) bool {

	for _, lib := range imps {
		// if import uses an alias, check for it first
		if newLib.Alias != "" {
			if lib.Alias == newLib.Alias {
				return true
			}
		} else if lib.Name == newLib.Name {
			return true
		}
	}

	return false
}

// retrieves all imports used in the file
func GetImportsOfFile(imports []*ast.ImportSpec, moduleName string) PackageImports {
	var imps PackageImports

	for _, imp := range imports {
		var newImport PackageImport = NewImport(imp, moduleName)

		imps = append(imps, newImport)
	}

	return imps
}

func NewImport(imp *ast.ImportSpec, moduleName string) PackageImport {
	var newImport PackageImport = PackageImport{
		Alias: "",
		Name:  unquoteImportPath(imp),
		Local: false,
	}

	splitImportPath := strings.Split(newImport.Name, "/")

	if imp.Name != nil {
		newImport.Alias = imp.Name.Name
	} else if newImport.Alias == "" {
		// define always an alias if non was provided by using the last segment
		// WARNING: enabling this will require to change function: isImportInImportsOfFile
		// newImport.Alias = splitImportPath[len(splitImportPath)-1]
		newImport.Alias = ""
	}

	// distinguish improted libs and imports from our packages
	if splitImportPath[0] == moduleName {
		newImport.Local = true
	}

	return newImport
}

func (imps PackageImports) Print() {
	if len(imps) == 0 {
		fmt.Printf("\tImports: none\n")
	} else {
		fmt.Printf("\tImports: [")
		for i, lib := range imps {
			lib.Print()
			if i < len(imps)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}
}

func (imp PackageImport) Print() {
	if imp.Alias == "" {
		fmt.Printf("\"%s\"", imp.Name)
		return
	}
	fmt.Printf("\"%s %s\"", imp.Alias, imp.Name)
}

func (imps PackageImports) PrintInfo() {

	if len(imps) == 0 {
		fmt.Println("No imports in use.")
		return
	}

	for _, imp := range imps {
		imp.PrintInfo()
	}
}

func (imp PackageImport) PrintInfo() {
	fmt.Printf("%v\n", "====== IMPORT ======")

	if imp.Alias == "" {
		fmt.Println("\talias: none")
	} else {
		fmt.Printf("\talias: %s\n", imp.Alias)
	}

	fmt.Printf("\tImport: %s\n", imp.Name)
}
