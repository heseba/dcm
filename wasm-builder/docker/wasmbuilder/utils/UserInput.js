const readline = require('readline');

module.exports = class UserInput {
  /**
   * Ask the user a question.
   * @param {string} q - The question to ask.
   * @returns {string} Input from user.
   */
  static askQuestion = (q) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      rl.question(q, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  };

  /**
   * Ask the user a yes/no question.
   * @param {string} q
   */
  static yesOrNoQuestion = (q) => {
    return new Promise(async (resolve) => {
      let answer = await this.askQuestion(q);

      if (/^(y(es)?|true|1)$/i.test(answer)) {
        answer = true;
      } else if (/^(n(o)?|false|0)$/i.test(answer)) {
        answer = false;
      } else {
        // fallback do nothing
        answer = false;
      }
      resolve(answer);
    });
  };
};
