# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
Added       for new features.
Changed     for changes in existing functionality.
Deprecated  for soon-to-be removed features.
Removed     for now removed features.
Fixed       for any bug fixes.
Security in case of vulnerabilities.
 -->

## [Unreleased]

## [0.0.15] - 2022-08-21

### Changed

- upgrading to Go v1.19.0

## [0.0.14] - 2022-08-03

### Changed

- improve variable naming to be more inline with the overall data model

### Fixed

- importing libraries with an import alias

## [0.0.13] - 2022-06-25

### Added

- TypeParameter list for future GO 1.18 generic functions
- support local imports (imports from our own module like type definitions, functions ...)

### Changed

- Plugins in GO now try to mimic the structure of JS Errors when returning e.g.

```js
{
  message: "",
  stack: "",
}
```

### Fixed

- Indentation in WASM Go Code
- Empty string check on fragmentCode instead of undefined
- It now continues to search for typeDef or globalVar if it couldn't find a function with the provided name in the codebase

## [0.0.12] - 2022-06-19

### Changed

- improved hints when YAML file has wrong properties e.g.
  - "runon" => did you mean 'runOn'?
  - "depends" => did you mean 'dependsOn'?
  - "lib" => did you mean 'libs'?

## [0.0.11] - 2022-06-06

### Fixed

- added case for plugins where no return values were expected

## [0.0.10] - 2022-04-28

**Generation of Go Plugin files**

Plugin files are used when the system decides to shift execution on server side. It's not easy to execute functions directly from the codebase of the developer from another go module which doesn't belong to the codebase itself. For this reason we are building plugin `.so` files just like WASM to gather all necessary dependencies in one file and execute that instead, by calling a generic wrapper function `Execute__` which handles to real function call.

**Current workflow**:

1. First, the GoParser parses a given path (go project) of all functions, types, global variables and exports its findings in a json file. The default path is `/tmp/export.json`
2. Second, the WASM-Builder creates a structure in JS which filters all necessary data from the `export.json` based on what's included in the `CFD.yaml`. In addition it makes suggestions what the developer may have missed to define in his/her configuration.
3. Based on the parsed structure it is constructing two types of temporary GO files.
   1. One for the resulting WASM files. They need a specific syntax and wrapper to be able to be compiled to WASM files. (are temporary stored in `/tmp/gotemp`)
   2. One for the resulting Plugin files. They also need specific syntax in order to be processed by getting a json string as parameters from the client. (are temporary stored in `/tmp/plugintemp`)
4. Lastly we compile all temporary files from both directories into WASM and plugin files. The destination is configurable when using the docker container by setting the `WWW` and `PLUGINS` env variables. **The plugins always need to be compiled into the codestribution go package which is responsible for the server/client execution.**

| ENV VAR | meaning                            |
| ------- | ---------------------------------- |
| CFD     | path to Code-Fragment-Description  |
| WWW     | path to webserver public directory |
| PLUGINS | path to codedistributor directory  |

## [0.0.9] - 2022-04-16

**Rebuilt the WASM-Builder**

