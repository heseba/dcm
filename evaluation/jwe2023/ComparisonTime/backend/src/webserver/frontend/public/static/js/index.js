'use strict';

import { selectElement } from './utils/helpers.js';
import { codeDistributor } from './initCodeDistributor.js';
import { testcase1 } from './testcase1/index.js';

async function main() {
  let startupTimes = [];
//  for (let i = 0; i < 10; i++) {
//    const startTime = +new Date();
//    const endTime = await codeDistributor.call(7, 'WasmStartupTime');
//    startupTimes.push(endTime - startTime);
//  }
  console.log('Wasm Container startup times in ms: ', startupTimes);

  // Cool Usecase
  testcase1();
}

function contentLoadedHandler(e) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler, false);
  selectElement('body').classList.remove('preload');
  if (!window.Worker || !window.localStorage) {
    selectElement('body').innerHTML = `
  <p>Your browser requires WebWorker and LocalStorage functionalities in order to work.
  `;
    return;
  }

  main.call(this);
}

window.addEventListener('DOMContentLoaded', contentLoadedHandler, false);
