import { BooleanExpression } from '../model'
import {
  And,
  BooleanConstant,
  BooleanVariable,
  Equivalence,
  Implication,
  Not,
  Or,
} from '../nodes'

export enum TokenType {
  IDENTIFIER = 'identifier',
  OP_NOT = '~',
  OP_AND = '&',
  OP_OR = '|',
  OP_IMPLIES = '->',
  OP_EQUIVALENT = '<->',
  PARENTHESIS_LEFT = '(',
  PARENTHESIS_RIGHT = ')',
  UNKNOWN = '?',
  EOF = 'EOF',
}

export interface Token {
  content: string
  type: TokenType
  position: number
}

function isAlphabet(c: string): boolean {
  const code = c.toLowerCase().charCodeAt(0)
  return 'a'.charCodeAt(0) <= code && code <= 'z'.charCodeAt(0)
}

function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n'
}

export class BooleanParser {
  tokenize(str: string): { tokens: Token[]; warning: string } {
    let ptr = 0

    function getchar() {
      const result = str.charAt(ptr)
      ptr = Math.min(ptr + 1, str.length)
      return result
    }

    let c = getchar()

    function lex(): Token {
      let content = ''

      while (isWhitespace(c)) {
        c = getchar()
      }

      // Identifier
      if (isAlphabet(c)) {
        const position = ptr - 1
        content += c
        c = getchar()

        while (isAlphabet(c)) {
          content += c
          c = getchar()
        }

        return {
          content,
          type: TokenType.IDENTIFIER,
          position,
        }
      }

      // Single Operator
      if (c && '~|&'.includes(c)) {
        const position = ptr - 1
        content += c

        let type: TokenType
        if (c === '~') type = TokenType.OP_NOT
        else if (c === '&') type = TokenType.OP_AND
        else type = TokenType.OP_OR

        c = getchar()

        return {
          content,
          type,
          position,
        }
      }

      // Implication
      if (c && c === '-') {
        const position = ptr - 1
        content += c
        c = getchar()

        if (c && c === '>') {
          content += c
          c = getchar()

          return {
            content,
            type: TokenType.OP_IMPLIES,
            position,
          }
        }

        return {
          content,
          type: TokenType.UNKNOWN,
          position,
        }
      }

      // Equivalence
      if (c && c === '<') {
        const position = ptr - 1
        content += c
        c = getchar()

        if (c && c === '-') {
          content += c
          c = getchar()

          if (c && c === '>') {
            content += c
            c = getchar()

            return {
              content,
              type: TokenType.OP_EQUIVALENT,
              position,
            }
          }
        }

        return {
          content,
          type: TokenType.UNKNOWN,
          position,
        }
      }

      // 괄호
      if (c && '({['.includes(c)) {
        const position = ptr - 1
        content += c
        c = getchar()

        return {
          content,
          type: TokenType.PARENTHESIS_LEFT,
          position,
        }
      }

      if (c && ')}]'.includes(c)) {
        const position = ptr - 1
        content += c
        c = getchar()

        return {
          content,
          type: TokenType.PARENTHESIS_RIGHT,
          position,
        }
      }

      const dummy = c
      const position = ptr - 1
      c = getchar()

      return {
        content: dummy,
        type: dummy ? TokenType.UNKNOWN : TokenType.EOF,
        position,
      }
    }

    let tokens: Token[] = []
    let token = lex()
    let warning = ''

    while (token.type !== TokenType.EOF) {
      if (token.type === TokenType.UNKNOWN) {
        warning += `[BooleanParser.tokenize] Unknown character ${
          token.content
        } will be ignored.\n${str}\n${' '.repeat(token.position)}^\n\n`
      } else {
        tokens.push(token)
      }
      token = lex()
    }

    return {
      tokens,
      warning,
    }
  }

  parse(str: string): {
    expression?: BooleanExpression
    warning?: string
    error?: string
  } {
    const { tokens, warning } = this.tokenize(str)

    let ptr = 0

    function getToken(): Token {
      const result = tokens[ptr] ?? {
        content: '',
        type: TokenType.UNKNOWN,
        position: -1,
      }
      ptr = Math.min(ptr + 1, tokens.length)
      return result
    }

    let token = getToken()

    function throwError(name: string, expected: string) {
      if (token.type === TokenType.EOF) {
        throw new Error(
          `[${name}] Token ends unexpectedly, expected ${expected}\n${str}\n${' '.repeat(
            str.length
          )}^\n`
        )
      }
      throw new Error(
        `[${name}] Unexpected token '${token.content}'(type: ${
          token.type
        }), expected ${expected}\n${str}\n${' '.repeat(token.position)}^\n`
      )
    }
    /*
      E := I | E '<->' I
      I := C | I '->' C
      C := T | E '|' T
      T := U | T '&' u
      U := L | '~' U
      L := identifier | '(' E ')'
    */
    function parseE(): BooleanExpression {
      let lvalue = parseI()

      while (token.type === TokenType.OP_EQUIVALENT) {
        token = getToken()
        lvalue = new Equivalence(lvalue, parseI())
      }

      return lvalue
    }

    function parseI(): BooleanExpression {
      let lvalue = parseC()

      while (token.type === TokenType.OP_IMPLIES) {
        token = getToken()
        lvalue = new Implication(lvalue, parseC())
      }

      return lvalue
    }

    function parseC(): BooleanExpression {
      let lvalue = parseT()

      while (token.type === TokenType.OP_OR) {
        token = getToken()
        lvalue = new Or(lvalue, parseT())
      }

      return lvalue
    }

    function parseT(): BooleanExpression {
      let lvalue = parseU()

      while (token.type === TokenType.OP_AND) {
        token = getToken()
        lvalue = new And(lvalue, parseU())
      }

      return lvalue
    }

    function parseU(): BooleanExpression {
      if (token.type === TokenType.OP_NOT) {
        token = getToken()
        return new Not(parseU())
      }

      return parseL()
    }

    function parseL(): BooleanExpression {
      // 식별자
      if (token.type === TokenType.IDENTIFIER) {
        const content = token.content
        token = getToken()

        if (content.toLowerCase() === 'true') {
          return BooleanConstant.TRUE
        } else if (content.toLowerCase() === 'false') {
          return BooleanConstant.FALSE
        } else {
          return new BooleanVariable(content)
        }
      }
      // 괄호
      else if (token.type === TokenType.PARENTHESIS_LEFT) {
        token = getToken()
        const expr = parseE()

        if (token.type === TokenType.PARENTHESIS_RIGHT) {
          token = getToken()

          return expr
        } else throwError('BooleanParser.parse', ')')
      } else throwError('BooleanParser.parse', 'identifier or (')

      // Unreachable Code
      return BooleanConstant.FALSE
    }

    try {
      return {
        expression: parseE(),
        warning: warning ? warning : undefined,
      }
    } catch (e: any) {
      return {
        warning: warning ? warning : undefined,
        error: e instanceof Error ? e.message : `${e}`,
      }
    }
  }
}
