// A basic HTTP server.
package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	// "github.com/qinains/fastergoding"
	"webserver/middleware"
	"webserver/shared"
)

var (
	host      string = GetEnvString("HOST", "0.0.0.0")
	port      int    = GetEnvInt("SERVERPORT", 8000)
	staticDir string = "./public"
)

func main() {
	// text := []byte("Hello World") // ([]uint8 als Parameter type)
	var text string = "Hello World"
	fmt.Printf("Hashed string: 'Hello World': %v\n", shared.GetHash(text))
	// fmt.Printf("%d\n", shared.ExternalVariable())

	//// pointer references
	// message := "Go"
	// age := 30
	// cash := 10.50
	// old := false
	// country := [3]string{"nigeria", "egypt", "sweden"}
	// myProfile :=  shared.Profile{
	// 	Age:           0,
	// 	Name:          "",
	// 	Salary:        0,
	// 	TechInterest:  false,
	// }
	// fmt.Println("Before function call: ", message, age, cash, old, country, myProfile)
	// // {0  0 false [nigeria egypt swed] {0  0 false}}
	// shared.ModifyBasicTypes(&message, &age, &cash, &old, &country, &myProfile)
	// fmt.Println("After function call: ", message, age, cash, old, country, myProfile)
	// // {90 Golang 50.45 true [nigerian colombian sudanese] {50 Hassan 45.45 false}}

	// fastergoding.Run() // dev server hot reload after saving

	// command line flags: ./webserver -port=8000 -dir=../
	flag.StringVar(&host, "host", host, "hostname")
	flag.IntVar(&port, "port", port, "listen to port")
	flag.StringVar(&staticDir, "dir", staticDir, "directory to serve")
	flag.Parse()

	// use Gorilla's mux Router instead of the default ServeMux
	var router *mux.Router = mux.NewRouter()
	var staticRoute = "/"
	router.StrictSlash(true)
	var fs http.Handler = http.FileServer(http.Dir(staticDir))

	// MIDDLEWARE
	router.Use(middleware.HeadersMiddleware)
	router.Use(middleware.CorsMiddleware("*"))
	router.Use(middleware.WebsocketMiddleware)

	// ROUTES
	router.PathPrefix(staticRoute).Handler(http.StripPrefix(staticRoute, fs)).Methods("GET")

	server := &http.Server{
		// our router
		Handler: router,
		Addr:    fmt.Sprintf("%s:%d", host, port),
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Printf("Serving %s on http://%s:%d%s", staticDir, host, port, staticRoute)
	// "server" can also be nil because ServeMux is the default
	// err := http.ListenAndServe(":"+port, http.FileServer(http.Dir(dir)))
	// if err := http.ListenAndServe(":"+port, server); err != nil {
	// 	log.Fatalln(err)
	// }
	log.Fatal(server.ListenAndServe())
}
