import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { msal } from './auth'
import App from './App'
import './styles.css'

const theme = createTheme({
  palette: {
    primary: { main: '#305b7d', dark: '#002b5c', light: '#e8f0f6' },
    secondary: { main: '#e31837', dark: '#b5122b', light: '#fff0f2' },
    background: { default: '#f7f9fb', paper: '#ffffff' },
    text: { primary: '#20374a', secondary: '#617487' },
  },
  typography: {
    fontFamily: '"Aptos", "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.045em' },
    h2: { fontWeight: 750, letterSpacing: '-0.035em' },
    h3: { fontWeight: 750, letterSpacing: '-0.03em' },
    h4: { fontWeight: 750, letterSpacing: '-0.025em' },
    h5: { fontWeight: 750, letterSpacing: '-0.02em' },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 12, boxShadow: 'none', paddingInline: 18 } } },
    MuiCard: { styleOverrides: { root: { border: '1px solid #e2e9ef', boxShadow: '0 12px 32px rgba(0, 43, 92, .045)' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
})

await msal.initialize()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msal}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </MsalProvider>
  </React.StrictMode>,
)
