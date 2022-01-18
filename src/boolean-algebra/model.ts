export interface BooleanVariables {
  [name: string]: boolean
}

export interface BooleanExpression {
  evaluate: (variables: BooleanVariables) => boolean
}

export interface BooleanOptimizerOption {}
