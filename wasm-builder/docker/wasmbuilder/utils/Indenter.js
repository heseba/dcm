'use strict';

/** @file https://github.com/bscotch/tools/blob/develop/packages/utility/src/lib/strings.ts **/

/**
 *
 * @param {string} string
 * @returns
 */
function withoutInitialLinebreaks(string) {
  return string.replace(/^[\r\n]+/, '');
}

/**
 *
 * @param {string} string
 * @returns
 */
function withoutTrailingWhitespace(string) {
  return string.replace(/\s+$/, '');
}

/**
 *
 * @param {TemplateStringsArray} strings
 * @param  {...any} interps
 * @returns
 */
function cleanTemplate(strings, ...interps) {
  // Trim these things up
  const cleanStrings = [...strings];
  cleanStrings[0] = withoutInitialLinebreaks(cleanStrings[0]);
  const lastStringIdx = cleanStrings.length - 1;
  cleanStrings[lastStringIdx] = withoutTrailingWhitespace(
    cleanStrings[lastStringIdx]
  );

  // For each interp, if it has newlines when stringified each
  // line after the first needs to inherit the indentation
  // level of its starting point.
  let string = '';
  for (let i = 0; i < cleanStrings.length; i++) {
    string += cleanStrings[i];
    if (i == lastStringIdx) {
      break;
    }
    let interp = `${interps[i]}`;
    const linebreakRegex = /(\r?\n)/;
    const interpLines = interp.split(linebreakRegex).filter((x) => x);
    if (interpLines.length && i < lastStringIdx) {
      // How indented are we?
      const indentMatch = string.match(/\n?([^\n]+?)$/);
      if (indentMatch) {
        // amount of indent to add to each entry that is a break
        // (skip the last one, since if it's a newline we don't
        //  want that to cause an indent on the next line also)
        for (let i = 0; i < interpLines.length; i++) {
          if (interpLines[i].match(linebreakRegex)) {
            interpLines[i] += ' '.repeat(indentMatch[1].length);
          }
        }
      }
    }
    interp = interpLines.join('');
    string += interp;
  }
  return string;
}

/**
 *
 * @param {string[]} strings
 * @returns
 */
function sortStringsByLength(strings) {
  return strings.sort((string1, string2) => string1.length - string2.length);
}

/**
 *
 * @param {string[]} strings
 * @returns
 */
function getShortestString(strings) {
  return sortStringsByLength(strings)[0];
}


/**
 * Shift all lines left by the *smallest* indentation level,
 * and remove initial newline and all trailing spaces.
 * Lines that only have spaces are not used to determine the
 * indentation level.
 * @param {TemplateStringsArray} strings
 * @param  {...any} interps
 */
function undent(strings, ...interps) {
  const string = cleanTemplate(strings, ...interps);
  // Remove initial and final newlines
  // Find all indentations *on lines that are not just whitespace!*
  const indentRegex = /^(?<indent>[ \t]*)(?<nonSpace>[^\s])?/;
  const dents = string
    .match(new RegExp(indentRegex, 'gm'))
    ?.map((dentedLine) => {
      const { indent, nonSpace } = dentedLine.match(indentRegex).groups;
      const isNotJustWhitespace = nonSpace?.length;
      if (isNotJustWhitespace) {
        return indent || '';
      }
      return;
    })
    .filter((indentLevel) => typeof indentLevel == 'string');
  if (!dents || dents.length == 0) {
    return string;
  }
  const minDent = getShortestString(dents);
  if (!minDent) {
    // Then min indentation is 0, no change needed
    return string;
  }
  const dedented = string.replace(new RegExp(`^${minDent}`, 'gm'), '');
  return dedented;
}

/**
 * Remove ALL indents, from every line.
 * @param {TemplateStringsArray} strings
 * @param  {...any} interps
 */
function nodent(strings, ...interps) {
  let string = cleanTemplate(strings, ...interps);
  // Remove initial and final newlines
  string = string.replace(/^[\r\n]+/, '').replace(/\s+$/, '');
  return string
    .split(/\r?\n/g)
    .map((line) => line.replace(/^\s*(.*?)/, '$1'))
    .join('\n');
}

/**
 * Remove linebreaks and extra spacing in a template string.
 * @param {TemplateStringsArray} strings
 * @param  {...any} interps
 */
function oneline(strings, ...interps) {
  return cleanTemplate(strings, ...interps)
    .replace(/^\s+/, '')
    .replace(/\s+$/, '')
    .replace(/\s+/g, ' ');
}

module.exports = {
  sortStringsByLength,
  getShortestString,
  undent,
  nodent,
  oneline
}
