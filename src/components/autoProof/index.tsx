import { inferInputToTarget } from '@src/autoProof'
import { BooleanParser } from '@src/boolean-algebra/parser'
import { useTextArea } from '@src/hooks/useTextArea'

const parser = new BooleanParser()

export default function () {
  const [Premises, premises] = useTextArea()
  const [Conclusion, conclusion] = useTextArea()

  const predicate =
    premises
      .split('\n')
      .map((s) => `(${s})`)
      .join('&') +
    '->' +
    `(${conclusion})`
  const { expression } = parser.parse(predicate)
  const combinations = expression ? inferInputToTarget(expression, false) : []

  const isValidArgument = combinations !== 'any' && combinations.length === 0

  return (
    <div>
      <h1>Auto Proof</h1>
      <h2>Premises</h2>
      <div>{Premises}</div>

      <h2>Conclusion</h2>
      <div>{Conclusion}</div>

      <h2>Result</h2>
      {expression && (
        <div>
          {isValidArgument ? (
            'true'
          ) : (
            <>
              false
              <h3>Counter Examples</h3>
              {combinations.map((variables, index) => (
                <div key={index}>
                  {Object.keys(variables)
                    .map(
                      (vname) =>
                        `${vname} = ${variables[vname] ? 'true' : 'false'}`
                    )
                    .join(', ')}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
