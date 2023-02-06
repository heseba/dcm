package godir

import (
	"fmt"
	"goparser/gofile"
	"os"
	"path/filepath"
)

func (gd GoDirectory) parseGoFiles(directoryPath string) (GoFiles, error) {

	var goFiles GoFiles

	err := filepath.Walk(directoryPath,
		func(filePath string, info os.FileInfo, err error) error {
			if err != nil {
				return fmt.Errorf("parseGoFiles: %w", err)
			}

			// skip directories and modfile and empty files
			if !info.IsDir() &&
				!(info.Size() == 0) && filepath.Ext(filePath) == ".go" {
				var goFile gofile.GoFile
				goFile, err = gofile.NewGoFile(filePath, gd.ModuleName)
				if err != nil {
					return fmt.Errorf("parseGoFiles: %w", err)
				}
				goFiles.add(goFile)
			}

			return nil
		})
	if err != nil {
		return goFiles, err
	}

	return goFiles, nil
}

func (goFiles GoFiles) Print() {
	for _, goFile := range goFiles {
		goFile.Print()
	}
}
func (goFiles *GoFiles) add(goF gofile.GoFile) {
	*goFiles = append(*goFiles, goF)
}
