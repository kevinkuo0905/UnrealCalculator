/**
 * Complex-valued functions are extended from real valued functions.
 * Any complex number a+bi is represented as an array [a,b].
 */

import { DomainError } from "../shared/Errors.mjs"
import {
  intPow,
  round as roundR,
  max as maxR,
  min as minR,
  floor as floorR,
  ceil as ceilR,
  fac as facR,
  npr as nprR,
  ncr as ncrR,
  gcd as gcdR,
  exp as expR,
  ln as lnR,
  pow as powR,
  sqrt as sqrtR,
  sin as sinR,
  cos as cosR,
  arctan as arctanR,
  pi
} from "./Real.mjs"

const inf = Infinity

const isEqual = (c1, c2) => c1[0] === c2[0] && c1[1] === c2[1]

/**
 * Argument of complex number c, also known as atan2
 * @param {[Number, Number]} c a complex number
 * @returns {Number} a real number only
 */
const arg = (c) => {
  if (c[0] === 0 && c[1] > 0) return [pi / 2, 0]
  if (c[0] === 0 && c[1] < 0) return [-pi / 2, 0]
  if (c[0] > 0 && c[1] !== 0) return [arctanR(c[1] / c[0]), 0]
  if (c[0] > 0 && c[1] === 0) return [0, 0]
  if (c[0] < 0 && c[1] >= 0) return [arctanR(c[1] / c[0]) + pi, 0]
  if (c[0] < 0 && c[1] < 0) return [arctanR(c[1] / c[0]) - pi, 0]
  return [NaN, NaN]
}

export function abs(c) {
  return [sqrtR(c[0] * c[0] + c[1] * c[1]), 0]
}

const toPolar = (c) => [abs(c)[0], arg(c)[0]]

const toRect = (z) => {
  if (cosR(z[1]) === 0) return [0, z[0] * sinR(z[1])]
  if (sinR(z[1]) === 0) return [z[0] * cosR(z[1]), 0]
  if (z[0] === 0) return [0, 0]
  return [z[0] * cosR(z[1]), z[0] * sinR(z[1])]
}

const add2 = (c1, c2) => {
  if (c1[1] === 0 && c2[1] === 0) return [c1[0] + c2[0], 0]
  return [c1[0] + c2[0], c1[1] + c2[1]]
}

const multiply2 = (c1, c2) => {
  if (c1[1] === 0 && c2[1] === 0) return [c1[0] * c2[0], 0]
  if (abs(c1)[0] === inf || abs(c2)[0] === inf)
    return toRect([toPolar(c1)[0] * toPolar(c2)[0], toPolar(c1)[1] + toPolar(c2)[1]])
  return [c1[0] * c2[0] - c1[1] * c2[1], c1[1] * c2[0] + c1[0] * c2[1]]
}

export function add(...c) {
  if (c.length === 1) return c[0]
  let sum = [0, 0]
  for (let i = 0; i < c.length; i++) {
    sum = add2(sum, c[i])
  }
  return sum
}

export function subtract(c1, c2) {
  if (c1[1] === 0 && c2[1] === 0) return [c1[0] - c2[0], 0]
  return [c1[0] - c2[0], c1[1] - c2[1]]
}

export function multiply(...c) {
  if (c.length === 1) return c[0]
  let prod = [1, 0]
  for (let i = 0; i < c.length; i++) {
    prod = multiply2(prod, c[i])
  }
  return prod
}

export function divide(c1, c2) {
  if (c1[1] === 0 && c2[1] === 0) return [c1[0] / c2[0], 0]
  if (isEqual(c2, [0, 0])) return [inf, 0]
  if (abs(c1)[0] === inf || abs(c2)[0] === inf)
    return toRect([toPolar(c1)[0] / toPolar(c2)[0], toPolar(c1)[1] - toPolar(c2)[1]])
  return [
    (c1[0] * c2[0] + c1[1] * c2[1]) / (c2[0] * c2[0] + c2[1] * c2[1]),
    (c1[1] * c2[0] - c1[0] * c2[1]) / (c2[0] * c2[0] + c2[1] * c2[1]),
  ]
}

export function max(...c) {
  if (c.some((num) => num[1] !== 0)) throw new DomainError("Real numbers only.")
  return [maxR(...c.map((num) => num[0])), 0]
}

export function min(...c) {
  if (c.some((num) => num[1] !== 0)) throw new DomainError("Real numbers only.")
  return [minR(...c.map((num) => num[0])), 0]
}

export function floor(c) {
  return [floorR(c[0]), floorR(c[1])]
}

export function ceil(c) {
  return [ceilR(c[0]), ceilR(c[1])]
}

const round = (c, n) => {
  return [roundR(c[0], n), roundR(c[1], n)]
}

export function fac(c) {
  if (round(c, 12)[1] !== 0) throw new DomainError("Real numbers only.")
  return [facR(c[0]), 0]
}

export function npr(n, r) {
  if (n[1] !== 0 || r[1] !== 0) throw new DomainError("Real numbers only.")
  return [nprR(n[0], r[0]), 0]
}

export function ncr(n, r) {
  if (n[1] !== 0 || r[1] !== 0) throw new DomainError("Real numbers only.")
  return [ncrR(n[0], r[0]), 0]
}

