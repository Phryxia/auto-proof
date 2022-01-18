import { ChangeEvent, useState } from 'react'

interface TextInputProps {
  onChange: (value: string) => void
}

export default function TextInput({ onChange }: TextInputProps) {
  const [content, setContent] = useState<string>('')

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setContent(event.target.value)
    onChange(event.target.value)
  }

  return <input type="text" onChange={handleChange} value={content} />
}
