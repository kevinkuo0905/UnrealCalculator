/*
 * Parsing functions to verify syntax and parse user input into valid Expressions.
 * TODO: parse absolute value, round as string
 */

/**
 * Formats all numbers and constants as complex numbers. Spaces are removed, numbers
 * and variables are enclosed in parentheses, and double parenthesis are removed.
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
const parseConst = (userInput) =>
  userInput
    .replace(/ /g, "")
    .replace(/(?<!\w|\.)([1-9]+\.?\d*e[+-]\d{1,3}|\d+\.?\d*|\.\d+)(?!\d|\.)/g, "([$1,0])")
    .replace(/inf(?:inity)?/g, "([Infinity,0])")
    .replace(/(?<![a-df-hj-z])i(?![a-df-hj-oq-z])/g, "([0,1])")
    .replace(/(?<![a-df-hj-z])e(?!(?<=\de)[+-]\d{1,3}|[a-df-oq-z])/g, "([e,0])")
    .replace(/(?<![a-hj-z])pi(?![a-oq-z])/g, "([pi,0])")
    .replace(/(?<!\w)([a-df-hj-z])(?!\w)/g, "($1)")
    .replace(/(?<=\()\((\[[^,]+,[^,]+\])\)(?=,)/g, "$1")
    .replace(/(?<=,)\((\[[^,]+,[^,]+\])\)(?=,)/g, "$1")
    .replace(/(?<=,)\((\[[^,]+,[^,]+\])\)(?=\))/g, "$1")
    .replace(/(?<=\()\(([a-z])\)(?=,)/g, "$1")
    .replace(/(?<=,)\(([a-z])\)(?=,)/g, "$1")
    .replace(/(?<=,)\(([a-z])\)(?=\))/g, "$1")

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
 * Removes extra parentheses and verifies matching sets of parentheses.
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
const verifyInput = (userInput) => {
  let index = userInput.indexOf("((")
  while (index !== -1) {
    const parenEnd = matchParen(userInput, index)
    if (parenEnd === matchParen(userInput, index + 1) + 1) {
      userInput =
        userInput.slice(0, index) +
        userInput.slice(index + 1, parenEnd) +
        userInput.slice(parenEnd + 1)
      index = userInput.indexOf("((")
    } else {
      index = userInput.indexOf("((", index + 1)
    }
  }
  const matches = userInput.matchAll(/[a-z]{2,}/gi)
  for (const match of matches) {
    if (
      !(match[0] === "Infinity" || match[0] === "e" || match[0] === "pi") &&
      userInput[match.index + match[0].length] !== "("
    )
      throw new SyntaxError(`Variable: ${match[0]} must be a single character.`)
  }
  let i = 0
  let j = 0
  while (i < userInput.length && j > -1) {
    if (userInput[i] === "(") j++
    if (userInput[i] === ")") j--
    i++
  }
  if (j !== 0) throw new SyntaxError("Mismatched parentheses.")
  if (userInput[0] === "(" && matchParen(userInput, 0) === userInput.length - 1) {
    userInput = userInput.slice(1, -1)
  }
  if (userInput.length === 0) throw new SyntaxError("Enter something...")
  return userInput
}

/**
 * Parses implied multiplication by adding "*" after ")" unless an operation follows.
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
const parseImplied = (userInput) => {
  let parenIndex = userInput.indexOf(")")
  let op = ["+", "-", "*", "/", ")", "^", ",", "!"]
  while (parenIndex !== -1) {
    const nextIndex = parenIndex + 1
    if (!op.includes(userInput[nextIndex]) && parenIndex !== userInput.length - 1) {
      userInput = userInput.slice(0, nextIndex) + "*" + userInput.slice(nextIndex)
    }
    parenIndex = userInput.indexOf(")", nextIndex)
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
  let param = userInput.slice(0, opIndex)
  let paramStart = 0
  // checks for negation
  if ((!userInput[opIndex - 1] || userInput[opIndex - 1] !== ")") && opName === "subtract") {
    const zero = "([0,0])"
    param += zero
    opIndex += zero.length
    userInput = param + userInput.slice(opIndex)
  }
  // checks format (x)#
  const parenIndex = matchParen(userInput, opIndex - 1, false)
  param = userInput.slice(userInput.lastIndexOf("(", parenIndex) + 1, opIndex - 1)
  paramStart = userInput.lastIndexOf("(", parenIndex)
  // checks format func(x)#
  while (userInput[paramStart - 1] && /[a-zA-Z]/.test(userInput[paramStart - 1])) {
    paramStart--
    param = userInput.slice(paramStart, opIndex)
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
  let secondParam = userInput.slice(opIndex + 1)
  let secondParamEnd = userInput.length - 1
  if (userInput[opIndex + 1] === "(") {
    // checks format x#(y)
    const parenIndex = matchParen(userInput, opIndex + 1)
    secondParamEnd = userInput.indexOf(")", parenIndex)
    secondParam = userInput.slice(opIndex + 2, secondParamEnd)
  } else {
    // checks formats x#func(y), x#-(y), and x#-func(y)
    let i = 1
    while (userInput[opIndex + i] && userInput[opIndex + i] !== "(") {
      i++
    }
    const parenIndex = matchParen(userInput, opIndex + i)
    secondParamEnd = userInput.indexOf(")", parenIndex)
    secondParam = userInput.slice(opIndex + 1, secondParamEnd + 1)
  }
  const firstHalf = parseUnaryOp(userInput, opName, opIndex).slice(0, -1)
  return `${firstHalf},${secondParam})${userInput.slice(secondParamEnd + 1)}`
}

/**
 * Formats all forms of x! as fac(x).
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
const parseFactorial = (userInput) => {
  let opIndex = userInput.lastIndexOf("!")
  while (opIndex !== -1) {
    userInput = parseUnaryOp(userInput, "fac", opIndex) + userInput.slice(opIndex + 1)
    opIndex = userInput.lastIndexOf("!")
  }
  return userInput
}

/**
 * Formats all forms of x^y as pow(x,y), starting from the right.
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
const parseCaret = (userInput) => {
  let opIndex = userInput.lastIndexOf("^")
  while (opIndex !== -1) {
    userInput = parseBinaryOp(userInput, "pow", opIndex)
    // replaces e^(x) with exp(x)
    userInput = userInput.replace("pow([e,0],", "exp(")
    opIndex = userInput.lastIndexOf("^")
  }
  return userInput
}

/**
 * Formats one complex operation, starting from the left.
 * @param {String} userInput
 * @returns {String} parsed userInput
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
 * Parses prepared expression into args and function name.
 * @param {String} expression an expression without unparsed symbols or constants
 * @returns {{args: String[], name: String, expression: String}}
 *  an object of an arguments array, function name, and original expression
 */
