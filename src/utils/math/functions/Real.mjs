/**
 * Real valued functions constructed from Taylor series and domain extension.
 * Argument reduction methods are used to evaluate Taylor series near their centers.
 * Ranges may seem arbitrary, but they are optimized for speed and accuracy.
 */

import { DomainError } from "../shared/Errors.mjs"

const inf = Infinity

export const sgn = (x) => {
  if (x > 0) return 1
  if (x < 0) return -1
  return 0
}

export function abs(x) {
  return x < 0 ? -x : x
}

const max2 = (x, y) => (x > y ? x : y)

export function max(...n) {
  if (n.length === 1) return n[0]
  let max = max2(n[0], n[1])
  for (let i = 2; i < n.length; i++) {
    max = max2(max, n[i])
  }
  return max
}

const min2 = (x, y) => (x < y ? x : y)

export function min(...n) {
  if (n.length === 1) return n[0]
  let min = min2(n[0], n[1])
  for (let i = 2; i < n.length; i++) {
    min = min2(min, n[i])
  }
  return min
}

export function floor(x) {
  return x < 1 && x >= 0 ? 0 : x - (((x % 1) + 1) % 1)
}

export const isInteger = (x) => floor(x) === x

export function ceil(x) {
  return isInteger(x) ? x : floor(x) + 1
}

export const intPow = (x, y) => {
  if (isNaN(x)) return NaN
  let prod = 1
  if (y >= 0) {
    for (let i = 1; i <= y; i++) {
      prod *= x
    }
    return prod
  }
  for (let i = 1; i <= -y; i++) {
    prod *= x
  }
  return 1 / prod
}

/**
 * Rounds x to n decimal places to prevent rounding errors from affecting
 * domain sensitive functions, if |x|>=1, rounds to n significant figures instead.
 */
export const round = (x, n) => {
  if (abs(x) === inf) return x
  let digits = 1
  if (abs(x) >= 1) {
    let a = x
    for (let i = 0; i < digits; i++) {
      a /= 10
      if (a >= 1) digits++
    }
  }
  const accuracy = abs(x) >= 1 ? intPow(10, n - digits) : intPow(10, n)
  if (x * accuracy - floor(x * accuracy) >= 0.5) return (floor(x * accuracy) + 1) / accuracy
  return floor(x * accuracy) / accuracy
}

/**
 * Factorial domain is limited to nonnegative integers.
 */
export function fac(n) {
  n = round(n, 15)
  if (n < 0 || !isInteger(n)) throw new DomainError("Nonnegative integers only.")
  if (n > 175) return inf
  let prod = 1
  for (let i = 1; i <= n; i++) {
    prod *= i
  }
  return prod
}

/**
 * Permutation domain is limited to nonnegative integers.
 */
export function npr(n, r) {
  if (n < 0 || !isInteger(round(n, 15)) || r < 0 || !isInteger(round(r, 15)))
    throw new DomainError("Nonnegative integers only.")
  if (r > n) throw new DomainError("r cannot be greater than n.")
  let prod = 1
  for (let i = n; i > n - r; i--) {
    prod *= i
  }
  return prod
}

/**
 * Combination domain is limited to nonnegative integers.
 */
export function ncr(n, r) {
  return npr(n, r) / fac(r)
}

/**
 * Factors any integer less than 10^16.
 */
export const factorInt = (x) => {
  if (x >= intPow(10, 16)) return [x]
  let factors = []
  if (x === 2) return [2]
  for (let i = 2; i <= sqrt(x) + 1; i++) {
    if (x % i === 0) return factors.concat(i, factorInt(x / i))
  }
  return [x]
}

/**
 * Greatest common divisor returns 1 for any non-integer.
 */
const gcd2 = function (n, r) {
  if (!isInteger(n) || !isInteger(r)) return 1
  if (r === 0 || n === 0) return abs(r) || abs(n)
  let gcd = [min2(n, r), max2(n, r) % min2(n, r)]
  while (gcd[0] !== 0 && gcd[1] !== 0) {
    const flip = [gcd[1], gcd[0]]
    gcd = [flip[0], flip[1] % flip[0]]
  }
  return abs(gcd[0])
}

export function gcd(...n) {
  if (n.length === 1) return abs(n[0])
  let gcd = gcd2(n[0], n[1])
  for (let i = 2; i < n.length; i++) {
    gcd = gcd2(gcd, n[i])
  }
  return gcd
}

/**
 * Series expansion for e^x
 */
const expT = (x) => {
  let sum = 0
  for (let i = 0; i < 23; i++) {
    sum += intPow(x, i) / fac(i)
  }
  return sum
}

/**
 * Converts argument to [-2,2] if necessary. Uses identity e^x=(e^(x/ceil(x/2)))^ceil(x/2).
 */
export function exp(x) {
  if (x > 1000) return inf
  if (x < -1000) return 0
  if (x === 0) return 1
  return intPow(expT(x / ceil((sgn(x) * x) / 2)), ceil((sgn(x) * x) / 2))
}

/**
 * Definition of e
 */
export const e = exp(1)

/**
 * Series expansion for ln(x), valid for 0<x<2
 */
const lnT = (x) => {
  let sum = 0
  for (let i = 1; i < 26; i++) {
    sum += intPow(1 - x, i) / i
  }
  return 0 - sum
}

/**
 * Converts to modified floating point with significand on [6/7,8/7] for domain extension of ln(x).
 */
