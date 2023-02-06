package gofile

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"goparser/app"
	"goparser/utils"
	"io/ioutil"
	"log"
	"path"
)

func NewGoFile(filePath string, moduleName string) (GoFile, error) {
	var goFile GoFile
	goFile.FileSet = token.NewFileSet() // positions are relative to fset

	var mode parser.Mode = Modes[0]
	if app.Config.Comments {
		mode = Modes[3]
	}

	file, err := parser.ParseFile(goFile.FileSet, filePath, nil, mode)
	if err != nil {
		// log.Println(err)
		return goFile, err
	}

	goFile.File = file
	goFile.ModuleName = moduleName
	goFile.AbsoluteFilepath = filePath

	// NOTE we assume that module name represents directory name, this is not always the case but it's likely due to GO guidelines otherwise try to split path on / and take the last name
	// e.g. github.com/hashicorp/terraform => terraform
	goFile.RelativeFilepath, err = splitPathAfterKeyword(filePath, moduleName)

	if err != nil {
		goFile.RelativeFilepath, err = splitPathAfterKeyword(filePath, splitModuleName(moduleName))

		if err != nil {
			log.Fatal("couldn't parse relative path: ", filePath)
		}
	}

	goFile.Imports = GetImportsOfFile(goFile.File.Imports, moduleName)
	goFile.Libraries = filterLibraries(goFile.Imports, moduleName)

	// trim the file so that only exported expr are present on the AST
	if app.Config.ExportedOnly {
		ast.FileExports(file)
	}

	for _, decl := range file.Decls {
		// check if it's a function or globalVar, otherwise skip (might also be other types)
		switch decl__type := decl.(type) {
		case *ast.FuncDecl:
			goFile.parseFunction(decl__type)
		case *ast.GenDecl:

			switch decl__type.Tok {
			case token.VAR, token.CONST:
				goFile.parseVariable(decl__type)
			case token.TYPE:
				goFile.parseTypeDefinition(decl__type)
			default:
				// 	excludeTokens := []string{token.COMMENT.String(), token.IMPORT.String()}
				// 	if !utils.Contains(decl__type.Tok.String(), excludeTokens) {
				// 		fmt.Printf("%+v\n", decl__type)
				// 	}
			}

		default:
			continue
		}
	}

	return goFile, nil
}

func (goFile *GoFile) Print() {
	fmt.Printf("%v\n", "====== FILE ======")

	fmt.Printf("\tFile: %s.go\n", goFile.File.Name)

	if len(goFile.Imports) == 0 {
		fmt.Printf("\tImports: none\n")
	} else {
		fmt.Printf("\tImports: [")
		for i, lib := range goFile.Imports {
			lib.Print()
			if i < len(goFile.Imports)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}
	if len(goFile.Libraries) == 0 {
		fmt.Printf("\tLibraries: none\n")
	} else {
		fmt.Printf("\tLibraries: [")
		for i, lib := range goFile.Libraries {
			lib.Print()
			if i < len(goFile.Libraries)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}

	if len(goFile.Imports) == 0 {
		fmt.Printf("\tFunctions: none\n")
	} else {
		fmt.Printf("\tFunctions: [")
		for i, function := range goFile.GoFunctionList {
			fmt.Printf("\"%s\"", function.Name)
			if i < len(goFile.GoFunctionList)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}

	if len(goFile.GlobalVariableList) == 0 {
		fmt.Printf("\tVariables: none\n")
	} else {
		fmt.Printf("\tVariables: [")
		for i, v := range goFile.GlobalVariableList {
			fmt.Printf("\"%s\"", v.Name)
			if i < len(goFile.GlobalVariableList)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}

	if len(goFile.TypeDefinitionList) == 0 {
		fmt.Printf("\tType Definitions: none\n")
	} else {
		fmt.Printf("\tType Definitions: [")
		for i, td := range goFile.TypeDefinitionList {
			fmt.Printf("\"%s\"", td.Name)
			if i < len(goFile.TypeDefinitionList)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}
}

func (goFile GoFile) ExportJSON() {
	var jsonBytes bytes.Buffer
	var outputPath string

	// create dir if it doesn't exist
	if err := utils.EnsureDir(app.Config.Output); err != nil {
		fmt.Printf("Directory creation for '%s' failed. Falling back to: ./ \nError: %s", app.Config.Output, err.Error())
		app.Config.Output = "."
	}

	ok, _ := utils.IsDirectory(app.Config.Output)
	if ok {
		outputPath = path.Join(app.Config.Output, "export.json")

	} else {
		outputPath = app.Config.Output
	}

	jsonEncoder := json.NewEncoder(&jsonBytes)
	if !app.Config.Options.Minify {
		jsonEncoder.SetIndent("", "  ")
	}
	err := jsonEncoder.Encode(goFile)
	if err != nil {
		log.Fatal(err)
	}

	err = ioutil.WriteFile(outputPath, jsonBytes.Bytes(), 0644)
	if err != nil {
		log.Fatalf("Couldn't export parsed JSON. Error: %s", err)
	}
}
