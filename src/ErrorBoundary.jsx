import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">⚠️</div>
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-message">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button className="error-boundary-btn" onClick={this.handleReset}>
            Try Again
          </button>
          <button className="error-boundary-btn secondary" onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}>
            Reset App Data
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
