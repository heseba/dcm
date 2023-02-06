package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path"
	"plugin"
	"reflect"
	"runtime"
	"strconv"
)

// suppresses any output to the console in the current executing context and resets it afterwards
func quiet() func() {
	null, _ := os.Open(os.DevNull)
	sout := os.Stdout
	serr := os.Stderr
	os.Stdout = null
	os.Stderr = null
	log.SetOutput(null)
	return func() {
		defer null.Close()
		os.Stdout = sout
		os.Stderr = serr
		log.SetOutput(os.Stderr)
	}
}

func getPluginsPath() string {
	const pluginPath string = "./plugins/"

	_, currentFilePath, _, _ := runtime.Caller(1)
	cwd := path.Dir(currentFilePath)

	return path.Join(cwd, pluginPath)
}

func pluginFileExists(path string) (ok bool) {
	if _, err := os.Stat(path); err == nil {
		ok = true
	} else if errors.Is(err, os.ErrNotExist) {
		ok = false
	}
	return
}

// we can call the original function inside the plugin right away, because we have regular not complex types
func loadPluginWithRegularTypes(funcId int, functionName string, params []interface{}) ([]interface{}, error) {
	defer quiet()()

	var file string = strconv.Itoa(funcId) + "_" + functionName + ".so"

	var pluginPath string = path.Join(getPluginsPath(), file)

	if ok := pluginFileExists(pluginPath); !ok {
		return nil, fmt.Errorf("plugin file for function '%s' does not exist", functionName)
	}

	// Load the plugin from the file
	plug, err := plugin.Open(pluginPath)
	if err != nil {
		return nil, err
	}

	// Lookup the symbol (function)
	symbolPlugin, err := plug.Lookup(functionName)
	if err != nil {
		return nil, err
	}

	fnValue := reflect.ValueOf(symbolPlugin)
	arguments := []reflect.Value{}

	// fill the argument list and convert interface into reflect.value
	for _, v := range params {
		arguments = append(arguments, reflect.ValueOf(v))
	}

	fnResults := fnValue.Call(arguments)

	var results []interface{}

	// convert reflect.value into interface
	for _, v := range fnResults {
		results = append(results, v.Interface())
	}

	return results, nil

	// Cast the symbol to the PluginGreeter interface
	// plugin, ok := symbolPlugin.(func(str string) string)
	// type GetHash = func(str string) string
	// plugin, ok := symPlugin.(GetHash)
	// if !ok {
	// 	return errors.New("unexpected type from module symbol")
	// }
	// fmt.Printf("%v\n", plugin("Hello World"))
	// return nil
}

// we call the wrapper function Execute__
// parameters need to be passed as jsonBytes into Execute__
// provides results as string array
func loadPluginWithCustomTypes(funcId int, functionName string, params []interface{}) ([]interface{}, error) {
	defer quiet()()

	var file string = strconv.Itoa(funcId) + "_" + functionName + ".so"

	var pluginPath string = path.Join(getPluginsPath(), file)

	if ok := pluginFileExists(pluginPath); !ok {
		return nil, fmt.Errorf("plugin file for function '%s' does not exist", functionName)
	}

	// Load the plugin from the file
	plug, err := plugin.Open(pluginPath)
	if err != nil {
		return nil, err
	}

	// Lookup the symbol (function)
	symbolPlugin, err := plug.Lookup("Execute__")
	if err != nil {
		return nil, err
	}

	fnValue := reflect.ValueOf(symbolPlugin)
	arguments := []reflect.Value{}

	jsonBytes, _ := json.Marshal(params)
	arguments = append(arguments, reflect.ValueOf(jsonBytes))

	fnResults := fnValue.Call(arguments)

	var results []interface{}

	/**
	  + if jsonString instead of bytes were returned in Execute__() function use this below
	  + err = json.Unmarshal([]byte(fnResults[0].String()), &results)
	*/

	res := fnResults[0].Interface().([]byte)
	err = json.Unmarshal(res, &results)
	if err != nil {
		log.Fatal(err.Error())
	}

	// convert reflect.value into interface
	// for _, v := range fnResults {
	// results = append(results, v.Interface())
	// }

	return results, nil
}

func main() {

	var funcId int = 6
	var funcName string = "GetHash"
	var funcParams []interface{} = []interface{}{"Hello World"}

	results, err := loadPluginWithRegularTypes(
		funcId,
		funcName,
		funcParams,
	)

	if err != nil {
		log.Fatal(err.Error())
	}

	if len(results) != 0 {
		fmt.Printf("%+v\n", results...)
	}

	funcId = 24
	funcName = "MultiReturn"
	funcParams = []interface{}{
		map[string]interface{}{
			"Name":   "Alex",
			"Skills": []string{"kochen", "klavier spielen"},
		},
		[]string{"programmieren", "zocken"},
	}

	results, err = loadPluginWithCustomTypes(
		funcId,
		funcName,
		funcParams,
	)

	if err != nil {
		log.Fatal(err.Error())
	}

	if len(results) != 0 {
		fmt.Printf("%+v\n", results...)
	}

	funcId = 27
	funcName = "ReturnError"
	funcParams = []interface{}{}

	results, err = loadPluginWithCustomTypes(
		funcId,
		funcName,
		funcParams,
	)

	if err != nil {
		log.Fatal(err.Error())
	}

	if len(results) != 0 {
		fmt.Printf("%+v\n", results...)
	}

	funcId = 30
	funcName = "Check"
	funcParams = []interface{}{}

	results, err = loadPluginWithRegularTypes(
		funcId,
		funcName,
		funcParams,
	)

	if err != nil {
		log.Fatal(err.Error())
	}

	if len(results) != 0 {
		fmt.Printf("%+v\n", results...)
	}
}
