/**
 * Postfix statement generator
 *
 * This code will analyze an equation and generator a graphical
 * syntax tree that shows the Postfix setup of the input
 *
 * Adapted from http://www.sunshine2k.de/coding/java/SimpleParser/SimpleParser.html
 * Added:
 *   - Exponentiation operator (`^`) support
 *   - Enhanced nesting support
 *   - Equation pre-validation
 *
 * @author Troy McCabe
 * @copyright 2012 Troy McCabe. All Rights Reserved
 * @date 2012-11-20 (creation)
 */
/**
 * Main class for the Postfix statement generator
 *
 * @param eq The equation to work with
 * @constructor
 */
function PostfixStatement (eq) {
    /**
     * The equation we'll work with
     *
     * @type {String}
     * @private
     */
    this._equation = eq;

    /**
     * Generate the postfix representation of this equation
     *
     * @return {String}
     */
    this.generate = function() {
        // init vars for the loop
        var stack = [];
        var resultStr = '';

        // go through each char in the string
        for (var i = 0; i < this._equation.length; i++) {
            // get the current one
            var currentChar = this._equation.charAt(i);

            // determine what to do based on what char it is
            if (currentChar == ')') {
                // go through any operators and add them to the string if they're in the parens
                while (stack.length > 0 && stack[stack.length - 1] != '(') {
                    resultStr += '' + stack.pop();
                }

                // pop anything off if necessary
                if (stack.length > 0) {
                    stack.pop();
                }
            } else if (currentChar.match(/[\+\-]/)) {
                // add any operators as necessary
                while (stack.length > 0 && stack[stack.length - 1].match(/[\+\-\*\/\^]/)) {
                    resultStr += '' + stack.pop();
                }
                // add the current char
                stack.push(currentChar);
            } else if (currentChar.match(/[\*\/]/)) {
                // add any operators as necessary
                while (stack.length > 0 && stack[stack.length - 1].match(/[\*\/\^]/)) {
                    resultStr += '' + stack.pop();
                }
                // add the current char
                stack.push(currentChar);
            } else if (currentChar.match(/\^/)) {
                // add any operators as necessary
                while (stack.length > 0 && stack[stack.length - 1].match(/\^/)) {
                    resultStr += '' + stack.pop();
                }
                // add the current char
                stack.push(currentChar);
            } else if (currentChar == '(') {
                // just push the open paren
                stack.push(currentChar);
            } else if (currentChar.match(/[\w\d\.]/)) {
                // grab any multiple of characters
                while (currentChar.match(/[\w\d\.]/)) {
                    resultStr += '' + currentChar;
                    i++;
                    currentChar = this._equation.charAt(i);
                }
                // decrement since we went over
                i--;
            }

            // space out the string
            resultStr += '  ';
        }

        // add any operators left in the stack with a space between them
        while (stack.length > 0) {
            resultStr += '' + stack.pop();
            resultStr += '  ';
        }

        // send back the trimmed string
        return resultStr.trim();
    };

    /**
     * Cleans the equation and throws exceptions as necessary
     *
     * @private
     */
    this._cleanEquation = function() {
        // an equation is required
        if (!this._equation) {
            throw 'ERROR: An equation is required';
        }

        // check for equal numbers of open and closing parentheses
        var openParens = this._equation.match(/\(/g);
        var closeParens = this._equation.match(/\)/g)
        if (openParens == null && closeParens != null) {
            throw 'ERROR: Unpaired open parenthesis';
        } else if (openParens != null && closeParens == null) {
            throw 'ERROR: Unpaired close parenthesis';
        } else if (openParens != null && closeParens != null) {
            if (openParens.length != closeParens.length) {
                throw 'ERROR: Parenthesis count mismatch. ' +
                    '' + openParens.length + ' open, ' + closeParens.length + ' closed';
            }
        }

        // strip any whitespace from the string
        // turn 8(... into 8*(...
        // turn ...)8 into ...)*8
        // turn ...)(... into ...)*(...
        this._equation = this._equation
            .replace(/\s/g, '')
            .replace(/([\w\d])\(/g, '$1*(')
            .replace(/\)([\w\d])/g, ')*$1')
            .replace(/\)\(/, ')*(');
    };

    // clean the provided equation
    // do this on construct so we have a clean start initially
    this._cleanEquation();
}