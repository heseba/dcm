package gofile

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/format"
	"log"
	"path"
	"path/filepath"
	"strconv"
)

func (goFile *GoFile) parseFunction(fn *ast.FuncDecl) {
	var fun FunctionDeclaration
	fun.AstNode = fn
	fun.Name = fn.Name.Name
	// Type parameters
	if fn.Type.TypeParams != nil {
		fun.GenericTypeParameterList, fun.NumberOfGenericTypeParameters = parseFunctionTypeParameters(fn.Type.TypeParams.List)
	}
	// Parameters
	fun.FunctionParameterList, fun.NumberOfFunctionParameters = parseFunctionParameters(fn.Type.Params.List)

	// Return values
	if fn.Type.Results != nil {
		fun.ReturnParameterList, fun.NumberOfReturnParameters = parseFunctionReturnValues(fn.Type.Results.List)
	}
	fun.IsExported = fn.Name.IsExported()

	stdout := &bytes.Buffer{}
	format.Node(stdout, goFile.FileSet, fn)
	fun.Code = stdout.String()

	var (
		absDirpath = path.Dir(goFile.FileSet.Position(fn.Pos()).Filename)
		fileName   = filepath.Base(goFile.FileSet.Position(fn.Pos()).Filename)
		lineStart  = goFile.FileSet.Position(fn.Pos()).Line
		lineEnd    = goFile.FileSet.Position(fn.End()).Line
	)

	relDirpath, err := splitPathAfterKeyword(absDirpath, goFile.ModuleName)
	if err != nil {
		relDirpath, err = splitPathAfterKeyword(absDirpath, splitModuleName(goFile.ModuleName))

		if err != nil {
			log.Fatal("couldn't parse relative path: ", absDirpath)
		}
	}

	fun.Location = Location{
		PackageName:  goFile.File.Name.Name,
		AbsolutePath: absDirpath,
		RelativePath: relDirpath,
		Filename:     fileName,
		LineStart:    lineStart,
		LineEnd:      lineEnd,
	}

	fun.Imports = ParseImports(goFile, fn)
	fun.Libraries = filterLibraries(fun.Imports, goFile.ModuleName)

	fun.IsInterface = false
	if fn.Recv != nil {
		fun.IsInterface = true
		fun.InterfaceParameterList, _ = parseInterfaceParameters(fn.Recv.List)
	}

	// *p.goFunctionList = append(*p.goFunctionList, fun)
	goFile.GoFunctionList.Add(fun)
}

func (goFl *GoFunctionList) Add(goF FunctionDeclaration) {
	*goFl = append(*goFl, goF)
}

func (goFl GoFunctionList) Print() {
	for _, goF := range goFl {
		goF.Print()
	}
}

func (decl *FunctionDeclaration) Print() {
	if decl.IsInterface {
		fmt.Printf("%s\n", "====== INTERFACE ======")
	} else {
		fmt.Printf("%s\n", "====== FUNCTION ======")
	}

	fmt.Printf("func '%s' located in '%s/%s' starts at line %d and ends on line %d\n", decl.Name, decl.Location.AbsolutePath, decl.Location.Filename, decl.Location.LineStart, decl.Location.LineEnd)
	fmt.Printf("\tPackage: %s\n", decl.Location.PackageName)

	decl.FunctionParameterList.Print("Parameters")
	decl.ReturnParameterList.Print()
	fmt.Printf("\tisExported: %t\n", decl.IsExported)
	decl.Imports.Print()
	decl.Libraries.Print()

	fmt.Printf("\tisInterface: %t\n", decl.IsInterface)
	if decl.IsInterface {
		decl.InterfaceParameterList.Print("Interface Parameters")
	}

	fmt.Printf("\tBody: %s\n", strconv.Quote(decl.Code))

}
