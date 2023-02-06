'use strict';

class GoDatatype {
  static dt = [
    'int',
    'uint',
    'uintptr',
    'int8',
    'uint8',
    'int16',
    'uint16',
    'int32',
    'uint32',
    'int64',
    'uint64',
    'float32',
    'float64',
    'complex64',
    'complex128',
    'string',
    'bool',
    'byte',
    'rune',
    'interface{}',
    'error',
    'nil',
    'func'
  ];

  static dtconv = {
    bool: '.Bool()',
    // INTs
    int: '.Int()',
    int8: '.Int()',
    int16: '.Int()',
    int32: '.Int()',
    int64: '.Int()', // BigInt, not supported in tinygo and go plugins
    // FLOATs
    float64: '.Float()',
    float32: '.Float()',
    string: '.String()',
  };

  /**
   * Checks if the datatype is a type of integer.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isIntegerDatatype = (dt) => /^int$/i.test(dt);
  /**
   * Checks if the datatype is a type of integer (int8,int16,int32).
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isSpecialIntegerDatatype = (dt) =>
    /^int(?:8|16|32|64)$/i.test(dt) && this.dtconv[dt];
  /**
   * Checks if the datatype is a type of float32.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isFloat32Datatype = (dt) => /^float32$/i.test(dt);
  /**
   * Checks if the datatype is a type of array.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isArrayDatatype = (dt) => /^\[\]/.test(dt);
  /**
   * Checks if the datatype is variadic.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isVariadicDatatype = (dt) => /^\.\.\./.test(dt);
  /**
   * Checks if the datatype is a type of error.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isErrorDatatype = (dt) => /^error/i.test(dt);
  /**
   * Checks if the datatype is a type of object.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isObjectDatatype = (dt) => /^map\[/i.test(dt);
  /**
   * Checks if the datatype is a type of func.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isFuncDatatype = (dt) => /^func/i.test(dt);
  /**
   * Checks if the datatype is a unknown datatype we cannot handle with syscall.
   * @param {string} dt Datatype to test against.
   * @returns {boolean}
   */
  static isUnknownDatatype = (dt) => {
    // regex with all viable GO datatypes,
    // !this.dt.includes(dt)
    // TODO might want to exclude explicitly arrays and objects
    const isViableDatatypeRegex = new RegExp(`^(?:${this.dt.join('|')})`, 'i');
    return !isViableDatatypeRegex.test(dt);
  };
}

module.exports = GoDatatype;
