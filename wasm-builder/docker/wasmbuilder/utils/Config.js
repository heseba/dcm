class Config {
  static debug = {
    enabled: false,
    skipFileGeneration: false,
    ///////////////////////
    showExecutionTime: false,
    showWasmFunctionCode: false,
    showPluginFunctionCode: true,
    functionName: 'CreatingEmployee',
  };

  // might be attached to window object or the current global scope of the web worker
  static globalObject = 'codedistributor';
}

module.exports = Config;
