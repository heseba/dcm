'use strict';

import { selectElement } from './utils/helpers.js';
import { codeDistributor } from './initCodeDistributor.js';
import { testcase1 } from './testcase1/index.js';

async function main() {
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
