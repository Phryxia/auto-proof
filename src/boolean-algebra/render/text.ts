import { BooleanExpression } from '../model'
import {
  And,
  BooleanConstant,
  BooleanVariable,
  Equivalence,
  Implication,
  Not,
  Or,
} from '../nodes'

function wrap(str: string, isWrapped: boolean): string {
  return isWrapped ? `(${str})` : str
}

function isBinary(expr: any): boolean {
  return expr.expr0 && expr.expr1
}

export default function renderToText(expr: BooleanExpression): string {
  if (expr instanceof BooleanConstant) return expr.value ? 'true' : 'false'

  if (expr instanceof BooleanVariable) return expr.name

  if (expr instanceof Not)
    return `~${wrap(renderToText(expr.expr), isBinary(expr.expr))}`

  if (expr instanceof And)
    return `${wrap(renderToText(expr.expr0), expr.expr0 instanceof Or)}&${wrap(
      renderToText(expr.expr1),
      expr.expr1 instanceof Or
    )}`

  if (expr instanceof Or)
    return `${renderToText(expr.expr0)}|${renderToText(expr.expr1)}`

  if (expr instanceof Implication)
    return `${renderToText(expr.expr0)}->${renderToText(expr.expr1)}`

  if (expr instanceof Equivalence)
    return `${renderToText(expr.expr0)}<->${renderToText(expr.expr1)}`

  return '?'
}
