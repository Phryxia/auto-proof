import {
  BooleanExpression,
  BooleanOptimizerOption,
  BooleanVariables,
} from '../model'

export class BooleanVariable implements BooleanExpression {
  constructor(public readonly name: string) {}

  evaluate(variables: BooleanVariables): boolean {
    return variables[this.name]
  }

  optimize(option: BooleanOptimizerOption = {}): BooleanExpression {
    return this
  }
}
