package gofile

import (
	"go/ast"
	"go/parser"
	"go/token"
)

var Modes map[int]parser.Mode = map[int]parser.Mode{
	0: 0, // everything
	1: parser.PackageClauseOnly,
	2: parser.ImportsOnly,          // stop parsing after import declarations
	3: parser.ParseComments,        // parse comments and add them to AST
	4: parser.Trace,                // print a trace of parsed productions
	5: parser.DeclarationErrors,    // report declaration errors
	6: parser.SpuriousErrors,       // same as AllErrors, for backward-compatibility
	7: parser.SkipObjectResolution, // don't resolve identifiers to objects - see ParseFile
	8: parser.AllErrors,            // report all errors (not just the first 10 on different lines)
}

type GoFile struct {
	FileSet            *token.FileSet     `json:"-"` //ignore on json export
	File               *ast.File          `json:"-"` //ignore on json export
	ModuleName         string             `json:"module_name"`
	AbsoluteFilepath   string             `json:"abs_filepath"`
	RelativeFilepath   string             `json:"rel_filepath"`
	Imports            PackageImports     `json:"imports"`
	Libraries          Libraries          `json:"libraries"`
	GoFunctionList     GoFunctionList     `json:"functions"`
	GlobalVariableList GlobalVariableList `json:"global_variables"`
	TypeDefinitionList TypeDefinitionList `json:"type_definitions"`
}

type Import struct {
	Name  string `json:"name"`
	Alias string `json:"alias"`
	Local bool   `json:"local"` // determines if the import is from our module
}

type Libraries []Library
type Library Import

type PackageImports []PackageImport
type PackageImport Import

type Parameter struct {
	Name       string `json:"name"`
	ParamType  string `json:"type"`
	IsVariadic bool   `json:"is_variadic"`
}

type InterfaceParameterList []InterfaceParameter
type InterfaceParameter Parameter

type GenericTypeParameterList []GenericTypeParameter
type GenericTypeParameter Parameter

type FunctionParameterList []FunctionParameter
type FunctionParameter Parameter

type ReturnParameterList []ReturnParameter
type ReturnParameter Parameter

type Location struct {
	PackageName  string `json:"package_name"`
	AbsolutePath string `json:"abs_dirpath"`
	RelativePath string `json:"rel_dirpath"`
	Filename     string `json:"filename"`
	LineStart    int    `json:"line_start"`
	LineEnd      int    `json:"line_end"`
}

type GoFunctionList []FunctionDeclaration

// functions and interfaces
type FunctionDeclaration struct {
	AstNode                *ast.FuncDecl          `json:"-"` //ignore on json export
	Name                   string                 `json:"name"`
	Location               Location               `json:"location"`
	Imports                PackageImports         `json:"imports"`
	Libraries              Libraries              `json:"libraries"`
	Code                   string                 `json:"code"`
	IsExported             bool                   `json:"is_exported"`
	IsInterface            bool                   `json:"is_interface"`
	InterfaceParameterList InterfaceParameterList `json:"interface_parameter_list"`

	NumberOfGenericTypeParameters int                      `json:"num_of_type_parameters"`
	GenericTypeParameterList      GenericTypeParameterList `json:"type_parameter_list"`

	NumberOfFunctionParameters int                   `json:"num_of_parameters"`
	FunctionParameterList      FunctionParameterList `json:"parameter_list"`

	NumberOfReturnParameters int                 `json:"num_of_return_values"`
	ReturnParameterList      ReturnParameterList `json:"return_values_list"`
}

type GlobalVariableList []ValueSpecification

// var and const
type ValueSpecification struct {
	Token      string         `json:"token"` // const || var
	Name       string         `json:"name"`
	Vtype      string         `json:"type"`
	IsExported bool           `json:"is_exported"`
	Libraries  Libraries      `json:"libraries"`
	Location   Location       `json:"location"`
	Imports    PackageImports `json:"imports"`
	Code       string         `json:"code"`
	Value      interface{}    `json:"value"`
}

type TypeDefinitionList []TypeSpecification
type TypeSpecification struct {
	Name       string         `json:"name"`
	Ttype      string         `json:"type"`
	Location   Location       `json:"location"`
	Imports    PackageImports `json:"imports"`
	Libraries  Libraries      `json:"libraries"`
	IsExported bool           `json:"is_exported"`
	Code       string         `json:"code"`
}
