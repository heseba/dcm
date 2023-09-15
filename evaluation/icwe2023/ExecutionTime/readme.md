# Evaluation

In order to execute the tests one have to build WASM files first and start the web server afterwards.
The time values depends on the amount of files to process. If the compiler has nothing to process, the times will be faster accordingly.

Results will be printed in the browser console.

## Docker-Compose

**build WASM files:**

`docker-compose run --rm build-wasm`

**start Go web server:**

`docker-compose up go-server`

**after testing is done:**

`docker-compose down`

**for development start project in container:**

<!-- pass service port so that the container exposes the passed ports automatically  -->

`docker-compose run --rm --service-ports go-exec-dev`
