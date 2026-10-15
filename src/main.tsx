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
    primary: { main: '#17424a', dark: '#103139', light: '#e1edeb' },
    secondary: { main: '#d4774c' },
    background: { default: '#faf9f5', paper: '#ffffff' },
    text: { primary: '#17353c', secondary: '#627178' },
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
    MuiCard: { styleOverrides: { root: { border: '1px solid #e8ece8', boxShadow: '0 12px 32px rgba(14, 44, 48, .045)' } } },
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