export const parseExp = (expression) => {
  let index = expression.indexOf("(")
  const name = expression.slice(0, index)
  if (index === -1) return { args: [expression], name: "none", expression }
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
  return { args, name, expression }
}

/**
 * Parses multiple arguments for addition and multiplication.
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
const parseGroups = (userInput) => {
  // checks for the same operation within an operation and merges the arguments
  const parseGroup = (userInput, op) => {
    const re = new RegExp(op)
    let index = userInput.search(re)
    while (index !== -1) {
      const parenIndex = matchParen(userInput, index + op.length + 1)
      const allArgs = []
      const { args } = parseExp(userInput.slice(index, parenIndex + 1))
      for (let i = 0; i < args.length; i++) {
        if (args[i].slice(0, op.length) === op) {
          const nestedArgs = parseExp(args[i]).args
          for (let j = 0; j < nestedArgs.length; j++) {
            allArgs.push(nestedArgs[j])
          }
        } else {
          allArgs.push(args[i])
        }
      }
      userInput =
        userInput.slice(0, index) + `${op}(${allArgs.join(",")})` + userInput.slice(parenIndex + 1)
      if (allArgs.length === args.length) {
        userInput = userInput.replace(re, "$TEMP")
        index = userInput.search(re)
      }
    }
    userInput = userInput.replace(/\$TEMP/g, op)
    return userInput
  }
  let initialExpression
  while (initialExpression !== userInput) {
    initialExpression = userInput
    userInput = parseGroup(userInput, "multiply")
    userInput = parseGroup(userInput, "add")
  }
  return userInput
}

/**
 * Converts user input in order of func() > factorial > caret > divide > multiply > subtract > add.
 * Removes parentheses for singular item.
 * @param {String} userInput
 * @returns {String} parsed userInput
 */
export const parseInput = (userInput) => {
  userInput = parseCaret(parseFactorial(parseImplied(verifyInput(parseConst(userInput)))))
  userInput = parseComplexOp(userInput, "/", "divide")
  userInput = parseComplexOp(userInput, "*", "multiply")
  userInput = parseComplexOp(userInput, "-", "subtract")
  userInput = parseComplexOp(userInput, "+", "add")
  return parseGroups(userInput)
}

/**
 * Parses complex numbers in array form back to a+bi form.
 * @param {[Number, Number]} c
 * @returns {String}
 */
export const displayComplex = (c) => {
  if (isNaN(c[0]) || isNaN(c[1])) {
    return "undefined"
  } else if (c[1] === 0) {
    return `${c[0]}`
  } else if (c[0] === 0) {
    if (c[1] === 1) {
      return "i"
    } else if (c[1] === -1) {
      return "-i"
    } else {
      return `${c[1]}i`
    }
  } else if (c[1] > 0) {
    return c[1] === 1 ? `${c[0]}+i` : `${c[0]}+${c[1]}i`
  } else {
    return c[1] === -1 ? `${c[0]}-i` : `${c[0]}-${-c[1]}i`
  }
}
