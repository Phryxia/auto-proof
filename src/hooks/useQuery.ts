import * as qs from 'query-string'
import { useEffect, useState } from 'react'

export default function useQuery() {
  const [queries, setQueries] = useState<qs.ParsedQuery>(
    qs.parse(location.search)
  )

  function updateHistory(queries: qs.ParsedQuery) {
    const search = qs.stringify(queries)
    if (search !== location.search) {
      history.pushState(null, '', `?${search}`)
    }
  }

  function setQuery(key: string, value: string): void {
    // 쿼리에 변화가 없으면 안바꾼다
    if (queries[key] === value) return

    const q = {
      ...queries,
      [key]: value,
    }
    setQueries(q)
    updateHistory(q)
  }

  function deleteQuery(key: string): void {
    // 쿼리에 변화가 없으면 안바꾼다
    if (queries[key] === undefined) return

    const q = { ...queries }
    delete q[key]
    setQueries(q)
    updateHistory(q)
  }

  function clearQueries(): void {
    setQueries({})
    updateHistory({})
  }

  useEffect(() => {
    function handleHistoryChange() {
      setQueries(qs.parse(location.search))
    }

    window.addEventListener('popstate', handleHistoryChange)

    return () => window.removeEventListener('popstate', handleHistoryChange)
  }, [])

  return {
    setQuery,
    queries,
    deleteQuery,
    clearQueries,
  }
}
