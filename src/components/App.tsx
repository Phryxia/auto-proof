import classNames from 'classnames/bind'
import * as qs from 'query-string'
import { useEffect } from 'react'
import useQuery from '@src/hooks/useQuery'
import tabStyles from '@src/styles/app-tab.module.css'
import styles from '@src/styles/app.module.css'
import BooleanTest from './boolean-test'
import Tab from './Tab'

const cx = classNames.bind(styles)

enum PageTab {
  BOOLEAN_ALGEBRA = 'boolean',
}

const TAB_ENTRIES = [
  {
    label: 'Boolean Algebra',
    value: PageTab.BOOLEAN_ALGEBRA,
  },
]

function extractPage(queries: qs.ParsedQuery): PageTab {
  switch (queries.page) {
    case PageTab.BOOLEAN_ALGEBRA:
      return queries.page
    default:
      return PageTab.BOOLEAN_ALGEBRA
  }
}

function App() {
  const { setQuery, queries } = useQuery()
  const page = extractPage(queries)

  function handleTabChange(page: PageTab) {
    setQuery('page', page)
  }

  useEffect(() => {
    setQuery('page', page)
  }, [])

  return (
    <>
      <div className={cx('header')}>
        <h1>Auto Proof</h1>
      </div>

      <Tab<PageTab>
        entries={TAB_ENTRIES}
        onChange={handleTabChange}
        styles={tabStyles}
        defaultValue={page}
        value={page}
      />

      <div className={cx('content')}>
        {page === PageTab.BOOLEAN_ALGEBRA && <BooleanTest />}
      </div>
    </>
  )
}

export default App
