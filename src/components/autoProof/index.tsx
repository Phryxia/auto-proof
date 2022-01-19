import { inferInputToTarget } from '@src/autoProof'
import { BooleanParser } from '@src/boolean-algebra/parser'
import { useTextArea } from '@src/hooks/useTextArea'

const parser = new BooleanParser()

export default function () {
  const [TextArea, textValue] = useTextArea()

  const { expression } = parser.parse(textValue)

  const combinations = expression ? inferInputToTarget(expression, true) : []

  return (
    <div>
      <h1>Auto Proof</h1>
      <div>{TextArea}</div>

      <div>
        {combinations === 'any'
          ? 'any'
          : combinations.length === 0
          ? 'never'
          : combinations.map((combination, index) => {
              return (
                <div key={index}>
                  {Object.keys(combination)
                    .map((vname) => `${vname}=${combination[vname]}`)
                    .join(', ')}
                </div>
              )
            })}
      </div>
    </div>
  )
}
