package parser

import (
	"fmt"
	"goparser/godir"
	"goparser/gofile"
	"goparser/parser/moduleparser"
	"goparser/utils"
	"log"
	"path/filepath"
)

func New(targetPath string) Parser {

	return Parser{
		targetPath: getAbsolutePath(targetPath),
	}
}

func (p *Parser) setTargetPath(targetPath string) {
	p.targetPath = targetPath
}

func (p Parser) Parse() {
	isDir, err := utils.IsDirectory(p.targetPath)
	if err != nil {
		log.Fatal(err)
	}

	if isDir {
		goDir := p.parseDirectory()
		// goDir.GoFiles.Print()
		goDir.ExportJSON()

	} else {
		goFile := p.parseFile()
		// goFile.Print()
		goFile.ExportJSON()
	}
}

func (p Parser) parseFile() gofile.GoFile {

	var (
		goFile     gofile.GoFile
		moduleName string = ""
		err        error
	)

	moduleName, err = moduleparser.GetModuleInfo(p.targetPath)
	if err != nil {
		log.Fatal(err)
	}

	goFile, err = gofile.NewGoFile(p.targetPath, moduleName)
	if err != nil {
		log.Fatal(err)
	}

	return goFile
}

func (p Parser) parseDirectory() godir.GoDirectory {

	var (
		goDir      godir.GoDirectory
		moduleName string = ""
		err        error
	)

	modfilePaths, err := findModfiles(p.targetPath)
	if err != nil {
		log.Fatal(err)
	}

	var finalGoDir godir.GoDirectory

	// for each package with a mod file
	for _, modfilePath := range modfilePaths {
		p.setTargetPath(filepath.Dir(modfilePath))

		moduleName, err = moduleparser.FindModfileAndGetModuleName(p.targetPath)
		// try another way to get it
		if err != nil {
			fmt.Printf("%s\nSwitching to fallback method.\n", err.Error())
			moduleName, err = moduleparser.GetModuleInfo(p.targetPath)
			if err != nil {
				log.Fatalf("Fallback method failed as well. Error: %s\n", err.Error())
			}
		}

		goDir, err = godir.NewDir(p.targetPath, moduleName)
		if err != nil {
			log.Fatalf(err.Error())
		}

		/**
		* godir.ModuleName and godir.ProjectRoot will be ignored in the json export, these values will be set to the last package found.
		* we are only interested in the go files, otherwise we might create an array of packages, collect all found godir and rewrite the exportJSON function
		 */
		finalGoDir.GoFiles = concatSlice(finalGoDir.GoFiles, goDir.GoFiles)
	}

	return finalGoDir
}
