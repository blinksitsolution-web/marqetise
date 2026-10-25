import { Component } from 'react'
import { Link } from 'react-router-dom'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-screen place-items-center px-4 text-center">
          <div>
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">The page could not be shown.</p>
            <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-blue">Back home</Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
