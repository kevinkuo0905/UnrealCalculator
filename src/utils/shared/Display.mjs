/**
 * Outputs are processed into TeX format for use by the MathJAX library for displaying math.
 */

/**
 * Cleans up result from TeX output.
 * @param {Array | Expression} result preprocessed output from user input
 * @param {Number} n number of digits to round to
 * @returns {String} cleaned up result in TeX format
 */
export default function display(result, n=16) {
  if (Array.isArray(result)) return displayComplex(result, n)
  return toTeX(result, n)
    .replace(/\+-/g, "-")
    .replace(/(?<![\d.])1([a-z\\](?!cdot|right))/g, "$1")
}

const trigInverse = ["arcsin", "arccos", "arctan", "arccsc", "arcsec", "arccot"]

const floor = (x) => (x < 1 && x >= 0 ? 0 : x - (((x % 1) + 1) % 1))

const round = (x, n) => {
  if (x === Infinity || x === -Infinity) return x
  let places = 1
  for (let i = 0; i < n; i++) {
    places *= 10
  }
  if (x * places - floor(x * places) >= 0.5) return (floor(x * places) + 1) / places
  return floor(x * places) / places
}

/**
 * Parses a complex number in array form back to a+bi form in scientific notation if necessary.
 * @param {[Number, Number]} c
 * @param {Number} n number of digits to round to, default 12
 * @returns {String} stringified output
 */
const displayComplex = (c, n = 12) => {
  if (c[0] === "pi") return "\\pi "
  if (c[0] === "e") return "e"
  if (c[0] === 0 && c[1] === 0) return "0"
  if (isNaN(c[0]) || isNaN(c[1])) return "\\textrm{undefined}"
  c = c.map((part) => {
    const str = part.toString()
    if (/e[+-]\d/.test(str)) {
      const index = str.indexOf("e")
      return round(Number(str.slice(0, index)), n).toString() + str.slice(index)
    }
    return round(part, n).toString()
  })
  return `${c[0]}+${c[1]}i`
    .replace(/^0\+|\+0i$/g, "")
    .replace(/(?<![\d.])1i/g, "i")
    .replace(/Infinity/g, "\\infty ")
    .replace(/([1-9]+\.?\d*)e([+-]\d{1,3})/g, "$1\\cdot10^{$2}")
    .replace(/\{\+/, "{")
}

/**
 * Checks for whether the ith arg is to be wrapped in parentheses.
 */
const needsParen = ({ args }, i, pow = false) =>
  (pow && args[i].operation.name === "divide") ||
  args[i].operation.name === "add" ||
  args[i].operation.name === "subtract" ||
  (Array.isArray(args[i].args[0]) && args[i].args[0][0] !== 0 && args[i].args[0][1] !== 0)

/**
 * Recursively parses each operation into proper TeX format.
 */
const toTeX = ({ operation, args }, n) => {
  if (rules[operation.name]) return rules[operation.name]({ operation, args }, n)
  if (trigInverse.includes(operation.name)) return rules.trigInverse({ operation, args }, n)
  return rules.etc({ operation, args }, n)
}

const rules = {
  identity: ({ args: [arg] }, n) => {
    if (typeof arg === "string") return arg
    return displayComplex(arg, n)
  },

  abs: ({ args: [arg] }, n) => {
    return `|${toTeX(arg, n)}|`
  },

  add: ({ args }, n) => {
    return args.map((arg) => toTeX(arg, n)).join("+")
  },

  subtract: ({ args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    if (mappedArgs[0] === "0") mappedArgs[0] = ""
    if (needsParen({ args }, 1)) return `${mappedArgs[0]}-\\left(${mappedArgs[1]}\\right)`
    return mappedArgs.join("-")
  },

  multiply: ({ args }, n) => {
    const mappedArgs = args.map((arg, i) => {
      if (needsParen({ args }, i)) return `\\left(${toTeX(arg, n)}\\right)`
      const mathConsts = ["e", "\\pi ", "i", "\\infty "]
      if (i !== 0 && (/\d|-/.test(toTeX(arg, n)[0]) || mathConsts.includes(toTeX(arg, n))))
        return `\\cdot ${toTeX(arg, n)}`
      return toTeX(arg, n)
    })
    return mappedArgs.join("")
  },

  divide: ({ args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    return `\\frac{${mappedArgs[0]}}{${mappedArgs[1]}}`
  },

  floor: ({ args: [arg] }, n) => {
    return `\\lfloor{${toTeX(arg, n)}}\\rfloor `
  },

  ceil: ({ args: [arg] }, n) => {
    return `\\lceil{${toTeX(arg, n)}}\\rceil `
  },

  exp: ({ args: [arg] }, n) => {
    return `e^{${toTeX(arg, n)}}`
  },

  fac: ({ args: [arg] }, n) => {
    if (needsParen({ args: [arg] }, 0)) return `\\left(${toTeX(arg, n)}\\right)!`
    return `${toTeX(arg, n)}!`
  },

  npr: ({ args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    return `_{${mappedArgs[0]}}P_{${mappedArgs[1]}}`
  },

  ncr: ({ args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    return `_{${mappedArgs[0]}}C_{${mappedArgs[1]}}`
  },

  pow: ({ args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    if (needsParen({ args }, 0, true)) return `\\left(${mappedArgs[0]}\\right)^{${mappedArgs[1]}}`
    return `{${mappedArgs[0]}}^{${mappedArgs[1]}}`
  },

  sqrt: ({ args: [arg] }, n) => {
    return `\\sqrt{${toTeX(arg, n)}}`
  },

  trigInverse: ({ operation, args: [arg] }, n) => {
    return `\\${operation.name.slice(3)}^{-1}\\left(${toTeX(arg, n)}\\right)`
  },

  etc: ({ operation, args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    return `\\${operation.name}\\left(${mappedArgs.join(",")}\\right)`
  },

  diff: ({ args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    if (mappedArgs.length === 1) return `\\textrm{d}\\left(${mappedArgs[0]}\\right)`
    if (mappedArgs[1].length === 1)
      return `\\frac{\\textrm{d}}{\\textrm{d}${mappedArgs[1]}}\\left(${mappedArgs[0]}\\right)`
    return (
      `\\frac{\\textrm{d}}{\\textrm{d}\\left(${mappedArgs[1]}\\right)}` +
      `\\left(${mappedArgs[0]}\\right)`
    )
  },

  badFunction: ({ operation, args }, n) => {
    const mappedArgs = args.map((arg) => toTeX(arg, n))
    let name
    try {
      operation()
    } catch (error) {
      name = error.message.replace(/Function: ([^ ]+) .+/, "$1")
    }
    return `${name}\\left(${mappedArgs.join(",")}\\right)`
  },
}
