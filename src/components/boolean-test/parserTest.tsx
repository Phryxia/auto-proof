import classNames from 'classnames/bind'
import { useState } from 'react'
import { BooleanExpression } from '../../boolean-algebra/model'
import { BooleanParser, Token } from '../../boolean-algebra/parser'
import { renderToText } from '../../boolean-algebra/render'
import tokenStyles from '../../styles/token/token.module.css'
import TextInput from '../TextInput'
import ExprDom from './ExprDom'

const cx = classNames.bind(tokenStyles)

const parser = new BooleanParser()

export default function ParserTest() {
  const [expression, setExpression] = useState<BooleanExpression | undefined>()
  const [tokens, setTokens] = useState<Token[]>([])
  const [warning, setWarning] = useState<string>('')
  const [error, setError] = useState<string>('')

  const [hoverIndex, setHoverIndex] = useState<number>(-1)

  function handleChange(value: string): void {
    const { tokens } = parser.tokenize(value)
    const { expression, warning, error } = parser.parse(value)

    setTokens(tokens)
    setExpression(expression)
    setWarning(warning ?? '')
    setError(error ?? '')
  }

  return (
    <>
      <h1>Parser Test Page</h1>
      <TextInput onChange={handleChange} />

      <h2>Tokens</h2>
      <div className={cx('container')}>
        {tokens.map((token, index) => (
          <div
            key={index}
            className={cx('element')}
            onMouseOver={() => setHoverIndex(index)}
            onMouseOut={() => index === hoverIndex && setHoverIndex(-1)}
          >
            {token.content}
            <span className={cx('tooltip', { isActive: index === hoverIndex })}>
              {token.type}
            </span>
          </div>
        ))}
      </div>

      <h2>Parsed Expression</h2>
      {expression && renderToText(expression)}

      <h2>Tree</h2>
      {expression && <ExprDom expr={expression} />}

      <h2>Parser Warning</h2>
      <div
        dangerouslySetInnerHTML={{
          __html:
            warning?.replaceAll(' ', '&nbsp').replaceAll('\n', '<br />') ?? '',
        }}
      />

      <h2>Parse Error</h2>
      <div
        dangerouslySetInnerHTML={{
          __html:
            error?.replaceAll(' ', '&nbsp').replaceAll('\n', '<br />') ?? '',
        }}
      />
    </>
  )
}