const float = (x) => {
  let power = 0
  let significand
  let i = x
  if (x >= 1) {
    while (i >= 8 / 7) {
      power++
      significand = i / (4 / 3)
      i /= 4 / 3
    }
    return [significand, power]
  }
  while (i <= 6 / 7) {
    power--
    significand = i * (4 / 3)
    i *= 4 / 3
  }
  return [significand, power]
}

/**
 * Converts argument to [6/7,8/7] if necessary. Uses identity ln(x)=ln(x/k^n)-n*ln(1/k) with k=4/3.
 */
export function ln(x) {
  if (x < 0) return NaN
  if (x === inf) return inf
  if (x === 0) return -inf
  if (x > 6 / 7 && x < 8 / 7) return lnT(x)
  return lnT(float(x)[0]) - float(x)[1] * lnT(3 / 4)
}

export function log(x) {
  return ln(x) / ln(10)
}

/**
 * Uses e^(y*lnx) to calculate x^y. Non-integer powers of negative numbers return NaN.
 */
export function pow(x, y) {
  const a = round(x, 15)
  const b = round(y, 15)
  if (a === inf) {
    if (b > 0) return inf
    if (b < 0) return 0
    return NaN
  }
  if (a === 1) {
    if (abs(b) !== inf) return 1
    return NaN
  }
  if (a === 0) {
    if (b > 0) return 0
    if (b === 0) return NaN
    if (b < 0) return inf
    return NaN
  }
  if (b > intPow(10, 8)) {
    if (a > 1.01) return inf
    if (a > 0 && a < 0.99) return 0
    if (a < 0) return NaN
  }
  if (b < -intPow(10, 8)) {
    if (a > 1.01) return 0
    if (a >= 0 && a < 0.99) return inf
    if (a < 0) return NaN
  }
  if ((abs(a) > 1.01 || abs(a) < 0.99) && isInteger(b)) {
    return intPow(x, b)
  }
  if (a > 0) {
    return exp(y * ln(x))
  }
  return NaN
}

/**
 * Babylonian algorithm is more efficient than defining square root as power of 0.5.
 */
export function sqrt(x) {
  if (x < 0) return NaN
  let root = x
  while (root - 0.5 * (root + x / root)) {
    root = 0.5 * (root + x / root)
  }
  return root
}

/**
 * Series expansion for arctan(x), valid for -1<x<1
 */
const arctanT = (x) => {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += (intPow(-1, i) * intPow(x, 2 * i + 1)) / (2 * i + 1)
  }
  return sum
}

/**
 * Converts argument to [-0.414,0.414].
 * Uses identity arctan(x)=4arctanT(x/(1+sqrt(1+x^2)+sqrt(2(x^2+1+sqrt(1+x^2))))).
 */
export function arctan(x, degreeMode = false) {
  if (abs(x) > intPow(10, 16)) return ((sgn(x) * pi) / 2) * (degreeMode ? 180 / pi : 1)
  const a = sqrt(x * x + 1)
  return 4 * arctanT(x / (1 + a + sqrt(2 * (x * x + 1 + a)))) * (degreeMode ? 180 / pi : 1)
}

/**
 * Definition of pi
 */
export const pi = 6 * arctan(1 / sqrt(3))

export function arcsin(x, degreeMode = false) {
  return 2 * arctan(x / (1 + sqrt(1 - x * x)), degreeMode)
}

export function arccos(x, degreeMode = false) {
  return (pi / 2) * (degreeMode ? 180 / pi : 1) - arcsin(x, degreeMode)
}

export function arccsc(x, degreeMode = false) {
  return arcsin(1 / x, degreeMode)
}

export function arcsec(x, degreeMode = false) {
  return arccos(1 / x, degreeMode)
}

export function arccot(x, degreeMode = false) {
  return (pi / 2) * (degreeMode ? 180 / pi : 1) - arctan(x, degreeMode)
}

/**
 * Series expansion for sin(x)
 */
const sinT = (x) => {
  let sum = 0
  for (let i = 0; i < 15; i++) {
    sum += (intPow(-1, i) * intPow(x, 2 * i + 1)) / fac(2 * i + 1)
  }
  return sum
}

/**
 * Converts to [-pi/2,pi/2] if necessary. Uses identity sin(x)=sin(x-2pi*k).
 */
export function sin(x, degreeMode = false) {
  x *= degreeMode ? pi / 180 : 1
  if (isNaN(x) || abs(x) === inf) return NaN
  let reduced = x % (2 * pi)
  if (abs(reduced) > pi) reduced -= sgn(x) * 2 * pi
  if (abs(reduced) > pi / 2) reduced = sgn(x) * pi - reduced
  return round(sinT(reduced), 15)
}

export function cos(x, degreeMode = false) {
  return sin((pi / 2) * (degreeMode ? 180 / pi : 1) - x, degreeMode)
}

export function tan(x, degreeMode = false) {
  if (round(cos(x, degreeMode), 12) === 0) return inf
  return sin(x, degreeMode) / cos(x, degreeMode)
}

export function csc(x, degreeMode = false) {
  if (round(sin(x, degreeMode), 12) === 0) return inf
  return 1 / sin(x, degreeMode)
}

export function sec(x, degreeMode = false) {
  if (round(cos(x, degreeMode), 12) === 0) return inf
  return 1 / cos(x, degreeMode)
}

export function cot(x, degreeMode = false) {
  if (round(sin(x, degreeMode), 12) === 0) return inf
  return cos(x, degreeMode) / sin(x, degreeMode)
}
