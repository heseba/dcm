module webserver

go 1.19

// forward local module
replace codedistribution => ../codedistribution

require (
	codedistribution v0.0.0
	github.com/gorilla/mux v1.8.0
)

require (
	github.com/golang-jwt/jwt/v4 v4.4.2 // indirect
	github.com/gorilla/websocket v1.5.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)
