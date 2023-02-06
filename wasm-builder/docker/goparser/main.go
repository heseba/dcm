package main

import (
	"flag"
	"fmt"
	"goparser/app"
	"goparser/parser"
	"os"
)

var (
	path     string = ""
	output   string = "./tmp"
	minify   bool   = false
	comments bool   = false
)

func main() {
	// command line flags: ./webserver -port=8000 -dir=../

	flag.StringVar(&path, "path", path, "dir or file to parse")
	flag.StringVar(&path, "p", path, "dir or file to parse")
	flag.StringVar(&output, "output", output, "output path")
	flag.StringVar(&output, "o", output, "output path")
	flag.BoolVar(&minify, "m", minify, "minify the parsed JSON file")
	flag.BoolVar(&minify, "minify", minify, "minify the parsed JSON file")
	flag.BoolVar(&comments, "c", comments, "keep comments when exporting code")
	flag.BoolVar(&comments, "comments", comments, "keep comments when exporting code")
	flag.Usage = printCommandlineUsage
	flag.Parse()

	if path == "" {
		fmt.Printf("%v\n", "Missing path. Please pass the CLI parameter.")
		flag.Usage()
		os.Exit(1)
	}

	// global configs
	app.New(path, app.Options{
		ExportedOnly: false,
		Minify:       minify,
		Output:       output,
		Comments:     comments,
	})

	parser.New(app.Config.TargetPath).Parse()
}
