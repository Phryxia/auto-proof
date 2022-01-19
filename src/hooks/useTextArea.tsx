import { useState } from 'react'

export function useTextArea(): [JSX.Element, string] {
  const [value, setValue] = useState<string>('')
  const dom = (
    <textarea
      onChange={(event) => {
        setValue(event.target.value)
      }}
      value={value}
    />
  )

  return [dom, value]
}
