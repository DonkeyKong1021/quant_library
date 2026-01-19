import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { CircularProgress, Box } from '@mui/material'

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Backtest = lazy(() => import('./pages/Backtest'))
const DataExplorer = lazy(() => import('./pages/DataExplorer'))
const StrategyBuilder = lazy(() => import('./pages/StrategyBuilder'))
const BacktestHistory = lazy(() => import('./pages/BacktestHistory'))
const Optimization = lazy(() => import('./pages/Optimization'))

// Loading component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <CircularProgress />
  </Box>
)

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/backtest"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Backtest />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/backtest-history"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <BacktestHistory />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/data-explorer"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <DataExplorer />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/strategy-builder"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <StrategyBuilder />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/optimization"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Optimization />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </Router>
    </ErrorBoundary>
  )
}

export default App