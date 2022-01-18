import {
  BooleanExpression,
  BooleanOptimizerOption,
  BooleanVariables,
} from '../model'

export class BooleanConstant implements BooleanExpression {
  private constructor(public readonly value: boolean) {}

  evaluate(variables: BooleanVariables): boolean {
    return this.value
  }

  optimize(option: BooleanOptimizerOption = {}): BooleanExpression {
    return this
  }

  public static readonly TRUE: BooleanConstant = new BooleanConstant(true)
  public static readonly FALSE: BooleanConstant = new BooleanConstant(false)

  public static get(value: boolean): BooleanConstant {
    return value ? BooleanConstant.TRUE : BooleanConstant.FALSE
  }
}
