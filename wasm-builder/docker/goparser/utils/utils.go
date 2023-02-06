package utils

import (
	"os"
	"path/filepath"
)

// checks if the given path is a directory and if the directory exists
func IsDirectory(path string) (bool, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return false, err
	}

	return fileInfo.IsDir(), err
}

func EnsureDir(path string) error {
	ext := filepath.Ext(path)
	if ext != "" {
		path = filepath.Dir(path)
	}

	err := os.MkdirAll(path, os.ModeDir)

	if err == nil || os.IsExist(err) {
		return nil
	} else {
		return err
	}
}

func Contains[T comparable](e T, s []T) bool {
	for _, v := range s {
		if v == e {
			return true
		}
	}
	return false
}
