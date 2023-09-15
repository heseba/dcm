package api

import (
	"codedistribution/global"
	"codedistribution/models"
	"codedistribution/util"
	"net/http"
)

// check if it's a GET or POST request
func isValidRequestMethod(req *http.Request, validRequestMethods []string) bool {
	// dumpRequest(req)
	return util.IsStringInSlice(validRequestMethods[:], req.Method)
}

func ValidateApiKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		if !util.IsStringInSlice(global.GetConfig().API_KEYS, req.Header.Get("Authorization")) {
			var errorMsg models.JsonResponse = models.JsonResponse{
				Error: &models.JsonError{
					Code:    http.StatusBadRequest,
					Message: http.StatusText(http.StatusBadRequest),
				},
			}

			errorMsg.Send(res)

			req.Body.Close()
			return
		}

		next.ServeHTTP(res, req)

		// Running after handler
	})
}

func ValidateRequestMethodMiddleware(validRequestMethods []string) util.Middleware {
	// Create a new Middleware
	return func(next http.Handler) http.Handler {
		// Define the http.HandlerFunc
		return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

			if !isValidRequestMethod(req, validRequestMethods) {
				var errorMsg models.JsonResponse = models.JsonResponse{
					Error: &models.JsonError{
						Code:    http.StatusMethodNotAllowed,
						Message: http.StatusText(http.StatusMethodNotAllowed),
					},
				}

				errorMsg.Send(res)

				req.Body.Close()
				return
			}

			next.ServeHTTP(res, req)

			// Running after handler
		})
	}
}
