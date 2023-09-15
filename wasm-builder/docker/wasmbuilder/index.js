'use strict';

//#region IMPORTS
const fs = require('fs');
const Debug = require('./utils/Debug');
const WasmBuilder = require('./WasmBuilder');
const CommandLine = require('./utils/CommandLine');
const FileSystem = require('./utils/FileSystem');
//#endregion

//========================
// GLOBALS
//========================
const cliParams = CommandLine.handleCliParameters(process.argv.slice(2));

let cfdPath = '', // Code-Fragment-Description Path
  pluginTempPath = '', // final plugin Go Code Path
  goTempPath = '', // temporary Go Code Path
  goParserExportPath = '', // JSON export path locally
  functionsPath = '',
  wsPath = '',
  apiPath = '',
  maxReconnectAttempts = 3;

// if env variable cfd is defined then it must be inside docker
cfdPath = cliParams?.cfd ?? process.env.CFD ?? undefined;
// default is looking in the current directory
if (fs.existsSync('./CFD.yaml')) {
  cfdPath = './CFD.yaml';
} else if (fs.existsSync('./CFD.yml')) {
  cfdPath = './CFD.yml';
}

/**
 * define directories for storing temp files
 * if we are using the script locally, or when using docker, or defaulting when leaving out the cli option
 */
pluginTempPath =
  cliParams?.plugins ?? process.env.PLUGINTEMP ?? './tmp/plugintemp';
goTempPath = cliParams?.temp ?? process.env.GOTEMP ?? './tmp/gotemp';

goParserExportPath = cliParams?.export ?? process.env.GOPARSEREXPORT ?? './tmp';

functionsPath = cliParams?.functionspath ?? process.env.FUNCTIONS ?? './tmp';
wsPath = cliParams?.wspath ?? process.env.WSPATH ?? '/ws';
apiPath = cliParams?.apipath ?? process.env.APIPATH ?? '/api/v1';
maxReconnectAttempts = cliParams?.maxreconnects ?? process.env.MAXRECONNECTS ?? 3;

(async () => {
  console.time('WASM-Builder took');

  await FileSystem.deleteDirectory(goTempPath, {
    force: true,
  });
  await FileSystem.deleteDirectory(pluginTempPath, {
    force: true,
  });

  new WasmBuilder(
    cfdPath,
    pluginTempPath,
    goTempPath,
    goParserExportPath,
    functionsPath,
    wsPath,
    apiPath,
    maxReconnectAttempts
  ).build();

  Debug.printExecutionTime('WASM-Builder took');
})();
