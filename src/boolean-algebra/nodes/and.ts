import {
  BooleanExpression,
  BooleanVariables,
} from '../model'

export class And implements BooleanExpression {
  constructor(
    public readonly expr0: BooleanExpression,
    public readonly expr1: BooleanExpression
  ) {}

  evaluate(variables: BooleanVariables): boolean {
    return this.expr0.evaluate(variables) && this.expr1.evaluate(variables)
  }
}
