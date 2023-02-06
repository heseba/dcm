package gofile

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/format"
	"log"
	"path"
	"path/filepath"
)

func (goFile *GoFile) parseTypeDefinition(types *ast.GenDecl) {
	var t TypeSpecification
	for _, typeSpec := range types.Specs {
		tSpec, ok := typeSpec.(*ast.TypeSpec)
		if !ok {
			continue
		}

		t.Name = tSpec.Name.Name
		t.Ttype, _ = GetVarType(tSpec.Type)

		sourceCodeInBytes := &bytes.Buffer{}
		format.Node(sourceCodeInBytes, goFile.FileSet, tSpec)

		var (
			absDirpath = path.Dir(goFile.FileSet.Position(tSpec.Pos()).Filename)
			fileName   = filepath.Base(goFile.FileSet.Position(tSpec.Pos()).Filename)
			lineStart  = goFile.FileSet.Position(tSpec.Pos()).Line
			lineEnd    = goFile.FileSet.Position(tSpec.End()).Line
		)

		relDirpath, err := splitPathAfterKeyword(absDirpath, goFile.ModuleName)
		if err != nil {
			relDirpath, err = splitPathAfterKeyword(absDirpath, splitModuleName(goFile.ModuleName))

			if err != nil {
				log.Fatal("couldn't parse relative path: ", absDirpath)
			}
		}

		t.Location = Location{
			PackageName:  goFile.File.Name.Name,
			AbsolutePath: absDirpath,
			RelativePath: relDirpath,
			Filename:     fileName,
			LineStart:    lineStart,
			LineEnd:      lineEnd,
		}

		t.Imports = ParseImports(goFile, tSpec)
		t.Libraries = filterLibraries(t.Imports, goFile.ModuleName)

		t.Code = fmt.Sprintf("type %s", sourceCodeInBytes.String())
		t.IsExported = tSpec.Name.IsExported()

		goFile.TypeDefinitionList = append(goFile.TypeDefinitionList, t)
	}
}

func (tdL TypeDefinitionList) Print() {
	if len(tdL) == 0 {
		fmt.Printf("\tType Definitions: none\n")
	} else {
		fmt.Printf("\tType Definitions: [")
		for i, td := range tdL {
			td.Print()
			if i < len(tdL)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}
}

func (td TypeSpecification) Print() {
	fmt.Printf("%s %s", td.Name, td.Ttype)
}

func (tdL TypeDefinitionList) PrintInfo() {
	if len(tdL) == 0 {
		fmt.Println("No type definitions available.")
		return
	}
	for _, td := range tdL {
		td.PrintInfo()
	}
}

func (td TypeSpecification) PrintInfo() {
	fmt.Printf("%v\n", "====== TypeDefinition ======")

	fmt.Printf("'%s' located in '%s/%s' starts at line %d and ends on line %d\n", td.Name, td.Location.AbsolutePath, td.Location.Filename, td.Location.LineStart, td.Location.LineEnd)

	fmt.Printf("\tName: %s\n", td.Name)
	fmt.Printf("\tType: %s\n", td.Ttype)

	fmt.Printf("\tisExported: %t\n", td.IsExported)
	fmt.Printf("\tCode: %q\n", td.Code)
}
