package godir

import (
	"bytes"
	"encoding/json"
	"fmt"
	"goparser/app"
	"goparser/utils"
	"io/ioutil"
	"log"
	"path"
)

func NewDir(directoryPath string, moduleName string) (GoDirectory, error) {
	var goDir GoDirectory
	var err error

	goDir.ModuleName = moduleName
	// NOTE assume that the selected directory is the root, currently this is not used
	goDir.ProjectRoot = path.Base(directoryPath)

	goDir.GoFiles, err = goDir.parseGoFiles(directoryPath)
	if err != nil {
		return goDir, err
	}

	return goDir, nil
}

func (gd GoDirectory) Print() {
	fmt.Printf("%#v\n", gd)
}

func (gd *GoDirectory) ExportJSON() {
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
	err := jsonEncoder.Encode(gd)
	if err != nil {
		log.Fatal(err)
	}

	err = ioutil.WriteFile(outputPath, jsonBytes.Bytes(), 0644)
	if err != nil {
		log.Fatalf("Couldn't export parsed JSON. Error: %s", err)
	}
}
