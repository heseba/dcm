package middleware

import (
	"net/http"
	"strings"
)

// Prepares HTTP headers for each request
//  disables cache and set content-type for wasm
func HeadersMiddleware(next http.Handler) http.Handler {
	var headerHandler http.HandlerFunc = func(res http.ResponseWriter, req *http.Request) {
		// only for development
		res.Header().Add("Cache-Control", "no-cache")
		if strings.HasSuffix(req.URL.Path, ".wasm") {
			res.Header().Set("content-type", "application/wasm")
		}
		contentType := req.Header.Get("Content-Type")
		if contentType != "" {
			println(contentType)
		}

		// Call the next handler, which can be another middleware in the chain, or the final handler.
		next.ServeHTTP(res, req)
	}

	return http.HandlerFunc(headerHandler)
}
