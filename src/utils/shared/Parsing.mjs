/**
 * Parsing functions to verify syntax and parse user input into valid Expressions.
 * Empty arguments are allowed and processed for preview.
 * TODO: parse absolute value
 */

/**
 * Formats all numbers and constants as complex numbers. Spaces are removed, numbers
 * and variables are enclosed in parentheses, and adding a negative is replaced with subtract.
 */
const parseConst = (userInput) => {
  const found = userInput.search(/[~`@#$&_[\]{};:'"<>?]/)
  if (found !== -1) throw new SyntaxError(`Forbidden character: ${userInput[found]}`)
  return userInput
    .replace(/ /g, "")
    .replace(/(?<!\.)([1-9]+\.?\d*e[+-]\d{1,3}|\d+\.?\d*|\.\d+)(?!\d|\.)/g, "([$1,0])")
    .replace(/inf(?:inity)?/g, "([Infinity,0])")
    .replace(/(?<![a-df-hj-z])i(?![a-df-hj-oq-z])/g, "([0,1])")
    .replace(/(?<![a-df-hj-z])e(?!(?<=\de)[+-]\d{1,3}|[a-df-oq-z])/g, "([e,0])")
    .replace(/(?<![a-hj-z])pi(?![a-oq-z])/g, "([pi,0])")
    .replace(/(?<!\w)([a-df-hj-z])(?!\w)/g, "($1)")
    .replace(/(?<![-+*/])\+-/g, "-")
}

/**
 * Checks nested parentheses in a function and finds the matching close.
 * @param {String} userInput
 * @param {Number} index the index of the opening parenthesis
 * @param {Boolean} leftToRight from left to right
 * @returns {Number} the index of the matching ")" or "("
 */
const matchParen = (userInput, index, leftToRight = true) => {
  let parenIndex = index
  let i = 1
  let j = 0
  if (leftToRight) {
    while (i < userInput.length - index && j !== -1) {
      if (userInput[index + i] === "(") {
        j++
        parenIndex = index + i
      } else if (userInput[index + i] === ")") {
        j--
        parenIndex = index + i
      }
      i++
    }
  } else {
    while (i <= index && j !== -1) {
      if (userInput[index - i] === ")") {
        j++
        parenIndex = index - i
      } else if (userInput[index - i] === "(") {
        j--
        parenIndex = index - i
      }
      i++
    }
  }
  if (j !== -1) throw new SyntaxError("Mismatched parentheses.")
  return parenIndex
}

/**
 * Removes extra parentheses and attempts to correct missing parentheses.
 * Checks for function arguments and valid numbers.
 */
const verifyInput = (userInput) => {
  const validNumbersRemoved = userInput.replace(/\[[^,]+,[^,]+\]/g, "")
  if (/\d|\./.test(validNumbersRemoved)) throw new SyntaxError("Invalid number or decimal.")
  let index = userInput.indexOf("(")
  while (index !== -1) {
    try {
      index = userInput.indexOf("(", matchParen(userInput, index))
    } catch {
      userInput = userInput + ")"
      index = userInput.indexOf("(")
    }
  }
  index = userInput.lastIndexOf(")")
  while (index !== -1) {
    try {
      index = userInput.lastIndexOf(")", matchParen(userInput, index, false))
    } catch {
      userInput = "(" + userInput
      index = userInput.lastIndexOf(")")
    }
  }
  index = userInput.indexOf("((")
  while (index !== -1) {
    const parenIndex = matchParen(userInput, index)
    if (parenIndex === matchParen(userInput, index + 1) + 1) {
      userInput =
        userInput.slice(0, index) +
        userInput.slice(index + 1, parenIndex) +
        userInput.slice(parenIndex + 1)
      index = userInput.indexOf("((")
    } else {
      index = userInput.indexOf("((", index + 1)
    }
  }
  if (userInput[0] === "(" && matchParen(userInput, 0) === userInput.length - 1) {
    userInput = userInput.slice(1, -1)
  }
  const matches = userInput.matchAll(/[a-zI]{2,}/g)
  for (const match of matches) {
    if (
      (userInput[match.index + match[0].length] !== "(" &&
        match[0] !== "Infinity" &&
        match[0] !== "pi") ||
      /d[a-z]/.test(match[0])
    ) {
      userInput =
        userInput.slice(0, match.index) +
        `(${match[0]})` +
        userInput.slice(match.index + match[0].length)
    }
  }
  return userInput
}

const parseDifferential = (userInput) => {
  let index = userInput.search(/\(d\)\/\(d[a-z]\)\(/)
  while (index !== -1) {
    const parenIndex = matchParen(userInput, index + 8)
    userInput =
      userInput.slice(0, index) +
      `diff${userInput.slice(index + 8, parenIndex)},${userInput[index + 6]}` +
      userInput.slice(parenIndex)
    index = userInput.search(/\(d\)\/\(d[a-z]\)\(/)
  }
  return userInput
}

/**
 * Parses implied multiplication by adding "*" after ")" unless an operation follows.
 */
const parseImplied = (userInput) => {
  let index = userInput.indexOf(")")
  let op = ["+", "-", "*", "/", ")", "^", ",", "!"]
  while (index !== -1) {
    const nextIndex = index + 1
    if (!op.includes(userInput[nextIndex]) && index !== userInput.length - 1) {
      userInput = userInput.slice(0, nextIndex) + "*" + userInput.slice(nextIndex)
    }
    index = userInput.indexOf(")", nextIndex)
  }
  return userInput
}

/**
 * Parses unary operations.
 * @param {String} userInput
 * @param {String} opName operation function name
 * @param {Number} opIndex index of chosen operation
 * @returns {String} parsed userInput
 */
const parseUnaryOp = (userInput, opName, opIndex) => {
  let param, paramStart
  // checks for negation
  if ((!userInput[opIndex - 1] || userInput[opIndex - 1] !== ")") && opName === "subtract") {
    const zero = "([0,0])"
    param += zero
    opIndex += zero.length
    userInput = param + userInput.slice(opIndex)
  }
  // checks format (x)#
  if (userInput[opIndex - 1] === ")") {
    const parenIndex = matchParen(userInput, opIndex - 1, false)
    paramStart = userInput.lastIndexOf("(", parenIndex)
    param = userInput.slice(paramStart + 1, opIndex - 1)
    // checks format func(x)#
    while (userInput[paramStart - 1] && /[a-z]/.test(userInput[paramStart - 1])) {
      paramStart--
      param = userInput.slice(paramStart, opIndex)
    }
  } else {
    param = ""
    paramStart = opIndex
  }
  return userInput.slice(0, paramStart) + `${opName}(${param})`
}

/**
 * Parses binary operations.
 * @param {String} userInput
 * @param {String} opName operation function name
 * @param {Number} opIndex index of chosen operation
 * @returns {String} parsed userInput
 */
const parseBinaryOp = (userInput, opName, opIndex) => {
  let secondParam, secondParamEnd
  if (userInput[opIndex + 1] === "(") {
    // checks format x#(y)
    const parenIndex = matchParen(userInput, opIndex + 1)
    secondParamEnd = userInput.indexOf(")", parenIndex)
    secondParam = userInput.slice(opIndex + 2, secondParamEnd)
  } else if (!userInput[opIndex + 1] || /[+*/^,\)]/.test(userInput[opIndex + 1])) {
    secondParamEnd = opIndex
    secondParam = ""
  } else {
    // checks formats x#func(y), x#-(y), and x#-func(y)
    let i = 1
    while (userInput[opIndex + i] && userInput[opIndex + i] !== "(") {
      i++
    }
    if (!userInput[opIndex + i]) {
      secondParamEnd = opIndex
      secondParam = ""
    } else {
      const parenIndex = matchParen(userInput, opIndex + i)
      secondParamEnd = userInput.indexOf(")", parenIndex)
      secondParam = userInput.slice(opIndex + 1, secondParamEnd + 1)
    }
  }
  const firstHalf = parseUnaryOp(userInput, opName, opIndex).slice(0, -1)
  return `${firstHalf},${secondParam})${userInput.slice(secondParamEnd + 1)}`
}

/**
 * Formats all forms of x! as fac(x).
 */
const parseFactorial = (userInput) => {
  let opIndex = userInput.indexOf("!")
  while (opIndex !== -1) {
    userInput = parseUnaryOp(userInput, "fac", opIndex) + userInput.slice(opIndex + 1)
    opIndex = userInput.indexOf("!")
  }
  return userInput
}

/**
 * Formats all forms of x^y as pow(x,y), starting from the right.
 */
const parseCaret = (userInput) => {
  let opIndex = userInput.lastIndexOf("^")
  while (opIndex !== -1) {
    userInput = parseBinaryOp(userInput, "pow", opIndex)
    // replaces e^(x) with exp(x)
    userInput = userInput.replace("pow(([e,0]),", "exp(")
    opIndex = userInput.lastIndexOf("^")
  }
  return userInput
}

/**
 * Formats one complex operation, starting from the left.
 * @param {String} userInput
 * @param {String} opSymbol the symbol to parse
 * @param {String} opName operation function name
 * @returns {String} parsed user input
 */
const parseComplexOp = (userInput, opSymbol, opName) => {
  // avoids parsing + or - in 1.2e+10 format
  const re = new RegExp(`\\${opSymbol}(?!(?<=\\de\\${opSymbol})\\d{1,3}[^\\d.])`)
  let opIndex = userInput.search(re)
  while (opIndex !== -1) {
    userInput = parseBinaryOp(userInput, opName, opIndex)
    opIndex = userInput.search(re)
  }
  return userInput
}

/**
 * Converts user input in order of func() > factorial > caret > divide > multiply > subtract > add.
 */
export const parseInput = (userInput) => {
  userInput = parseDifferential(verifyInput(parseConst(userInput)))
  userInput = parseCaret(parseFactorial(parseImplied(userInput)))
  userInput = parseComplexOp(userInput, "/", "divide")
  userInput = parseComplexOp(userInput, "*", "multiply")
  userInput = parseComplexOp(userInput, "-", "subtract")
  userInput = parseComplexOp(userInput, "+", "add")
  return userInput
}

/**
 * Parses prepared expression into args and function name.
 * @param {String} expression an expression without unparsed symbols or constants
 * @returns {{args: String[], name: String}}
 *  an object of an arguments array and the function name
 */
export const parseExp = (expression) => {
  if (expression[0] === "(" && matchParen(expression, 0) === expression.length - 1) {
    expression = expression.slice(1, -1)
  }
  let index = expression.indexOf("(")
  const name = expression.slice(0, index)
  if (index === -1) return { args: [expression], name: "identity" }
  const args = []
  let j = 0
  let k = 1
  let movingIndex = index
  // separates arguments by commas not enclosed in brackets
  while (j !== -1 && k < expression.length - index) {
    if (expression[index + k] === "(" || expression[index + k] === "[") {
      j++
      movingIndex = index + k
    } else if (expression[index + k] === ")" || expression[index + k] === "]") {
      j--
      if (j === -1) args.push(expression.slice(index + 1, -1))
      movingIndex = index + k
    } else if (expression[index + k] === "," && j === 0) {
      movingIndex = index + k
      args.push(expression.slice(index + 1, movingIndex))
      index = movingIndex
      k = 0
    }
    k++
  }
  return { args, name }
}
