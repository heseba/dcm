package godir

import "goparser/gofile"

type GoFiles []gofile.GoFile

type GoDirectory struct {
	ModuleName  string `json:"-"` //ignore on json export
	ProjectRoot string `json:"-"` //ignore on json export
	GoFiles     GoFiles
}
