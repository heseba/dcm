# Evaluation

Various WebSocket connection measurements. Working with JS Date API may be not precise enough but there is no way to calculate differences between unix UTC timestamps from the server and mix it with JS performance API.
When calculating client -> server, server -> client negative values can come up. This is due to the different internal clocks on bith devices which would need to be synched when timestamps are getting created.

- WebSocket Ping Pong
- Initial WebSocket connection + first fragment list update
- Time between API and client

## Docker-Compose

**build WASM files:**

`docker-compose run --rm build-wasm`

**start Go web server:**

`docker-compose up go-server`

**after testing is done:**

`docker-compose down`

**for development start project in container:**

<!-- pass service port so that the container exposes the passed ports automatically  -->

`docker-compose run --rm --service-ports go-network-dev`