/**
 * Computes the greatest common divisor among the real and imaginary parts.
 */
const gcd2 = (c1, c2) => {
  if (divide(c1, c2)[1] === 0) {
    if (c1[0] > c2[0]) return c2
    return c1
  }
  return [gcdR(c1[0], c1[1], c2[0], c2[1]), 0]
}

export function gcd(...c) {
  if (c.length === 1) return c
  let gcd = gcd2(c[0], c[1])
  for (let i = 2; i < c.length; i++) {
    gcd = gcd2(gcd, c[i])
  }
  return gcd
}

export function exp(c) {
  return toRect([expR(c[0]), c[1]])
}

export function ln(c) {
  if (abs(c)[0] === inf) return [inf, 0]
  return [lnR(abs(c)[0]), arg(c)[0]]
}

export function log(c) {
  return divide(ln(c), ln([10, 0]))
}

export function pow(c1, c2) {
  const z = []
  const r1 = round(c1, 15)
  const r2 = round(c2, 15)
  if (r1[1] === 0 && r2[1] === 0 && r1[0] > 0) {
    return [powR(r1[0], r2[0]), 0]
  }
  if (isEqual(r1, [0, 0])) {
    if (r2[0] > 0) return [0, 0]
    if (r2[0] === 0) return [NaN, NaN]
    if (r2[0] < 0) return [inf, 0]
    return [NaN, NaN]
  }
  if (r2[0] > intPow(10, 15)) {
    if (abs(r1)[0] > 1) return [inf, 0]
    if (abs(r1)[0] >= 0 && abs(r1)[0] < 1) return [0, 0]
    return [NaN, NaN]
  }
  if (r2[0] < -intPow(10, 15)) {
    if (abs(r1)[0] > 1) return [0, 0]
    if (abs(r1)[0] >= 0 && abs(r1)[0] < 1) return [inf, 0]
    return [NaN, NaN]
  }
  z[0] = powR(abs(c1)[0], c2[0]) * expR(-c2[1] * arg(c1)[0])
  if (r2[1] === 0) {
    z[1] = c2[0] * arg(c1)[0]
  } else {
    z[1] = c2[0] * arg(c1)[0] + c2[1] * lnR(abs(c1)[0])
  }
  return toRect(z)
}

export function sqrt(c) {
  if (c[1] === 0 && c[0] > 0) return [sqrtR(c[0]), 0]
  return toRect([sqrtR(toPolar(c)[0]), arg(c)[0] / 2])
}

export function arctan(c, degreeMode = false) {
  if (c[0] > intPow(10, 12)) return degreeMode ? [90, 0] : [pi / 2, 0]
  if (c[0] < -intPow(10, 12)) return degreeMode ? [-90, 0] : [-pi / 2, 0]
  if (c[1] === 0) return [arctanR(c[0], degreeMode), 0]
  return multiply(
    degreeMode ? [180 / pi, 0] : [1, 0],
    [0, -0.5],
    ln(divide(subtract([0, 1], c), add([0, 1], c)))
  )
}

export function arcsin(c, degreeMode = false) {
  if (abs(c)[0] === inf) {
    if ((c[1] === 0 && c[0] < 0) || c[1] > 0) return [inf, 0]
    return [-inf, 0]
  }
  return arctan(divide(c, sqrt(subtract([1, 0], pow(c, [2, 0])))), degreeMode)
}

export function arccos(c, degreeMode = false) {
  return subtract(degreeMode ? [90, 0] : [pi / 2, 0], arcsin(c, degreeMode))
}

export function arccsc(c, degreeMode = false) {
  return arcsin(divide([1, 0], c), degreeMode)
}

export function arcsec(c, degreeMode = false) {
  return arccos(divide([1, 0], c), degreeMode)
}

export function arccot(c, degreeMode = false) {
  return subtract(degreeMode ? [90, 0] : [pi / 2, 0], arctan(c, degreeMode))
}

export function sin(c, degreeMode = false) {
  if (degreeMode) c = multiply(c, [pi / 180, 0])
  if (abs(c)[0] === inf && c[0] !== 0) return [NaN, NaN]
  if (c[1] === 0) return [sinR(c[0]), 0]
  return divide(subtract(exp(multiply([0, 1], c)), exp(multiply([0, -1], c))), [0, 2])
}

export function cos(c, degreeMode = false) {
  return sin(subtract(degreeMode ? [90, 0] : [pi / 2, 0], c), degreeMode)
}

export function tan(c, degreeMode = false) {
  if (isEqual(round(cos(c), 12), [0, 0])) return [inf, 0]
  return divide(sin(c, degreeMode), cos(c, degreeMode))
}

export function csc(c, degreeMode = false) {
  if (isEqual(round(sin(c), 12), [0, 0])) return [inf, 0]
  return divide([1, 0], sin(c, degreeMode))
}

export function sec(c, degreeMode = false) {
  if (isEqual(round(cos(c), 12), [0, 0])) return [inf, 0]
  return divide([1, 0], cos(c, degreeMode))
}

export function cot(c, degreeMode = false) {
  if (isEqual(round(sin(c), 12), [0, 0])) return [inf, 0]
  return divide(cos(c, degreeMode), sin(c, degreeMode))
}
