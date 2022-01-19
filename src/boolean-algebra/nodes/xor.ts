import { BooleanExpression, BooleanVariables } from '../model'

export class Xor implements BooleanExpression {
  constructor(
    public readonly expr0: BooleanExpression,
    public readonly expr1: BooleanExpression
  ) {}

  evaluate(variables: BooleanVariables): boolean {
    const v0 = this.expr0.evaluate(variables)
    const v1 = this.expr1.evaluate(variables)
    return (v0 && !v1) || (!v0 && v1)
  }
}
