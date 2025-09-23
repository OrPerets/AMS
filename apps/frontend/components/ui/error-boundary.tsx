import * as React from "react"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

import { Button } from "./button"
import { Alert, AlertDescription, AlertTitle } from "./alert"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log error to monitoring service
    if (typeof window !== 'undefined') {
      // You can integrate with error monitoring services here
      // e.g., Sentry, LogRocket, etc.
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            משהו השתבש
          </h1>
          <p className="text-muted-foreground mt-2">
            אירעה שגיאה בלתי צפויה. אנא נסה שוב או פנה לתמיכה.
          </p>
        </div>

        {isDevelopment && error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>שגיאה למפתחים</AlertTitle>
            <AlertDescription className="mt-2">
              <details className="text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  פרטי השגיאה
                </summary>
                <pre className="whitespace-pre-wrap bg-destructive/5 p-2 rounded text-xs overflow-auto">
                  {error.name}: {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetError} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            נסה שוב
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/home'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            חזור לעמוד הראשי
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          במקרה של בעיה מתמשכת, אנא פנה לתמיכה הטכנית
        </div>
      </div>
    </div>
  )
}

// Compact error fallback for smaller components
export const CompactErrorFallback = ({ error, resetError }: ErrorFallbackProps) => (
  <Alert variant="destructive" className="m-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>שגיאה בטעינת הרכיב</AlertTitle>
    <AlertDescription className="mt-2 flex items-center justify-between">
      <span>לא ניתן לטעון את התוכן. נסה לרענן את העמוד.</span>
      <Button size="sm" variant="outline" onClick={resetError}>
        נסה שוב
      </Button>
    </AlertDescription>
  </Alert>
)

// Hook for functional components to reset error boundary
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo)
    // You can throw the error to be caught by the nearest ErrorBoundary
    throw error
  }, [])
}

export { DefaultErrorFallback }
