package app

type appConfig struct {
	Options
	TargetPath string
}

type Options struct {
	ExportedOnly bool
	Minify       bool
	Comments     bool
	Output       string
}
