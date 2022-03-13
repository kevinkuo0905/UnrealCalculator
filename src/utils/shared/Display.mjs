/**
 * Outputs are processed into TeX format for use by the MathJAX library for displaying math.
 */

/**
 * Cleans up result from TeX output.
 * @param {Array | Expression} result preprocessed output from user input
 * @param {Number} n number of digits to round to
 * @returns {String} cleaned up result in TeX format
 */
export default function display(result, n) {
  if (Array.isArray(result)) return displayComplex(result, n)
  return toTeX(result, n)
    .replace(/\+-/g, "-")
    .replace(/(?<![\d.])1([a-z\\](?!cdot))/g, "$1")
    .replace(/(?<![\d.])1\(/g, "(")
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
 * Checks for whether the ith arg is a sum or difference to be wrapped in parentheses.
 */
const needsParen = ({ args }, i) =>
  args[i].operation.name === "add" ||
  args[i].operation.name === "subtract" ||
  (Array.isArray(args[i].args[0]) && args[i].args[0][0] !== 0 && args[i].args[0][1] !== 0)

/**
 * Recursively parses each operation into proper TeX format.
 */
const toTeX = ({ operation, args }, n) => {
  if (rules[operation.name]) return rules[operation.name]({ operation, args }, n)
  if (trigInverse.includes(operation.name)) return rules.trigInverse({ operation, args })
  return rules.etc({ operation, args })
}

const rules = {
  identity: ({ args: [arg] }, n) => {
    if (typeof arg === "string") return arg
    return displayComplex(arg, n)
  },

  abs: ({ args: [arg] }) => {
    return `|${toTeX(arg)}|`
  },

  add: ({ args }) => {
    return args.map((arg) => toTeX(arg)).join("+")
  },

  subtract: ({ args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    if (mappedArgs[0] === "0") mappedArgs[0] = ""
    if (needsParen({ args }, 1)) return `${mappedArgs[0]}-(${mappedArgs[1]})`
    return mappedArgs.join("-")
  },

  multiply: ({ args }) => {
    const mappedArgs = args.map((arg, i) => {
      if (needsParen({ args }, i)) return `(${toTeX(arg)})`
      const mathConsts = ["e", "\\pi ", "i", "\\infty "]
      if (i !== 0 && (/\d|-/.test(toTeX(arg)[0]) || mathConsts.includes(toTeX(arg))))
        return `\\cdot ${toTeX(arg)}`
      return toTeX(arg)
    })
    return mappedArgs.join("")
  },

  divide: ({ args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    return `\\frac{${mappedArgs[0]}}{${mappedArgs[1]}}`
  },

  floor: ({ args: [arg] }) => {
    return `\\lfloor{${toTeX(arg)}}\\rfloor `
  },

  ceil: ({ args: [arg] }) => {
    return `\\lceil{${toTeX(arg)}}\\rceil `
  },

  exp: ({ args: [arg] }) => {
    return `e^{${toTeX(arg)}}`
  },

  fac: ({ args: [arg] }) => {
    if (needsParen({ args: [arg] }, 0)) return `(${toTeX(arg)})!`
    return `${toTeX(arg)}!`
  },

  npr: ({ args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    return `_{${mappedArgs[0]}}P_{${mappedArgs[1]}}`
  },

  ncr: ({ args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    return `_{${mappedArgs[0]}}C_{${mappedArgs[1]}}`
  },

  pow: ({ args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    if (needsParen({ args }, 0)) return `(${mappedArgs[0]})^{${mappedArgs[1]}}`
    return `{${mappedArgs[0]}}^{${mappedArgs[1]}}`
  },

  sqrt: ({ args: [arg] }) => {
    return `\\sqrt{${toTeX(arg)}}`
  },

  trigInverse: ({ operation, args: [arg] }) => {
    return `\\${operation.name.slice(3)}^{-1}(${toTeX(arg)})`
  },

  etc: ({ operation, args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    return `\\${operation.name}(${mappedArgs.join(",")})`
  },

  diff: ({ args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    if (mappedArgs.length === 1) return `d(${mappedArgs[0]})`
    if (mappedArgs[1].length === 1) return `\\frac{d}{d${mappedArgs[1]}}(${mappedArgs[0]})`
    return `\\frac{d}{d(${mappedArgs[1]})}(${mappedArgs[0]})`
  },

  badFunction: ({ operation, args }) => {
    const mappedArgs = args.map((arg) => toTeX(arg))
    let name
    try {
      operation()
    } catch (error) {
      name = error.message.replace(/Function: ([^ ]+) .+/, "$1")
    }
    return `${name}(${mappedArgs.join(",")})`
  },
}
