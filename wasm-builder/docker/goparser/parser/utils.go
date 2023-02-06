package parser

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
)

func getAbsolutePath(path string) string {

	var (
		absPath string
		err     error
	)

	if path == "." {
		absPath, err = os.Getwd()
	} else {
		absPath, err = filepath.Abs(path)
	}

	if err != nil {
		log.Fatalf("Could not get absolute path of '%s'", absPath)
	}

	return absPath
}

func concatSlice[T any](first []T, second []T) []T {
	n := len(first)
	return append(first[:n:n], second...)
}

// searches recursivly through all directories for different mod files and returns a array of found paths
func findModfiles(directoryPath string) (paths []string, err error) {

	err = filepath.Walk(directoryPath,
		filepath.WalkFunc(func(filePath string, info os.FileInfo, errIn error) error {
			if errIn != nil {
				return errIn
			}

			// get module name
			if filepath.Ext(filePath) == ".mod" {
				paths = append(paths, filePath)
			}

			return nil
		}))

	if err != nil {
		err = fmt.Errorf("error while parsing for mod files: %s", err)
	} else if len(paths) == 0 {
		err = fmt.Errorf("no mod files found in directory '%s'", directoryPath)
	}

	return
}
