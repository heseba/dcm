package gofile

import "fmt"

func (libs Libraries) Print() {
	if len(libs) == 0 {
		fmt.Printf("\tLibraries: none\n")
	} else {
		fmt.Printf("\tLibraries: [")
		for i, lib := range libs {
			lib.Print()
			if i < len(libs)-1 {
				fmt.Printf(", ")
			}
		}
		fmt.Printf("]\n")
	}
}

func (lib Library) Print() {
	if lib.Alias == "" {
		fmt.Printf("\"%s\"", lib.Name)
		return
	}
	fmt.Printf("\"%s %s\"", lib.Alias, lib.Name)
}

func (libs Libraries) PrintInfo() {

	if len(libs) == 0 {
		fmt.Println("No libraries in use.")
		return
	}

	for _, lib := range libs {
		lib.PrintInfo()
	}
}

func (lib Library) PrintInfo() {
	fmt.Printf("%v\n", "====== LIBRARY ======")

	if lib.Alias == "" {
		fmt.Println("\talias: none")
	} else {
		fmt.Printf("\talias: %s\n", lib.Alias)
	}

	fmt.Printf("\tLibrary: %s\n", lib.Name)
}
