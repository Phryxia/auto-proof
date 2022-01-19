import classNames from 'classnames/bind'
import { ReactNode } from 'react'
import { BooleanExpression } from '../../boolean-algebra/model'
import {
  And,
  BooleanConstant,
  BooleanVariable,
  Equivalence,
  Implication,
  Not,
  Or,
} from '../../boolean-algebra/nodes'
import styles from '../../styles/tree.module.css'

const cx = classNames.bind(styles)

function Wrap({
  isWrapped,
  children,
}: {
  isWrapped?: boolean
  children: ReactNode
}) {
  return isWrapped ? <>({children})</> : <>{children}</>
}

function isBinary(expr: any): boolean {
  return expr.expr0 && expr.expr1
}

export default function ExprDom({ expr }: { expr: BooleanExpression }) {
  if (expr instanceof BooleanConstant)
    return <span className={cx('token')}>{expr.value ? 'true' : 'false'}</span>

  if (expr instanceof BooleanVariable)
    return <span className={cx('token')}>{expr.name}</span>

  if (expr instanceof Not)
    return (
      <span className={cx('token')}>
        ~
        <Wrap isWrapped={isBinary(expr.expr)}>
          <ExprDom expr={expr.expr} />
        </Wrap>
      </span>
    )

  if (expr instanceof And)
    return (
      <span className={cx('token')}>
        <Wrap isWrapped={expr.expr0 instanceof Or}>
          <ExprDom expr={expr.expr0} />
        </Wrap>
        &
        <Wrap isWrapped={expr.expr1 instanceof Or}>
          <ExprDom expr={expr.expr1} />
        </Wrap>
      </span>
    )

  if (expr instanceof Or)
    return (
      <span className={cx('token')}>
        <ExprDom expr={expr.expr0} />
        |
        <ExprDom expr={expr.expr1} />
      </span>
    )

  if (expr instanceof Implication)
    return (
      <span className={cx('token')}>
        <ExprDom expr={expr.expr0} />
        →
        <ExprDom expr={expr.expr1} />
      </span>
    )

  if (expr instanceof Equivalence)
    return (
      <span className={cx('token')}>
        <ExprDom expr={expr.expr0} />
        ↔
        <ExprDom expr={expr.expr1} />
      </span>
    )

  return <span className={cx('token')}>?</span>
}
