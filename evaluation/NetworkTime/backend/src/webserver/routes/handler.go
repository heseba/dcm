package routes

import (
	"html/template"
	"net/http"
	"path"
	"webserver/app"
)

func RouteHandler(route Route) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		baseTemplate := path.Join(app.Config.TemplateSettings.TemplateDir, "/base.html")
		var templ *template.Template = template.Must(template.ParseFiles(baseTemplate, route.TemplateFile))

		templ.Execute(res, route.TemplateVariables)
	})
}
