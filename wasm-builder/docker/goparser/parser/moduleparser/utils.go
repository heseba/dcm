package moduleparser

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"

	"golang.org/x/mod/modfile"
)

// searches recursivly through all directories for a modfile and returns the path if found
func findModfile(directoryPath string) (path string, err error) {

	err = filepath.Walk(directoryPath,
		filepath.WalkFunc(func(filePath string, info os.FileInfo, errIn error) error {
			if errIn != nil {
				return errIn
			}

			// get module name
			if filepath.Ext(filePath) == ".mod" {
				path = filePath

				// early exit when found
				return io.EOF
			}

			return nil
		}))

	if err == io.EOF {
		err = nil
	} else if err == nil {
		err = fmt.Errorf("mod file not found")
	}

	return
}

func getModFile(filePath string) (*modfile.File, error) {

	fileBytes, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	modFile, err := modfile.Parse(filePath, fileBytes, nil)
	if err != nil {
		return nil, err
	}

	return modFile, nil
}

func getModuleName(filePath string) (string, error) {

	modFile, err := getModFile(filePath)
	if err != nil {
		return "", err
	}

	return modFile.Module.Mod.Path, nil
}

// https://pkg.go.dev/cmd/go/internal/list#pkg-variables
func extractWithListJson(fileOrDirPath string) (ModuleInfo, error) {
	var moduleInfo ModuleInfo

	var (
		out    bytes.Buffer
		stderr bytes.Buffer
	)
	program := "go"
	args := []string{program, "list", "-json"}
	// args := []string{program, "list", "-f", "{{.ImportPath}},{{.Module.Path}}"}
	// -m flag causes list to list modules instead of packages
	// -json flag causes the package data to be printed in JSON format instead of using the template format

	cmd := exec.Command(program)
	cmd.Args = args
	cmd.Dir = path.Dir(fileOrDirPath)
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return moduleInfo, errors.New(stderr.String())
	}

	var pkg Package
	err = json.Unmarshal(out.Bytes(), &pkg)
	if err != nil {
		return moduleInfo, errors.New(stderr.String())
	}

	moduleInfo.ImportPath = pkg.ImportPath
	if pkg.Module == nil {
		moduleInfo.ModuleName = pkg.Name
	} else {
		moduleInfo.ModuleName = pkg.Module.Path
	}

	// when working without types
	// re := regexp.MustCompile(`\r?\n`)
	// input := re.ReplaceAllString(out.String(), "")
	// outArr := strings.Split(input, ",")
	// moduleInfo.ImportPath = outArr[0]
	// moduleInfo.ModuleName = outArr[1]

	return moduleInfo, nil
}

func extractWithModEdit(fileOrDirPath string) (string, error) {

	var (
		out    bytes.Buffer
		stderr bytes.Buffer
	)
	program := "go"
	args := []string{program, "mod", "edit", "-json"}
	// args := []string{program, "list", "-f", "{{.ImportPath}},{{.Module.Path}}"}

	cmd := exec.Command(program)
	cmd.Args = args
	cmd.Dir = path.Dir(fileOrDirPath)
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", errors.New(stderr.String())
	}

	var pkg GoMod
	err = json.Unmarshal(out.Bytes(), &pkg)
	if err != nil {
		return "", errors.New(stderr.String())
	}
	return pkg.Module.Path, nil
}
