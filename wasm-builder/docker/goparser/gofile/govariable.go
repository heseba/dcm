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

func (goFile *GoFile) parseVariable(variables *ast.GenDecl) {
	var currentVariableType string

	for _, varSpec := range variables.Specs {
		vSpec, ok := varSpec.(*ast.ValueSpec)
		if !ok {
			continue
		}

		if vSpec.Type == nil {

			// otherwise keep the previous seen variable type
			if len(vSpec.Values) > 0 {
				// for complex variables with initialization
				if compLit, ok := vSpec.Values[0].(*ast.CompositeLit); ok {
					currentVariableType, _ = GetVarType(compLit.Type)
				}
			}
		} else {
			currentVariableType, _ = GetVarType(vSpec.Type)
		}

		sourceCodeInBytes := &bytes.Buffer{}
		format.Node(sourceCodeInBytes, goFile.FileSet, vSpec)

		var (
			absDirpath = path.Dir(goFile.FileSet.Position(vSpec.Pos()).Filename)
			fileName   = filepath.Base(goFile.FileSet.Position(vSpec.Pos()).Filename)
			lineStart  = goFile.FileSet.Position(vSpec.Pos()).Line
			lineEnd    = goFile.FileSet.Position(vSpec.End()).Line
		)

		relDirpath, err := splitPathAfterKeyword(absDirpath, goFile.ModuleName)
		if err != nil {
			relDirpath, err = splitPathAfterKeyword(absDirpath, splitModuleName(goFile.ModuleName))

			if err != nil {
				log.Fatal("couldn't parse relative path: ", absDirpath)
			}
		}

		for i, vName := range vSpec.Names {
			var v ValueSpecification
			v.Name = vName.Name
			v.Vtype = currentVariableType
			v.Token = vName.Obj.Kind.String()
			v.Libraries = filterLibraries(ParseImports(goFile, vSpec), goFile.ModuleName)

			if len(vSpec.Values) != 0 {
				stdout := &bytes.Buffer{}
				format.Node(stdout, goFile.FileSet, vSpec.Values[i])
				v.Value = stdout.String()
			}

			v.Location = Location{
				PackageName:  goFile.File.Name.Name,
				AbsolutePath: absDirpath,
				RelativePath: relDirpath,
				Filename:     fileName,
				LineStart:    lineStart,
				LineEnd:      lineEnd,
			}

			v.Imports = ParseImports(goFile, vSpec)

			// if v__name.Obj.Kind == ast.ObjKind(token.VAR)
			// if v__name.Obj.Kind == ast.ObjKind(token.CONST)
			v.Code = fmt.Sprintf("%s %s", v.Token, sourceCodeInBytes.String())
			v.IsExported = vName.IsExported()

			goFile.GlobalVariableList = append(goFile.GlobalVariableList, v)
		}
	}

}

func (gvL GlobalVariableList) Print(label ...string) {
	var lbl string

	if len(label) > 0 {
		lbl = label[0]
	} else {
		lbl = "Variables/Constants"
	}

	if len(gvL) == 0 {
		fmt.Printf("\t%s: none\n", lbl)
	} else {
		fmt.Printf("\t%s: [", lbl)
		for i, param := range gvL {
			param.Print()
			if i < len(gvL)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}
}

func (gV ValueSpecification) Print() {
	fmt.Printf("%s %s %s", gV.Token, gV.Name, gV.Vtype)
}

func (gvL GlobalVariableList) PrintInfo() {
	if len(gvL) == 0 {
		fmt.Println("No variables available.")
		return
	}
	for _, v := range gvL {
		v.PrintInfo()
	}
}

func (gV ValueSpecification) PrintInfo() {
	if gV.Token == "var" {
		fmt.Printf("%v\n", "====== Variable ======")
	} else if gV.Token == "const" {
		fmt.Printf("%v\n", "====== Constant ======")
	}

	fmt.Printf("%s '%s' located in '%s/%s' starts at line %d and ends on line %d\n", gV.Token, gV.Name, gV.Location.AbsolutePath, gV.Location.Filename, gV.Location.LineStart, gV.Location.LineEnd)

	fmt.Printf("\tName: %s\n", gV.Name)
	fmt.Printf("\tType: %s\n", gV.Vtype)
	fmt.Printf("\tToken: %s\n", gV.Token)

	if gV.Value == nil {
		fmt.Printf("\tValue: none\n")
	} else {
		fmt.Printf("\tValue: %q\n", gV.Value)
	}

	fmt.Printf("\tisExported: %t\n", gV.IsExported)
	fmt.Printf("\tCode: %q\n", gV.Code)
}