The first step we are doing is to use the **GoParser** now. The GoParser is looking for GO mod files/packages in a specified path. (currently it's set to `/usr/app` - this is the place where the developers mounts his/her project directory to) In the directory it traverses all `.go` files and collect meta information about variables, functions and type definitions. After it's done, it exports its findings into a JSON file.

The second step is handled by the **wasmbuilder**. It reads the Code-Fragment-Description (CFD) and filters all JSON information, based on the informaton the developer provided, into a data structure. In addition if the GoParser found extra useful information for processing the structure later it will announce the changes and make suggestions for the CFD file. With the updated data structure it now assembles each function and their dependencies into different GO files which are compiled into WASM in the last step.

The last step is to take the temporary built go files and compile them with the basic go compiler to WASM.

## [0.0.8] - 2022-03-17

**Old WASM-Builder Milestone.** - Mainly a backup before the redesign.

The old architecture relied on parsing through GO files line by line and extracting marked functions/interfaces/variables with regex.
This is considered to be more error prone. For example the language syntax changes or introduces new features. It will be harder to go through each regex and check the actuality.

Instead we leverage the AST parser package of the standard GO repository. This way we are able to scan either one file or a whole project for GO files and extract the information in custom formats we need. Finally we compare our findings against the specified functions the developers wants to use.

## [0.0.7] - 2022-01-22

### Added

- support for Firefox
  - Firefox and Chrome print call stacks differently since it's not a standard [[ref](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack)] call stacks are needed to determine absolute or relative paths in vanilla JS
- created a fragment status list on server side
  - it should only contain the minimum information of the status
- added a custom event `getFragmentList` to pull the newest information from the server (initiated from server side by triggering an event)
- added new API route `/api` to share information with the external decision system, currently without any logic
- function calls on the server can now be initiatited from the client
  - the calculated return value will also be delivered correctly (currently not bullet proof tested)
  - to call a function from the code space of the developer I use a modified version of gorram [[ref](https://github.com/natefinch/gorram)] which is now a local package
  - usually gorram prints the result as stdout (string) to the console, I modified the program to create temporary files of the result of the function in bytes to read it in the main program and delete it afterwards
- if the parser recognized a typeDef or globalVar which was not declared in CFD.yaml as such but was found during the process, it will now guide the user to create an updated version of it with the necessary changes (it backs up the original file)
- added support for error datatype as return value
- GO Interfaces are not directly callable functions which should have there own .wasm file and are therefore treated as type definitions (typeDef)

### Changed

- adjusted check for websocket upgrade request because Firefox sends array of `["keep-alive, "Upgrade"]` instead of just "Upgrade"
- you can now use `callWasm` in two ways
  - either pass arguments with comma seperated (also function parameters because it's using the spread operator)
    ```js
    await callWasm(0, "FuncName", 34, [3, 4], "params");
    ```
  - or pass an object where the parameter attribute is an array of arguments
    ```js
    await callWasm({
      wasmId: 0,
      wasmFunc: "FuncName",
      wasmParams: [34, [3, 4], "params"],
    });
    ```
- renamed `server` attribute to `runOn` to potentially shift the execution anywhere else than currently `["server", "client"]`

## [0.0.6] - 2021-12-30

### Important

- Due to using JSON marshalling on objects and objects in arrays, objects won't be 100% type safe. The developer is full in charge of providing always the correct types in JavaScript. If you try to add "5" to a sum, the string will be ignored.

### Added

- added checks if provided parameter is type of array or object before executing
- added functionality for returning multiple return values (GO feature), it returns an object with the following structure:

```js
{
  "returnValue1": value1
  "returnValue2": value2
}
```

### Changed

- Arrays can now be typed as custom struct types, when the type is provided
- Objects will be serialized inside WASM by calling the JSON JS API instead of serializing them beforehand and sending them as string (this allows us to type check for objects and arrays)

## [0.0.5] - 2021-12-18

### Added

- it now extracts/analyses returning values of each function
- it now supports the extraction of type declarations like structs or interfaces via annotations
- added optional property "typeDef" (boolean) in the CFD schema to declare global type definitions in cases where the automatic extraction fails, in order to assist the parser
  - type defintions and global variables won't generate their on GO/WASM files, they are meant to be included
- added debug prints for return values and type definitions when its turned on
- dependencies which are type defintions will get prioritized and put upwards when assembling the GO file
- including other dependencies will now check their required dependencies and recursively travers through each fragment. It will cross out already found dependencies to avoid circular references or multiple includes
- closure functions can now be returned, however they will be executed when returning them to JS by invoking them inside WASM, no pointer will be returned
- objects in JavaScript will now be passed as json strings
- added a check in WASM if the passed parameter is an array or not
- functions without return values can now be executed
- objects can now be passed to and returned from WASM

### Changed

- cleaning the WASM directory + wasm_exec.js file or copying the JS glue code won't trigger the GO parser/file generation anymore
- type defintions and global variable declaration are syntactically similar, therefore it got renamed and adjusted to: "isDesiredVariableOrType"
- you can now pass a function name in Config.js to stop the parser and see the code output of the assembled GO file, leaving out the name will print all fragments without stopping the generation
- added proper check if a variable is undefined

## [0.0.4] - 2021-12-10

### Added

- **switched from TinyGO compiler to the regular GO compiler** since it's lacking support for int64 and json serialization for the upcoming support for objects as function parameters
  - drawback: wasm files are now larger (> 1MB)
- additional support for various datatypes as input parameters: int, int8, int16, int32, int64, float32, float64, string, arrays[int,string,float]
- support for spread operator in GO for additional unnamed parameters (variadic functions)
- support for global variables (single line and multiline (var and const))
- hints for the developer when executing the WASM function
  - when the provided parameters are insufficient for the function
  - when the function doesn't expect any parameters
- `Debug.js`: Utility class for printing debug statements when debugging mode is enabled
- optional `globalVar` property for the CFD file to improve extraction process of the parser
- `Config.js`: toggle different features on/off if needed like autoextraction (exerimental)

### Changed

- renamed everything `GoFunction` related to `GoFragment`, since it doesn't only support functions
- wasm functions (when calling) are now attached to the `window["codedistributor"]` object, not on the window object directly anymore
- go fragment comment annotation changed from [`goto:wasm:start`, `goto:wasm:end`] to [`wasm:fragment:start`,`wasm:fragment:end`]
- you can provide exact line numbers in the fragment description file if the comment annotations aren't working correctly

## [0.0.3] - 2021-11-13

### Added

- Added 4 different types of extraction methods.
  - **simple**: providing start and end line in source code
  - **annotated**: providing specific comments in source code marking start and end of function
  - **smart annotated**: providing only one smart comment where the function starts
  - **auto**: automatically tries to extract the function by the function name which is given in the CDF meta file
- Config file to easily enable and disabled experimental features and debug mode

### Changed

- Testdata CFD file to cover different use cases of comments and strings

### Removed

- printError helper function because throwing error easier to debug throwing at the right place with correct stacktrace

## [0.0.2] - 2021-11-06

Refactored codebase.

### Added

- various JSdoc comments
- Debugging class and feature on/off toggles

### Fixed

- Building files is now asynchronous. From 4s to under 1s.

## [0.0.1] - 2021-11-02

### Added

- initial release
