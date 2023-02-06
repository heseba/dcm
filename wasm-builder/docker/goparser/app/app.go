package app

var Config appConfig

func New(path string, args ...Options) appConfig {
	var options Options
	var app appConfig

	// passed config params where spread into an array
	if len(args) > 0 {
		options = args[0]

		app = appConfig{
			TargetPath: path,
			Options:    options,
		}

	} else {
		// default
		app = appConfig{
			TargetPath: path,
			Options: Options{
				ExportedOnly: false,
				Minify:       false,
				Comments:     false,
				Output:       ".",
			},
		}
	}

	Config = app

	return app
}
