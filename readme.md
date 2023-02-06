# DCM: Dynamic Client-Server Code Migration

This is the online appendix for the following paper submission:

Heil, S., Gaedke, M.: DCM: Dynamic Client-Server Code Migration. Submitted to 23rd International Conference on Web Engineering, ICWE 2023.


The repository contains the DCM infrastructure implemented in Go, the evaluation projects and scripts in the following repository structure:

- `wasm-builder` the DCM infrastructure for compiling code fragments
- `project` a sample project that can be used with the DCM infrastructure, containing
  - `project/backend/src/codedistribution` the DCM runtime infrastructure
  - `project/backend/src/codedistribution` a sample web shop application showcasing the integration of DCM into web applications
- `evaluation` the evaluation and data containing
  - `evaluation/GenerationTime` samples and scripts used for scenario I
  - `evaluation/NetworkTime` samples and scripts used for scenario II
  - `evaluation/ExecutionTime` samples and scripts used for scenario III
  - `evaluation/measurements` the raw evaluation data

To enable easy replication, we are using Docker. Follow the instructions below and in the readme files in the subdirectories to try it out yourself.

# How to use

> The WASM-Builder and your project are required to use the same Go version in order to use Go plugins.

The runtime needs to be the same. The package version of the packages used inside the Go plugins are required to be the same like currently installed. Update the Go version of the Go image correspondingly.

## 1. Build wasm-builder image

`cd ./wasm-builder`

**build image (takes ~40s):**  
`docker-compose build --no-cache build_current`  
**>> for older docker version**  
`docker-compose -f ./docker-compose.old.yaml build --no-cache build_current`

clear dangling images afterwards:  
`docker rmi $(docker images -q -f "dangling=true" -f "label=autodelete=true")`

## 2. Build wasm files with the wasm-builder image

`cd ../project`

Adjust environment variables inside the docker-compose file - **this is already done**.  
The environment variable paths are relative to the path which you mount into the `/usr/app` directory. The mounted directory should have read, write and execute permissions for user,group and others before it gets mounted. (`chmod 777 <hostPath>`)

```yml
build-wasm:
  image: asenger/wasm-builder:<version>
  environment:
    - CFD=<path/to/cdf/file>
    - WWW=<path/to/public/folder>
    - PLUGINS=<path/to/codedistribution>
  working_dir: /usr/app
  volumes:
    - <hostPath>:/usr/app
  entrypoint: wasmbuilder
  command: all
```

**create wasm files**  
`docker-compose run --rm build-wasm`  
**>> for older docker version**  
`docker-compose -f ./docker-compose.old.yaml run --rm build-wasm`

## 3. Start Go web server

**start Go web server**  
`docker-compose run --rm --service-ports go-server`  
**>> for older docker version**  
`docker-compose -f ./docker-compose.old.yaml run --rm --service-ports go-server`

Navigate to the URL as prompted in the console.

# Acknowledgement
We would like to thank Alexander Senger as main contributor to the proof-of-concept implementation of the DCM architecture and the evaluation expriments.
