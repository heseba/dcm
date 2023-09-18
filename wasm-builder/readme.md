# WASM-Builder

There are two ways to use this wasm-builder. Either the regular way by installing all required dependencies or by using Docker. Docker however is recommended since it's simple plug'n'play.

As of Go v1.17.0, Go plugins are only supported for Linux, FreeBSD, and macOS. [[ref](https://pkg.go.dev/plugin@go1.19#:~:text=cannot%20be%20closed.-,Currently%20plugins%20are%20only%20supported%20on%20Linux%2C%20FreeBSD%2C%20and%20macOS.%20Please%20report%20any%20issues.,-Index%20%C2%B6)]

- [WASM-Builder](#wasm-builder)
  - [CFD Schema/Structure](#cfd-schemastructure)
  - [Docker Usage (recommended)](#docker-usage-recommended)
  - [Regular Usage](#regular-usage)
    - [1. Generate GoParser JSON export](#1-generate-goparser-json-export)
    - [2. Generate GO Modules](#2-generate-go-modules)
    - [3. Generate WASM and Plugin Modules](#3-generate-wasm-and-plugin-modules)
  - [Building the image](#building-the-image)
  - [Wasm-Builder development](#wasm-builder-development)
  - [Testing the image](#testing-the-image)

## CFD Schema/Structure

This file needs to be placed in the project root directory. Usually where your go.mod file is located.  
Line numbers are needed when two fragments with the same name in a file exists. Commonly for interfaces on different structs e.g. `func (c Circle) Area() vs. func (r Rectangle) Area()`. This can be bypassed by linking the struct type definition with the interface method via the dependsOn array property.  
Libraries with an alias are separated by one space. [alias libpath].

```yml
fragments: [array]
  - id: xyz [string]
    name: zyx [string|optional]
    globalVar: false [boolean|optional]
    typeDef: false [boolean|optional]
    runOn: ("client"|"server") [string|optional]
    location: [object]
      filepath: 'path/to/file' [string]
      start: 1 [int|optional]
      end: 15 [int|optional]
    libs: [array<string>|optional]
      - fmt
      - crypto/sha256
      - encoding/hex
    dependsOn: [array<string>|optional]
      - foo
      - bar
```

`id` is the unique identifier of the fragment, and is also used as the name of the generated JavaScript function. If the fragment is callable from JavaScript then the ID should meet the requirements of JavaScript function calls. `name` can be specified if the name of the source Go function is different from the ID, or if left unspecified it defaults to the value of `id`.

## Docker Usage (recommended)

Make sure that the Docker image version of the Go container matches with the application's Go version where the plugins should be executed. (editable in the .env file)  
Otherwise it is likely that this problem will appear:

> plugin was built with a different version of package

The reason behind this is that the packages used inside the compiled plugin files have different versions in comparison to the running application version when a different Go version is used. Go updates its package regularly.
The easiest fix would be to set the container image version of the wasm-builder to match your application.

**Environment Variables:**

When using the image, pass these as environment variables.
The environment variable paths are relative to the path which you mount into the `/usr/app` directory.

| ENV VAR       | meaning                              |
| ------------- | ------------------------------------ |
| CFD           | path to Code-Fragment-Description    |
| WWW           | path to webserver public directory   |
| PLUGINS       | path to codedistributor directory    |
| FUNCTIONS     | path to webserver js functions file  |
| WSPATH        | URL prefix of websocket              |
| APIPATH       | URL prefix of codedistributor API    |
| MAXRECONNECTS | number of maximum reconnect attempts |

The easiest way is to create a env_file e.g. 'project.env' and pass the file in docker-compose:

```yaml
services:
  project:
    env_file: project.env
```

or instead pass the environment variables through the environment property inside the docker-compose file:

```yaml
services:
  project:
    environment:
      - CFD=path/to/codeFragmentDescription
      - WWW=path/to/public/directory
      - PLUGINS=path/to/codedistribution
        ...
```

**Base docker-compose configuration:**

It's important to go into the directory where your code is mounted (`/usr/app`).
Adjust the `<...>` marked places. Mount your directory into the `/usr/app` directory inside the container.

Make sure that your mounted directory has read, write and execute permissions for user,group and others before it gets mounted. (`chmod 777 <hostPath>`)

```yaml
build-wasm:
  env_file: project.env
  image: sebastianheil/wasm-builder:<version>
  working_dir: /usr/app
  volumes:
    - <hostPath>:/usr/app
  entrypoint: wasmbuilder
  command: all
```

And then execute: `docker-compose run --rm build-wasm <build-options>`

**build-options (select one)**:  
`all` - **default** - clean + build  
`build` - compile wasm and plugins + copy js glue code  
`compile-wasm` - compile wasm  
`compile-plugin` - compile plugins  
`glue` - copy js glue code  
`clean` - clean up all generated files  
`clean-wasm` - clean up wasm files  
`clean-plugin` - clean up plugin files

## Regular Usage

**Requirements**:

- Linux System with **Make** package installed (`sudo apt-get install make`)
- [NodeJS](https://nodejs.org/en/) (v16.17.0 or higher)
- [Go](https://go.dev) (v1.17.0 or higher)
- ~~[Tinygo](https://tinygo.org/) (v0.22.0 or higher)~~

Install **GoParser**

- go to `docker/goparser`
- `go install .`

Install **js-yaml**:

- globally `npm i -g js-yaml`
- or locally navigate to `docker/wasmbuilder` and execute `npm i`.

### 1. Generate GoParser JSON export

Since the goparser is now globally installed you can execute it:

`goparser -p <path>`

**mandatory**:  
`-p | --path` - specify the path of your GO source code which should be scanned. (go.mod file in root is required)  
**optional**:  
`-o | --output` - **default: ./tmp** - specify the output directory for the JSON export (don't forget to specify this output file in step 2 when you did this)  
`-m | --minify` - **default: false** - enable minification of the JSON export  
`-c | --comments` - **default: false** - include comments when exporting code

### 2. Generate GO Modules

With the export from the goparser we can now generate temporary GO files which get compiled into WASM and GO plugins:

`node index.js <optional>`

**optional**:  
`-cfd | --codefragmentdescription` - **default: current directory** - Specify the path of your Code-Fragment-Description file.  
`-e | --export` - **default: ./tmp** - define the path to the JSON file export of the GoParser
`-t | --temp` - **default: ./tmp/gotemp** - define output directory for your temporary go files (don't forget to specify the custom directory in step 3 when you did this)  
`-p | --plugins` - **default: ./tmp/plugintemp** - define output directory for your temporary plugin files (don't forget to specify the custom directory in step 3 when you did this)

print help: `node index.js -h`

### 3. Generate WASM and Plugin Modules

With the generated temporary GO files we can now compile them into WASM and GO plugins:

`make WWW=<path/to/directory> <optional> <build-options>`

**mandatory**:  
`WWW=<path/to/directory>` - path to your public directory where the WASM files should be served.  
**optional**:  
`GOSRC=<path/to/directory>` - **default: ./tmp/gotemp** - path to your parsed GO modules (if you parsed the files in step 1 in a custom directory, you have to provide this parameter)  
`PLUGINSRC=<path/to/directory>` - **default: ./tmp/plugintemp** - path to your parsed plugin files (if you parsed the files in step 1 in a custom directory, you have to provide this parameter)
**build-options (select one)**:  
`all` - **default** - clean + build  
`build` - compile wasm and plugins + copy js glue code  
`compile-wasm` - compile wasm  
`compile-plugin` - compile plugins  
`glue` - copy js glue code  
`clean` - clean up all generated files  
`clean-wasm` - clean up wasm files  
`clean-plugin` - clean up plugin files

## Building the image

**build image (takes ~15s):**  
`docker-compose build --no-cache`

clear dangling images when you rebuild (if you rebuild the image, the old image will lose its Tag and get `<none>` instead, this command clears them):  
`docker rmi $(docker images -q -f "dangling=true" -f "label=autodelete=true")`

**Note when using Tinygo**  
If Tinygo docker image is not working, try to clone the git repo, checkout dev branch and build the image yourself: `docker build -t "tinygo/dev:<version>" .`

Or change the docker image inside the Dockerfile. The dev image might be working when the master is failing:
master docker: https://hub.docker.com/r/tinygo/tinygo
development: https://hub.docker.com/r/tinygo/tinygo-dev

## Wasm-Builder development

<!-- docker-compose run ignores ports, unless --service-ports -->

**dev for wasm-builder:**  
`docker-compose run --rm --service-ports dev`

**check docker-compose configuration:**  
`docker-compose config`

--

**for devcontainer:**

Execute `wasmbuilder` from `/usr/app` directory.

## Testing the image

**testing the image with testdata:**  
`docker-compose run --rm test-image <build-options>`

**build-options (select one)**:  
`all` - **default** - clean + build  
`build` - compile wasm and plugins + copy js glue code  
`compile-wasm` - compile wasm  
`compile-plugin` - compile plugins  
`glue` - copy js glue code  
`clean` - clean up all generated files  
`clean-wasm` - clean up wasm files  
`clean-plugin` - clean up plugin files
