export default class ErrorBoundary extends React.Component {
  constructor(public props: any) {
    super(props)
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log(error)
    console.log(errorInfo)
  }

  render() {
    return this.props.children
  }
}
