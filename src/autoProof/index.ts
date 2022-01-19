import { BooleanExpression, BooleanVariables } from '@src/boolean-algebra/model'
import {
  And,
  BooleanConstant,
  BooleanVariable,
  Equivalence,
  Implication,
  Not,
  Or,
} from '@src/boolean-algebra/nodes'

type Requirement = BooleanVariables[] | 'any'

function joinOr(set0: Requirement, set1: Requirement): Requirement {
  if (set0 === 'any' || set1 === 'any') return 'any'
  return set0.concat(set1)
}

function mergeAnd(
  v0: BooleanVariables,
  v1: BooleanVariables
): BooleanVariables | null {
  const result = { ...v0 }
  for (const vname in v1) {
    if (result[vname] !== undefined && result[vname] !== v1[vname]) return null
    result[vname] = v1[vname]
  }
  return result
}

function joinAnd(set0: Requirement, set1: Requirement): Requirement {
  if (set0 === 'any') return set1
  if (set1 === 'any') return set0

  const cartessian: BooleanVariables[] = []
  for (let i = 0; i < set0.length; ++i) {
    for (let j = 0; j < set1.length; ++j) {
      const mergedVariables = mergeAnd(set0[i], set1[j])

      if (mergedVariables) {
        cartessian.push(mergedVariables)
      }
    }
  }

  return cartessian
}

export function inferInputToTarget(
  expr: BooleanExpression,
  target: boolean
): BooleanVariables[] | 'any' {
  if (expr instanceof BooleanConstant) {
    if (expr === (target ? BooleanConstant.TRUE : BooleanConstant.FALSE))
      return 'any'
    return []
  }

  if (expr instanceof BooleanVariable) {
    return [{ [expr.name]: target }]
  }

  if (expr instanceof Not) {
    return inferInputToTarget(expr.expr, !target)
  }

  if (expr instanceof Or) {
    if (target) {
      return joinOr(
        inferInputToTarget(expr.expr0, true),
        inferInputToTarget(expr.expr1, true)
      )
    } else {
      return joinAnd(
        inferInputToTarget(expr.expr0, false),
        inferInputToTarget(expr.expr1, false)
      )
    }
  }

  if (expr instanceof And) {
    if (target) {
      return joinAnd(
        inferInputToTarget(expr.expr0, true),
        inferInputToTarget(expr.expr1, true)
      )
    } else {
      return joinOr(
        inferInputToTarget(expr.expr0, false),
        inferInputToTarget(expr.expr1, false)
      )
    }
  }

  if (expr instanceof Implication) {
    if (target) {
      return joinOr(
        joinAnd(
          inferInputToTarget(expr.expr0, true),
          inferInputToTarget(expr.expr1, true)
        ),
        inferInputToTarget(expr.expr0, false)
      )
    } else {
      return joinAnd(
        inferInputToTarget(expr.expr0, true),
        inferInputToTarget(expr.expr1, false)
      )
    }
  }

  if (expr instanceof Equivalence) {
    return joinOr(
      joinAnd(
        inferInputToTarget(expr.expr0, true),
        inferInputToTarget(expr.expr1, true)
      ),
      joinAnd(
        inferInputToTarget(expr.expr0, false),
        inferInputToTarget(expr.expr1, false)
      )
    )
  }

  throw Error('unsupported node')
}
