import {
  BooleanExpression,
  BooleanOptimizerOption,
  BooleanVariables,
} from '../model'
import { BooleanConstant } from './constant'

export class Not implements BooleanExpression {
  constructor(public readonly expr: BooleanExpression) {}

  evaluate(variables: BooleanVariables): boolean {
    return !this.expr.evaluate(variables)
  }

  optimize(option: BooleanOptimizerOption = {}): BooleanExpression {
    const expr = this.expr.optimize(option)

    if (expr instanceof BooleanConstant) return BooleanConstant.get(!expr.value)

    if (expr instanceof Not) return expr.expr

    return new Not(expr)
  }
}
