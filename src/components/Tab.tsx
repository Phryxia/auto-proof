import classNames from 'classnames/bind'
import { useEffect, useState } from 'react'
import defaultStyles from '../styles/tab.module.css'

let cx: any

interface TabProps<T> {
  entries: {
    label: string
    value: T
  }[]
  value?: T // 외부 상태랑 동기화해야 하는 경우 사용 (ex: 쿼리와 동기화)
  defaultValue?: T // value를 주면 얘는 무시함
  onChange: (value: T) => void // 내부에 의해 변경된 경우만 호출됨
  styles?: { [key: string]: string }
}

export default function Tab<T = string>({
  entries,
  value,
  defaultValue,
  onChange,
  styles = defaultStyles,
}: TabProps<T>) {
  cx = classNames.bind(styles)

  const [selectedValue, setSelectedValue] = useState<T>(
    value ?? defaultValue ?? entries[0].value
  )

  useEffect(() => {
    if (value === undefined) return

    setSelectedValue(value)
  }, [value])

  return (
    <div className={cx('container')}>
      {entries.map(({ label, value }) => (
        <button
          key={label}
          className={cx('entry', { selected: value === selectedValue })}
          onClick={() => {
            if (selectedValue !== value) {
              setSelectedValue(value)
              onChange(value)
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
