'use strict';

// HELPERS

/**
 * @typedef location
 * @type {object}
 * @prop {string} filepath Filepath where the fragment is located
 * @prop {number=} start Line number where the fragment starts
 * @prop {number=} end Line number where the fragment ends
 */

// EXPORTS

/**
 * @typedef YamlData
 * @type {object}
 * @prop {number} id
 * @prop {string} name
 * @prop {string} runOn
 * @prop {location} location
 * @prop {string[]=} libs
 * @prop {number[]=} dependsOn
 * @prop {boolean=} globalVar
 * @prop {boolean=} typeDef
 */

/**
 * @typedef YamlDoc
 * @type {object}
 * @prop {YamlData[]} fragments
 */

/**
 * @typedef Parameter
 * @type {object}
 * @prop {string} name
 * @prop {string} type
 * @prop {boolean} is_variadic
 */

/**
 * @typedef InterfaceParameter
 * @type {Parameter}
 */

/**
 * @typedef GenericTypeParameter
 * @type {Parameter}
 */
/**
 *
 * @typedef FunctionParameter
 * @type {Parameter}
 */

/**
 * @typedef ReturnParameter
 * @type {Parameter}
 */

/**
 * @typedef Suggestions
 * @type {object}
 * @prop {number} id
 * @prop {string} name
 * @prop {Object.<string, boolean>} adjustment
 * @prop {string} description
 */

/**
 * @typedef Import
 * @type {object}
 * @prop {string} alias
 * @prop {string} name
 * @prop {boolean} local
 */


// need something to export
export {};
