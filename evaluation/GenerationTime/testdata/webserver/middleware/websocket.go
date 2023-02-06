package middleware

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

func dumpRequest(req *http.Request) {
	requestDump, err := httputil.DumpRequest(req, true)
	if err != nil {
		fmt.Print(err)
	}
	fmt.Print(string(requestDump))
}

// checks if it's the /ws route and Upgrade Header
func isWebSocketRequest(req *http.Request) bool {
	if req.Header.Get("Connection") == "Upgrade" && req.Header.Get("Upgrade") == "websocket" {
		return true
	}
	return false
}

func isWebSocketRoute(req *http.Request) bool {
	return strings.HasPrefix(req.RequestURI, "/ws")
}

// checks if the request contains the right token
func isAuthorized(req *http.Request) bool {
	token := "good-token"
	bearerToken := "bearer " + token
	authorizationHeader := req.Header.Get("Authorization")

	if authorizationHeader == bearerToken {
		return true
	}

	if authorizationHeader == "" {
		log.Print("No authorization token passed.")
	} else {
		log.Printf("Bad authorization token passed: %s", authorizationHeader)
	}

	return false
}

// check if it's a GET or POST request
func isValidRequestMethod(req *http.Request) bool {
	validRequestTypes := [...]string{"GET", "POST"}
	return contains(validRequestTypes[:], req.Method)
}

// contains checks if a string is present in a slice
func contains(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

func WebsocketMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		// continue with other routes, we are still a middleware
		if !isWebSocketRoute(req) {
			next.ServeHTTP(res, req)
			return
		}

		// check if it's a websocket upgrade request, otherwise maybe folder
		if !isWebSocketRequest(req) {
			// dumpRequest(req)

			// stop the request chain here, this is reserved for websockets
			res.WriteHeader(http.StatusBadRequest)
			res.Write([]byte("400 - Bad WebSocket Request"))
			// req.Body.Close() // Server will close the request body automatically if body is empty

			// if you want to serve any /ws directory in public folder, go ahead and comment the above out -> next.ServeHTTP(res, req)
			return
		}

		if !isAuthorized(req) && !isValidRequestMethod(req) {
			res.WriteHeader(http.StatusForbidden)
			// req.Body.Close()
			return
		}

		websocketHandler(res, req)
	})
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:   1024,
	WriteBufferSize:  1024,
	HandshakeTimeout: 5 * time.Second,
	CheckOrigin: func(req *http.Request) bool {
		// allow all connection requests for development purposes
		return true
	},
}

func websocketHandler(res http.ResponseWriter, req *http.Request) {
	var (
		conn          *websocket.Conn
		err           error
		messageType   int
		msg           []byte // message recieved from client
		customMessage []byte
	)

	// setting subprotocols, multiple possible
	// https://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
	// var header http.Header = http.Header{}
	// header["Sec-WebSocket-Protocol"] = []string{"wamp"}

	conn, err = upgrader.Upgrade(res, req, nil)
	if err != nil {
		log.Printf("Error while upgrading: %v", err)
		return
	}

	defer conn.Close()

	// infinite loop
	for {
		if messageType, msg, err = conn.ReadMessage(); err != nil {
			// go here if an error happens while receiving messages
			log.Println("read:", err)
			break
		}

		log.Printf("recv: %s", msg)

		customMessage = []byte("got the message!")
		if err = conn.WriteMessage(messageType, customMessage); err != nil {
			// go here if an error happens while sending messages
			log.Println("write:", err)
			break
		}
	}
}
