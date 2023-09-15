'use strict';

import { selectElement, selectElements } from './utils/helpers.js';
import { Add, GetHash, CalcMwst, GenObj, NewSubtract } from './CodeDistributor/functions.js';

function wasm_add() {
  const fields = {
    num1_input: selectElement('#add_numberOne'),
    num2_input: selectElement('#add_numberTwo'),
    result_output: selectElement('#add_result'),
    button: selectElement('#add_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      if (
        !fields.num1_input.value ||
        !fields.num2_input.value ||
        !Number.isInteger(Number(fields.num1_input.value)) ||
        !Number.isInteger(Number(fields.num2_input.value))
      ) {
        return;
      }

      const num1 = Number(fields.num1_input.value);
      const num2 = Number(fields.num2_input.value);
      try {
        fields.result_output.innerText = await Add(num1, num2)
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_gethash() {
  const fields = {
    message: selectElement('#gethash_message'),
    result_output: selectElement('#gethash_result'),
    button: selectElement('#gethash_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      evt.preventDefault(); // stop reloading page

      const message = fields.message.value;
      try {
        fields.result_output.innerText = await GetHash(message)
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_calcmwst() {
  const fields = {
    num: selectElement('#calcmwst_num'),
    result_output: selectElement('#calcmwst_result'),
    button: selectElement('#calcmwst_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      if (!fields.num.value) {
        return;
      }

      const num = parseFloat(fields.num.value);
      try {
        fields.result_output.innerText =
          (
            await CalcMwst(num)
          ).toFixed(2) + ' €';
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_genobj() {
  const fields = {
    name: selectElement('#genobj_name'),
    age: selectElement('#genobj_age'),
    result_output: selectElement('#genobj_result'),
    button: selectElement('#genobj_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      // evt.preventDefault(); // stop reloading page
      if (
        !fields.name.value ||
        !fields.age.value ||
        !Number.isInteger(Number(fields.age.value))
      ) {
        return;
      }

      const name = fields.name.value;
      const age = Number(fields.age.value);
      try {
          const result = await GenObj(name, age)

        let pre = document.createElement('pre');
        pre.textContent = JSON.stringify(result, null, 2);
        fields.result_output.appendChild(pre);
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_subtract() {
  const fields = {
    num1_input: selectElement('#sub_numberOne'),
    num2_input: selectElement('#sub_numberTwo'),
    result_output: selectElement('#sub_result'),
    button: selectElement('#sub_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      if (
        !fields.num1_input.value ||
        !fields.num2_input.value ||
        !Number.isInteger(Number(fields.num1_input.value)) ||
        !Number.isInteger(Number(fields.num2_input.value))
      ) {
        return;
      }

      const num1 = Number(fields.num1_input.value);
      const num2 = Number(fields.num2_input.value);
      try {
        fields.result_output.innerText = await NewSubtract(num1, num2)
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function main() {
  wasm_add();
  wasm_gethash();
  wasm_calcmwst();
  wasm_genobj();
  wasm_subtract();

  let forms = selectElements('form');
  [...forms].forEach((form) => {
    form.addEventListener('submit', (evt) => {
      evt.preventDefault(); // stop reloading page
      return;
    });
  });

  let resetBtns = selectElements("input[type='reset']");
  [...resetBtns].forEach((resetBtn) => {
    let output = resetBtn.parentNode.parentNode.querySelector('output');
    resetBtn.addEventListener('click', (evt) => {
      output.innerHTML = '';
    });
  });
}

function contentLoadedHandler(e) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler, false);
  selectElement('body').classList.remove('preload');
  if (!window.Worker) {
    selectElement('body').innerHTML = `
  <p>Your browser requires WebWorker functionalities in order to work.
  `;
    return;
  }

  main.call(this);
}

window.addEventListener('DOMContentLoaded', contentLoadedHandler, false);
