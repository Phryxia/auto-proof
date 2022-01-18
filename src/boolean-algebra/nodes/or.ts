import {
  BooleanExpression,
  BooleanOptimizerOption,
  BooleanVariables,
} from '../model'
import { BooleanConstant } from './constant'

export class Or implements BooleanExpression {
  constructor(
    public readonly expr0: BooleanExpression,
    public readonly expr1: BooleanExpression
  ) {}

  evaluate(variables: BooleanVariables): boolean {
    return this.expr0.evaluate(variables) || this.expr1.evaluate(variables)
  }

  optimize(option: BooleanOptimizerOption = {}): BooleanExpression {
    const expr0 = this.expr0.optimize(option)
    const expr1 = this.expr1.optimize(option)

    if (expr0 instanceof BooleanConstant && expr1 instanceof BooleanConstant)
      return BooleanConstant.get(expr0.value || expr1.value)

    if (
      (expr0 instanceof BooleanConstant && expr0.value) ||
      (expr1 instanceof BooleanConstant && expr1.value)
    )
      return BooleanConstant.TRUE

    return new Or(expr0, expr1)
  }
}
