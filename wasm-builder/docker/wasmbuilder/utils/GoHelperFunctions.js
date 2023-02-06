const Indenter = require('../utils/Indenter');

module.exports = {
  // used to squash any interface{} into a given GO datatype
  transcodeHelperFunction: Indenter.undent`
    var transcode = func(in, out interface{}) {
      buf := new(bytes.Buffer)
      json.NewEncoder(buf).Encode(in)
      json.NewDecoder(buf).Decode(out)
    }\n`,
  // used to detect if the incoming JS array is type of array and not an object
  isArrayHelperFunction: Indenter.undent`
    var isArray = func(x js.Value) bool {
      arr := js.Global().Get("Array")
      return arr.Call("isArray", x).Bool()
    }\n`,
  // used to transform incoming JS objects to GO any interface{} type
  unmarshalJSONHelperFunction: Indenter.undent`
    var unmarshalJSON = func(obj js.Value, data interface{}) {
      jsonString := js.Global().Get("JSON").Call("stringify", js.ValueOf(obj)).String()
      if err := json.Unmarshal([]byte(jsonString), &data); err != nil {
        panic(err.Error())
      }
    }\n`,
  // used to return error datatypes in WASM
  newErrorHelperFunction: Indenter.undent`
    var newError = func(err error) js.Value {
      if err == nil {
        return js.ValueOf(nil)
      }
      errorConstructor := js.Global().Get("Error")
      return errorConstructor.New(err.Error())
    }\n`,
  // used to return error datatypes in PLUGINS
  newPluginErrorHelperFunction: Indenter.undent`
    type CustomError struct {
      err     error  \`json:"-"\`
      Message string \`json:"message"\`
    }
    var newError = func(err_in error) *CustomError {
      if err_in == nil {
        return nil
      }
      return &CustomError{
        err:     err_in,
        Message: err_in.Error(),
      }
    }\n`,
  newPluginErrorHelperFunction_panic: Indenter.undent`
    type CustomError struct {
      err     error  \`json:"-"\`
      Message string \`json:"message"\`
      Trace   string \`json:"trace,omitempty"\`
    }
    var newError = func(err_in error) (err_out CustomError) {
      defer func() {
        if err := recover(); err != nil {
          err, ok := err.(error)
          buf := make([]byte, 4096)
          buf = buf[:runtime.Stack(buf, true)]

          if !ok {
            err = fmt.Errorf("%w", err)
            err_out.err = err
            err_out.Message = err.Error()
            err_out.Trace = string(buf)
          }
          err_out.err = err
          err_out.Message = err.Error()
          err_out.Trace = string(buf)
        }
      }()
      panic(err_in)
    }\n`,
};
