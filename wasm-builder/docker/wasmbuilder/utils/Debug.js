'use strict';

const Config = require('./Config');

// Types
/** @typedef {import("../GoFragment/GoFragmentFunction")} GoFragmentFunction */

class Debug {
  static #debug = Config.debug;
  static enabled = this.#debug.enabled || false;

  /**
   * If a name is provided the program stops to print the function go code, otherwise it prints all processing functions.
   * @param {string} funcName The name of the function where the program should stop.
   * @param {GoFragmentFunction} frag The current fragment
   * @param {Object} options
   * @param {string} options.type - Code type (wasm|plugin)
   */
  static printCode(funcName, frag, options) {
    const { type } = options ?? {};
    funcName = funcName ?? '';

    const print = (code) => {
      // empty string || undefined || false
      if (!funcName) {
        console.log(code);
      } else if (frag.name === funcName) {
        console.log(code);
        process.exit(1);
      }
    };

    switch (type) {
      case 'wasm':
        if (this.enabled && this.#debug.showWasmFunctionCode) {
          print(frag.wasmGoCode);
        }
        break;
      case 'plugin':
        if (this.enabled && this.#debug.showPluginFunctionCode) {
          print(frag.pluginGoCode);
        }
        break;
      default:
        break;
    }
  }

  static printHeapUsage() {
    const {
      // total RAM used by node and the program, if this rises unexpected, memory leaks can be the issue
      rss,
      // total space available for JavaScript objects at the time, estimate from the garbage collector
      heapTotal,
      // total space occupied for JavaScript objects at the time
      heapUsed,
    } = process.memoryUsage();

    const toMegaByte = (byteNumber) => byteNumber / 1024 / 1024;
    const formatDecimal = (float) => Math.round(float * 100) / 100;

    const usedRss = toMegaByte(rss);
    const usedHeapTotal = toMegaByte(heapTotal);
    const usedHeap = toMegaByte(heapUsed);

    const table = {
      'RAM usage': {
        'in MB': formatDecimal(usedRss) + ' MB',
        Description: 'total RAM used by node and the program',
      },
      'Memory available': {
        'in MB': formatDecimal(usedHeapTotal) + ' MB',
        Description: 'currently total space available for JavaScript objects',
      },
      'Memory used': {
        'in MB': formatDecimal(usedHeap) + ' MB',
        Description: 'currently total space occupied for JavaScript objects',
      },
    };

    console.table(table);
  }

  static printHeapUsageMin() {
    const { rss, heapTotal, heapUsed } = process.memoryUsage();

    const toMegaByte = (byteNumber) => byteNumber / 1024 / 1024;
    const formatDecimal = (float) => Math.round(float * 100) / 100;

    const usedRss = toMegaByte(rss);
    const usedHeapTotal = toMegaByte(heapTotal);
    const usedHeap = toMegaByte(heapUsed);

    console.log(
      `RAM usage: ${formatDecimal(
        usedRss
      )} MB\nMemory available: ${formatDecimal(
        usedHeapTotal
      )} MB\nMemory used: ${formatDecimal(
        usedHeap
      )} MB\n==============================`
    );
  }

  static printExecutionTime(key) {
    if (!(this.enabled && this.#debug.showExecutionTime)) {
      return;
    }
    console.timeEnd(key);
  }

  static printInfo(str) {
    console.info(str);
    process.exit(1);
  }
}

module.exports = Debug;
