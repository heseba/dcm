package middleware

import (
	"net/http"
	"strings"
)

// Prepares HTTP headers for each request
func HeaderMiddleware(next http.Handler) http.Handler {
	var prepareHeaderHandler http.HandlerFunc = func(res http.ResponseWriter, req *http.Request) {

		// only for development, disables cache and set content-type for wasm.
		// res.Header().Add("Cache-Control", "no-cache")

		if strings.HasSuffix(req.URL.Path, ".wasm") {
			res.Header().Set("content-type", "application/wasm")
		}

		// Call the next handler, which can be another middleware in the chain, or the final handler.
		next.ServeHTTP(res, req)
	}

	return http.HandlerFunc(prepareHeaderHandler)
}
