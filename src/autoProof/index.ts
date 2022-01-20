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

// 변수에서 서로 반전인 것만 골라낸다. (ex: p & q vs p & ~q면 [['p'], ['q']])
// 이때 둘의 셋이 다르면 (ex: p & q vs p & r) 'mismatch'를 반환
function findDiffVName(
  v0: BooleanVariables,
  v1: BooleanVariables
): [string[], string[]] | 'mismatch' {
  const comm: string[] = []
  const diff: string[] = []
  for (const vname in v0) {
    if (v1[vname] === undefined) {
      return 'mismatch'
    }
    if (v0[vname] === v1[vname]) {
      comm.push(vname)
    } else {
      diff.push(vname)
    }
  }
  for (const vname in v1) {
    if (v0[vname] === undefined) {
      return 'mismatch'
    }
  }
  return [comm, diff]
}

function minify(set: Requirement): Requirement {
  let nextSet: Requirement | undefined

  do {
    if (set === 'any') return 'any'

    nextSet = undefined

    for (let i = 0; i < set.length && !nextSet; ++i) {
      for (let j = i + 1; j < set.length && !nextSet; ++j) {
        const diffResult = findDiffVName(set[i], set[j])

        if (diffResult === 'mismatch') continue

        const [comm, diff] = diffResult

        // 둘 다 동일한 경우 하나만 선택
        if (diff.length === 0) {
          nextSet = set.filter((_, index) => index !== j)
        }
        // 하나만 겹치는 경우 공통부 추출
        else if (diff.length === 1) {
          // ex) p | ~p 같은 경우
          if (comm.length === 0) {
            nextSet = 'any'
            break
          }
          const mergedVariables = comm.reduce((acc, vname) => {
            acc[vname] = set[i][vname]
            return acc
          }, {} as BooleanVariables)
          nextSet = [
            ...set.slice(0, i),
            mergedVariables,
            ...set.slice(j + 1, set.length),
          ]
        }
      }
    }

    if (nextSet) {
      set = nextSet
    }
  } while (nextSet)

  return set
}

function joinOr(set0: Requirement, set1: Requirement): Requirement {
  if (set0 === 'any' || set1 === 'any') return 'any'
  return minify(set0.concat(set1))
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

  return minify(cartessian)
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
