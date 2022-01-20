import 'normalize.css'
import ReactDOM from 'react-dom'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/global.css'

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
)
