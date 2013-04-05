/**
 * Infix diagram generator
 *
 * This code will analyze an equation and generator a graphical
 * syntax tree that shows the Infix setup of the input
 *
 * @author Troy McCabe
 * @copyright 2012 Troy McCabe. All Rights Reserved
 * @date 2012-11-20 (creation)
 */
/**
 * Main class for the Infix Diagram generator
 *
 * @param eq The equation to work with
 * @constructor
 */
function InfixDiagram (eq) {
    /**
     * The modifier for line position (moving the lines off the circles)
     *
     * @type {Number}
     */
    this.LINE_MOD = 14;

    /**
     * The margin to increment for both left and right
     *
     * @type {Number}
     */
    this.MARGIN = 65;

    /**
     * The score for a parenthesis nest while breaking it up
     *
     * @type {Number}
     */
    this.PAREN_SCORE = 4;

    /**
     * The 2D context for the canvas that we can draw on
     * 
     * @type {CanvasRenderingContext2D}
     * @private
     */
    this._canvasContext;

    /**
     * The equation we'll work with
     *
     * @type {String}
     * @private
     */
    this._equation;

    /**
     * The margin left of the current element
     *
     * @type {Number}
     * @private
     */
    this._marginLeft;

    /**
     * The calculated tree from {@link InfixDiagram._analyze}
     *
     * @type {Object}
     * @private
     */
    this._tree;

    /**
     * Generate the graphical representation of this equation
     *
     * @param canvasId The ID of the canvas to draw to
     */
    this.draw = function(canvasId) {
        // build the tree
        this.getTree();

        // grab the canvas and set some ctxt stuff
        var canvas = document.getElementById(canvasId);
        this._canvasContext = canvas.getContext('2d');
        this._canvasContext.canvas.height = window.innerHeight - 100;
        this._canvasContext.canvas.width = window.innerWidth;
        this._canvasContext.font = '14px monospace';

        // traverse and draw out the tree
        var rootCoords = this._traverseBranch(this._tree, 1, 'root');

        // write the equation above the tree
        this._canvasContext.fillText(this._equation, rootCoords.x - (4 * this._equation.length), rootCoords.y - 25);
    };

    /**
     * Get the tree
     *
     * @return {Object}
     */
    this.getTree = function() {
        // build the tree if we need to
        if (this._tree == null) {
            this._tree = this._analyze(this._equation);
        }

        // send it back
        return this._tree;
    };

    /**
     * Set the equation
     *
     * @param eq The new equation
     */
    this.setEquation = function(eq) {
        // reset the _marginLeft to this.MARGIN
        this._marginLeft = this.MARGIN;

        // set the equation
        this._equation = eq;

        // clean it
        this._cleanEquation();
    };

    /**
     * Analyze the string and generate the stack
     *
     * As we go through, we assign points to each of the operators. Operators of higher mathematical
     * importance are assigned more points, as well as additional points based on their nested parenthetical position.
     * We'll find the lowest point value, and as that's least important, will be our root.
     *
     * [+, -] = 1
     * [*, /] = 2
     * [^] = 3
     * [(, )] = VAL + this.PAREN_SCORE
     *
     * e.g. 4 + (5 ^ 6 * (4 + 3))
     * 4 +[1] (5 ^[7] 6 *[6] (4 +[9] 3))
     *
     * e.g. (12 * A ^ 2 - 2 * A + 31) / (4 * A + 6)
     * (12 *[6] A ^[7] 2 -[5] 2 *[6] A +[5] 31) /[2] (4 *[6] A +[5] 6)
     *
     * @param eqPart The part of the equation to grab from
     * @return {Object}
     * @private
     */
    this._analyze = function(eqPart) {
        // init vars
        var parensDeep = 0;
        var rootNodePos;
        var rootNodeScore;

        // iterate over the characters in the equation
        for (var i = 0; i < eqPart.length; i++) {
            // grab the current char
            var currentChar = eqPart.charAt(i);

            // set the new node score
            var nodeScore = null;
            var nodeScoreModifier = null;

            // determine the operation
            /*** WE'RE SKIPPING OPERANDS FOR NOW, ONLY OPERATIONS ARE IMPORTANT AT THIS STEP ***/
            if (currentChar == '+' || currentChar == '-') {
                nodeScoreModifier = 1;
            } else if (currentChar == '*' || currentChar == '/') {
                nodeScoreModifier = 2;
            } else if (currentChar == '^') {
                nodeScoreModifier = 3;
            } else if (currentChar == '(') {
                parensDeep++;
            } else if (currentChar == ')') {
                parensDeep--;
            }

            // if we have a modifier to work with, we can calculate whether this is root or not
            if (nodeScoreModifier != null) {
                // calc the score
                // We add the paren depth in case it's in parens
                // We subtract the position in the string in the case of equal operators: `4 * 5 / 8`
                nodeScore = nodeScoreModifier + (parensDeep * this.PAREN_SCORE) - (i / 100);
                // if we simply don't have a root node score
                // or the calculated node score is less, this is the root node
                if (rootNodeScore == null || nodeScore < rootNodeScore) {
                    rootNodePos = i;
                    rootNodeScore = nodeScore;
                }
            }
        }

        // create the collection (a var for some wacky js things when minified)
        var collection = {
            left: this._findLeftOperand(eqPart, rootNodePos),
            right: this._findRightOperand(eqPart, rootNodePos),
            root: eqPart.charAt(rootNodePos)
        };

        // there you go
        return collection;
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
        this._equation = this._equation
            .replace(/\s/g, '')
            .replace(/([\w\d])\(/g, '$1*(')
            .replace(/\)([\w\d])/g, ')*$1')
            .replace(/\)\(/, ')*(');
    };

    /**
     * Write the element to the screen
     *
     * Also moves the left margin over
     *
     * @param text The text for the node
     * @param marginLeft The left margin
     * @param marginTop The top margin
     * @private
     */
    this._drawEl = function(text, marginLeft, marginTop) {
        // write the circle and text to the canvas
        this._canvasContext.beginPath();
        this._canvasContext.arc(marginLeft, marginTop, 20, 0, 2 * Math.PI);
        this._canvasContext.stroke();
        this._canvasContext.fillText(text, marginLeft - (5 * text.length), marginTop + 5);

        // update the left margin
        this._marginLeft = marginLeft + this.MARGIN;
    };

    /**
     * Draw a line between two coordinates
     *
     * @param from The from coords ({x:?,y:?})
     * @param to The to coords ({x:?,y:?})
     * @private
     */
    this._drawLine = function(from, to) {
        this._canvasContext.beginPath();
        this._canvasContext.moveTo(from.x, from.y);
        this._canvasContext.lineTo(to.x, to.y);
        this._canvasContext.stroke();
    };

    /**
     * Find the left operand of an equation part
     *
     * @param eqPart The part of the equation to grab from
     * @param maxPos The position of the operator to go left from
     * @return {String|Object}
     * @private
     */
    this._findLeftOperand = function(eqPart, maxPos) {
        // set up our vars
        var currentPos = maxPos - 1;
        var previousChar = eqPart.substr(currentPos, 1);
        var leftOperand = '';

        // if we have a string or an int, grab all the connected ones
        // else we have parens and deal with those below
        if (previousChar.match(/^[\w\d\.]$/)) {
            // grab all the connected chars (and not over the left side of the string)
            while (previousChar.match(/^[\w\d\.]$/) && currentPos >= 0) {
                // track along with the progress
                leftOperand += '' + previousChar;
                currentPos--;
                previousChar = eqPart.substr(currentPos, 1);
            }

            leftOperand = leftOperand.split('').reverse().join('');

            /*
             * This is for cases such as `2 * 5 + 8`
             * `+` is the root, but to the left of `5` is `2 * `
             * We need a complex left operand for this situation
             */
            if (previousChar && previousChar.match(/[\+\*\/\-\^]/)) {
                // back up through the left side and throw the entirety through _analyze()
                var previousEqPart = eqPart.substr(0, maxPos);

                if (previousEqPart != leftOperand) {
                    // analyze the left side
                    leftOperand = this._analyze(previousEqPart);
                } else {
                    leftOperand = {
                        left: this._findLeftOperand(eqPart, currentPos),
                        root: previousChar,
                        right: leftOperand
                    }
                }
            }
        } else {
            // setup vars for the paren case
            var leftStatement = '';
            var closeCount = 1;
            var openCount = 0;

            // while we're inside the proper number of parens (and not over the left side of the string)
            while (closeCount != openCount && currentPos >= 0) {
                // increment paren counts as necessary
                if (previousChar == '(') {
                    openCount++;
                } else if (previousChar == ')') {
                    closeCount++;
                }

                // track our nonsense
                leftStatement += '' + previousChar;
                currentPos--;
                previousChar = eqPart.substr(currentPos, 1);
            }

            // we need to flip the chars in the operand, since we went backward
            leftStatement = leftStatement.split('').reverse().join('');

            // build the left operand
            leftOperand = this._analyze(leftStatement);
        }

        // here you go
        return leftOperand;
    };

    /**
     * Find the right operand of an equation part
     *
     * @param eqPart The part of the equation to grab from
     * @param maxPos The position of the operator to go left from
     * @return {String|Object}
     * @private
     */
    this._findRightOperand = function(eqPart, maxPos) {
        // set up our vars
        var currentPos = maxPos + 1;
        var nextChar = eqPart.substr(currentPos, 1);
        var rightOperand = '';

        // if we have a string or an int, grab all the connected ones
        // else we have parens and deal with those below
        if (nextChar.match(/^[\w\d\.]$/g)) {
            // grab all the connected chars (and not over the right side of the string)
            while (nextChar.match(/^[\w\d\.]$/g) && currentPos < eqPart.length) {
                // track along with the progress
                rightOperand += '' + nextChar;
                currentPos++;
                nextChar = eqPart.substr(currentPos, 1);
            }

            /*
             * This is for cases such as `2 + 5 * 8`
             * `+` is the root, but to the right of `5` is ` * 8`
             * We need a complex right operand for this situation
             *
             * Since we're going forward, there's no need for fancy nonsense
             */
            if (nextChar && nextChar.match(/^[\+\*\/\-\^]$/)) {
                // back up through the left side and throw the entirety through _analyze()
                var nextEqPart = eqPart.substr(maxPos + 1, eqPart.length);

                if (nextEqPart != rightOperand) {
                    // analyze the left side
                    rightOperand = this._analyze(nextEqPart);
                } else {
                    rightOperand = {
                        left: rightOperand,
                        root: nextChar,
                        right: this._findRightOperand(eqPart, currentPos)
                    }
                }
            }
        } else {
            // setup vars for the paren case
            var rightStatement = '';
            var closeCount = 0;
            var openCount = 1;

            // while we're inside the proper number of parens (and not over the right side of the string)
            while (closeCount != openCount && currentPos < eqPart.length) {
                // increment paren counts as necessary
                if (nextChar == '(') {
                    openCount++;
                } else if (nextChar == ')') {
                    closeCount++;
                }

                // track our nonsense
                rightStatement += '' + nextChar;
                currentPos++;
                nextChar = eqPart.substr(currentPos, 1);
            }

            // build the right operand
            rightOperand = this._analyze(rightStatement);
        }

        // here you go
        return rightOperand;
    };

    /**
     * Traverse a branch and write the elements to the screen as they're found
     *
     * This will also increment the left margin as necessary
     *
     * @param node The node to work with
     * @param depth The current depth
     * @private
     * @return {Object} The position or the root node ({x:?,y:?})
     */
    this._traverseBranch = function(node, depth, leftOrRight) {
        // calculate the height of the nodes
        var rootHeight = depth * this.MARGIN;
        var branchHeight = rootHeight + this.MARGIN;

        // in case of recursion, we want the position of the lower root node
        var lowerRoot = null;
        var rootNodePos = null;

        // placeholder for line coords
        var from = null;
        var to = null;

        // if we have an object (it's a complex node)
        // else just write the node
        if (typeof node == 'object') {
            // if the left node is complex, recursively traverse it
            // else just write the node
            if (typeof node.left == 'object') {
                lowerRoot = this._traverseBranch(node.left, depth + 1, 'left');
            } else {
                // draw the line
                from = {x: this._marginLeft + this.LINE_MOD, y: branchHeight - this.LINE_MOD};
                to = {x: this._marginLeft + this.MARGIN - this.LINE_MOD, y: branchHeight - this.MARGIN + this.LINE_MOD};
                this._drawLine(from, to);

                // draw the element
                this._drawEl(node.left, this._marginLeft, branchHeight);
            }

            // get the root node position
            rootNodePos = {x: this._marginLeft, y: rootHeight};

            // if we have a lower root, draw the line to it
            if (lowerRoot != null) {
                from = {x: rootNodePos.x - this.LINE_MOD, y: rootNodePos.y + this.LINE_MOD};
                to = {x: lowerRoot.x + this.LINE_MOD, y: lowerRoot.y - this.LINE_MOD};
                this._drawLine(from, to);
            }

            // write the root node
            this._drawEl(node.root, this._marginLeft, rootHeight);

            // if the right node is complex, recursively traverse it
            // else just write the node
            if (typeof node.right == 'object') {
                lowerRoot = this._traverseBranch(node.right, depth + 1, 'right');

                // set line coords
                from = {x: rootNodePos.x + this.LINE_MOD, y: rootNodePos.y + this.LINE_MOD};
                to = {x: lowerRoot.x - this.LINE_MOD, y: lowerRoot.y - this.LINE_MOD};
            } else {
                // set line coords
                from = {x: this._marginLeft - this.LINE_MOD, y: branchHeight - this.LINE_MOD};
                to = {x: this._marginLeft - this.MARGIN + this.LINE_MOD, y: branchHeight - this.MARGIN + this.LINE_MOD};

                // draw the element
                this._drawEl(node.right, this._marginLeft, branchHeight);
            }

            // draw the line
            this._drawLine(from, to);
        } else {
            if (leftOrRight == 'left') {
                // draw the line
                from = {x: this._marginLeft + this.LINE_MOD, y: rootHeight - this.LINE_MOD};
                to = {x: this._marginLeft + this.MARGIN - this.LINE_MOD, y: rootHeight - this.MARGIN + this.LINE_MOD};
            } else if (leftOrRight == 'right') {
                // draw the line
                from = {x: this._marginLeft - this.LINE_MOD, y: rootHeight - this.LINE_MOD};
                to = {x: this._marginLeft - this.MARGIN + this.LINE_MOD, y: rootHeight - this.MARGIN + this.LINE_MOD};
            }
            this._drawLine(from, to);
            this._drawEl(node, this._marginLeft, rootHeight);
        }

        return rootNodePos;
    };

    // clean the provided equation
    // do this on construct so we have a clean start initially
    this.setEquation(eq);
}