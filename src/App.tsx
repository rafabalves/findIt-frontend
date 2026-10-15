import { createContext, lazy, Suspense, useContext, useEffect, useState } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { Link as RouterLink, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Alert, Avatar, Box, Button, Container, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { useApi } from './api'
import { loginRequest } from './auth'
import type { Me } from './types'
import { Loading } from './ui'
const Catalog = lazy(() => import('./pages/Catalog'))
const ItemDetails = lazy(() => import('./pages/ItemDetails'))
const MyRequests = lazy(() => import('./pages/MyRequests'))
const Admin = lazy(() => import('./pages/Admin'))

type ProfileContextValue = { me: Me | null; loading: boolean; error: string | null; reload: () => void }
const ProfileContext = createContext<ProfileContextValue>({ me: null, loading: false, error: null, reload: () => {} })
export const useProfile = () => useContext(ProfileContext)

function ProfileProvider({ children }: { children: React.ReactNode }) {
  const authenticated = useIsAuthenticated()
  const api = useApi()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!authenticated) { setMe(null); setError(null); setLoading(false); return }
    let alive = true
    setLoading(true)
    api<Me>('/api/me', { protected: true })
      .then(value => { if (alive) { setMe(value); setError(null) } })
      .catch(reason => { if (alive) { setMe(null); setError(reason instanceof Error ? reason.message : 'Falha ao carregar seu perfil.') } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [authenticated, api, revision])
  return <ProfileContext.Provider value={{ me, loading, error, reload: () => setRevision(value => value + 1) }}>
    {children}
  </ProfileContext.Provider>
}

function Header() {
  const { instance } = useMsal()
  const authenticated = useIsAuthenticated()
  const { me } = useProfile()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [mobileAnchor, setMobileAnchor] = useState<HTMLElement | null>(null)
  const nav = [
    { label: 'Encontrar um item', to: '/' },
    ...(authenticated ? [{ label: 'Minhas solicitações', to: '/minhas-solicitacoes' }] : []),
    ...(me?.isAdmin ? [{ label: 'Administração', to: '/admin' }] : []),
  ]
  const login = () => void instance.loginRedirect({ ...loginRequest, prompt: 'select_account' })
  const logout = () => void instance.logoutRedirect()

  return <header className="site-header">
    <Container maxWidth="lg" className="header-inner">
      <RouterLink to="/" className="brand" aria-label="FindIt, ir para a página inicial">
        <span className="brand-mark"><SearchIcon fontSize="small" /></span>
        <span>find<span className="brand-accent">it</span><span className="brand-dot">.</span></span>
      </RouterLink>
      <nav className="desktop-nav" aria-label="Navegação principal">
        {nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{item.label}</NavLink>)}
      </nav>
      <Stack direction="row" alignItems="center" spacing={1}>
        {authenticated ? <>
          <Button className="profile-button" onClick={event => setMenuAnchor(event.currentTarget)} startIcon={<Avatar sx={{ width: 27, height: 27, bgcolor: '#d8e8e4', color: '#17424a', fontSize: 13 }}>{(me?.name || 'U')[0]}</Avatar>}>
            {me?.name?.split(' ')[0] || 'Minha conta'}
          </Button>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>{me?.email || 'Conta Microsoft'}</MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); logout() }}><LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Sair</MenuItem>
          </Menu>
        </> : <Button variant="contained" onClick={login} startIcon={<AccountCircleOutlinedIcon />} className="login-button">Entrar com Microsoft</Button>}
        <IconButton className="mobile-menu-button" aria-label="Abrir menu" onClick={event => setMobileAnchor(event.currentTarget)}><MenuIcon /></IconButton>
        <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={() => setMobileAnchor(null)}>
          {nav.map(item => <MenuItem key={item.to} component={RouterLink} to={item.to} onClick={() => setMobileAnchor(null)}>{item.label}</MenuItem>)}
        </Menu>
      </Stack>
    </Container>
  </header>
}

function Footer() {
  return <footer className="site-footer">
    <Container maxWidth="lg" className="footer-inner">
      <Typography className="footer-brand">find<span>it</span>.</Typography>
      <Typography variant="body2" color="text.secondary">Achados e perdidos · UEMG Divinópolis</Typography>
      <Typography variant="body2" color="text.secondary">Projeto de TCC</Typography>
    </Container>
  </footer>
}

function Protected({ admin = false, children }: { admin?: boolean; children: React.ReactNode }) {
  const { instance } = useMsal()
  const authenticated = useIsAuthenticated()
  const { me, loading, error, reload } = useProfile()
  const location = useLocation()
  if (!authenticated) return <Container maxWidth="md" sx={{ py: 10 }}>
    <Box className="access-card">
      <AccountCircleOutlinedIcon sx={{ fontSize: 46, color: 'secondary.main' }} />
      <Typography variant="h4" sx={{ mt: 2 }}>Entre para continuar</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Use sua conta Microsoft para acompanhar solicitações e acessar as funções do FindIt.</Typography>
      <Button variant="contained" onClick={() => void instance.loginRedirect({ ...loginRequest, state: location.pathname })}>Entrar com Microsoft</Button>
    </Box>
  </Container>
  if (loading || (!me && !error)) return <Loading label="Carregando seu perfil…" />
  if (error) return <Container maxWidth="md" sx={{ py: 6 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={reload}>Tentar novamente</Button>}>{error}</Alert></Container>
  if (admin && !me?.isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return <ProfileProvider>
    <Box className="app-frame">
      <Header />
      <main className="main-content">
        <Suspense fallback={<Loading />}><Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/itens/:id" element={<ItemDetails />} />
          <Route path="/qr/:guid" element={<ItemDetails byQr />} />
          <Route path="/minhas-solicitacoes" element={<Protected><MyRequests /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Suspense>
      </main>
      <Footer />
    </Box>
  </ProfileProvider>
}
