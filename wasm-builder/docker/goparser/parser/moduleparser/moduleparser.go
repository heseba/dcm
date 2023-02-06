package moduleparser

import (
	"fmt"
)

func FindModfileAndGetModuleName(directoryPath string) (string, error) {
	modfilePath, err := findModfile(directoryPath)
	if err != nil {
		return "", fmt.Errorf("couldn't find mod file in directory '%s'. Error: %w", directoryPath, err)
	}

	moduleName, err := getModuleName(modfilePath)
	if err != nil {
		return "", fmt.Errorf("couldn't retrieve module name from mod file. Error: %w", err)
	}

	return moduleName, nil
}

func GetModuleInfo(filePath string) (string, error) {
	moduleInfo, err := extractWithListJson(filePath)

	if moduleInfo.ModuleName == "" {
		moduleInfo.ModuleName, err = extractWithModEdit(filePath)
	}

	if err != nil {
		return "", err
	}

	return moduleInfo.ModuleName, nil
}
