'use strict';
//#region IMPORTS
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const CommandLine = require('./CommandLine');
const Debug = require('./Debug');
const UserInput = require('./UserInput');
//#endregion

// Types
/** @typedef {import("../types").YamlDoc} YamlDoc */
/** @typedef {import("../GoFragment/GoFragmentFunction")} GoFragmentFunction */

class FileSystem {
  /**
   * Creates a Go file based on the given GoFragment. Program waits until this is done.
   *
   * @description default utf-8 encoding
   * @param {GoFragmentFunction} frag - The fragment to create.
   * @param {string} dirPath - Path where to create the files.
   * @param {string} [contentType=wasm] - Type of code to create.
   */
  static createGoFile = async (frag, dirPath, contentType) => {
    contentType = contentType ?? 'wasm';
    const code = contentType === 'plugin' ? frag.pluginGoCode : frag.wasmGoCode;

    if (code === '') {
      return;
    }

    await this.createDirectory(dirPath, { recursive: true });

    fs.writeFile(
      path.join(dirPath, `${frag.id}_${frag.name}.go`),
      code,
      (err) => {
        if (err) throw err;
      }
    );

    // TODO test performance
    // try {
    //   await fs.promises.writeFile(
    //     path.join(dirPath, `${frag.id}_${frag.name}.go`),
    //     code
    //   );
    // } catch (err) {
    //   throw err;
    // }
  };

  /**
   * Creates a directory of a given path. Program waits until this is done. Will skip if directory already exists.
   *
   * @static
   * @param {string} path - Path to the directory.
   * @param {Object} [options]
   * @param {boolean} options.recursive - Create also sub-directories.
   */
  static createDirectory = async (path, options) => {
    const { recursive = false } = options ?? {};

    try {
      await fs.promises.mkdir(path, { recursive });
    } catch (err) {
      // directory already exists
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  };

  /**
   * Deletes a directory with a given path. Program waits until this is done. Will skip execution if directory doesn't exist.
   * @param {string} path - Path to the directory.
   * @param {Object} [options]
   * @param {boolean} options.force - Forceful deletetion.
   */
  static deleteDirectory = async (path, options) => {
    const { force = false } = options ?? {};

    if (path === '.') {
      Debug.printInfo(
        'Trying to delete the current directory. Please select another directory then the current.'
      );
    }

    try {
      // rm -rf
      await fs.promises.rm(path, { recursive: true, force });
    } catch (err) {
      // directory doesn't exist
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  };

  /**
   * Loads the Code-Fragment-Description from the given path.
   * @param {string} cfdPath - Path to the CFD file.
   * @returns {YamlDoc}
   */
  static loadCfdFile = (cfdPath) => {
    // early exit
    if (!cfdPath) {
      console.error(
        'Variable: CFD is undefined. Either pass CLI parameter or define environment variable.'
      );
      CommandLine.printHelpMessage();
      process.exit(1);
    }

    try {
      return yaml.load(fs.readFileSync(`${cfdPath}`, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(
          `File '${err.path.split('/').pop()}' in directory '${err.path
            .split('/')
            .slice(0, -1)
            .join('/')}' not found.`
        );
      }

      throw err;
    }
  };

  /**
   * Converts the new doc structure into YAML and saves it into the provided CFD file.
   * @param {object} doc - new CFD object structure
   * @param {string} cfdPath - Path to CFD file.
   */
  static saveCfdFile = async (doc, cfdPath) => {
    const yamlDoc = yaml.dump(doc, {
      flowLevel: 3,
    });

    try {
      await fs.promises.writeFile(cfdPath, yamlDoc);
      console.log(`Updated CFD file: ${cfdPath}`);
    } catch (err) {
      console.error(`Updating CFD file failed: `, err);
    }
  };

  /**
   * Creates a copy if a given file path. If no destination is provided it will take the same directory. If the same backup file exists, it takes the timestamp as unique filename.
   * @param {string} cfdPath
   * @param {string} [dest=cfdPath+".backup"] - Destination file path.
   * @param {string} [fileSuffix=".backup"] - Suffix for filename.
   */
  static backupCfdFile = async (cfdPath, dest, fileSuffix) => {
    fileSuffix = fileSuffix ?? '.backup';
    dest = dest ?? cfdPath + fileSuffix;

    try {
      if (fs.existsSync(dest)) {
        const shouldOverride = await UserInput.yesOrNoQuestion(
          `Do you want to override the existing backup file? [y/n]\nAnswer: `
        );
        if (!shouldOverride) {
          dest = `${dest}-${+new Date()}`;
        }
      }

      await fs.promises.copyFile(cfdPath, dest);
    } catch (err) {
      throw err;
    }

    console.log(`${cfdPath} was copied to ${dest}`);
  };
}

module.exports = FileSystem;
