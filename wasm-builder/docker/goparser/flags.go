package main

import (
	"flag"
	"fmt"
	"os"
	"sort"
)

type Flag struct {
	alias []string
	usage string
	ftype string
}
type Flags []Flag

func (flag *Flag) addAlias(alias string) {
	flag.alias = append(flag.alias, alias)
	flag.sortAliasStringByLength()
}

func (flag Flag) sortAliasStringByLength() {
	sort.Slice(flag.alias, func(i, j int) bool {
		return len(flag.alias[i]) < len(flag.alias[j])
	})
}

// check if a given usage string is already in our array of flags
func (flags Flags) contains(usage string) bool {
	for _, flag := range flags {
		if flag.usage == usage {
			return true
		}
	}

	return false
}

// search through our flags and compare it against the given usage string
func (flags Flags) getByUsage(usage string) *Flag {
	for i, flag := range flags {
		if flag.usage == usage {
			return &flags[i]
		}
	}

	return nil
}

// prints our parsed flags to the console
func (flags Flags) print() {

	for _, flag := range flags {
		var flagString string = ""

		for i, a := range flag.alias {
			if i == 0 {
				flagString = flagString + fmt.Sprintf("-%s", a)
			} else {
				flagString = flagString + fmt.Sprintf("--%s", a)
			}

			if i < len(flag.alias)-1 {
				flagString = flagString + ","
			}
		}

		fmt.Printf("\t%s\t%s\t\t%s\n", flagString, flag.ftype, flag.usage)
	}
}

// returns the type of a given CLI parameter
func getFlagType(f *flag.Flag) string {
	ftype, _ := flag.UnquoteUsage(f)
	// flag package is leaving this empty when it's a boolean ¯\_(ツ)_/¯
	if ftype == "" {
		ftype = "bool"
	}
	return ftype
}

// Prints command line options (basically flag.Usage() but customized)
var printCommandlineUsage = func() {
	var flags Flags
	fmt.Fprintf(os.Stderr, "Usage of %s:\n", os.Args[0])
	// flag.PrintDefaults()

	flag.VisitAll(func(f *flag.Flag) {

		// new flag
		if !flags.contains(f.Usage) {
			var newFlag Flag = Flag{}
			newFlag.alias = []string{f.Name}
			newFlag.usage = f.Usage
			newFlag.ftype = getFlagType(f)
			flags = append(flags, newFlag)
		} else {
			// existing, look for shorthand notation
			flag := flags.getByUsage(f.Usage)
			flag.addAlias(f.Name)
		}

	})

	flags.print()
}
