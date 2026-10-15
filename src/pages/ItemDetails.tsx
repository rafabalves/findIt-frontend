import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { Alert, Box, Breadcrumbs, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Link, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import { publicApi, useApi } from '../api'
import { loginRequest } from '../auth'
import { useProfile } from '../App'
import type { Activity, Item, ItemStatus } from '../types'
import { ErrorState, formatDate, ItemIllustration, itemStatus, Loading } from '../ui'

export default function ItemDetails({ byQr = false }: { byQr?: boolean }) {
  const { id, guid } = useParams()
  const api = useApi()
  const { instance } = useMsal()
  const authenticated = useIsAuthenticated()
  const { me } = useProfile()
  const [item, setItem] = useState<Item | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [justification, setJustification] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<ItemStatus>('Archived')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const path = byQr ? `/api/items/by-qr/${guid}` : `/api/items/${id}`
    publicApi<Item>(path).then(data => { if (alive) { setItem(data); setError(null) } })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o item.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [byQr, guid, id, revision])

  useEffect(() => {
    if (!item || !me?.isAdmin) return
    let alive = true
    api<Activity[]>(`/api/admin/items/${item.id}/activity`, { protected: true })
      .then(data => { if (alive) setActivity(data) }).catch(() => {})
    return () => { alive = false }
  }, [item?.id, me?.isAdmin, revision, api])

  async function requestItem(event: FormEvent) {
    event.preventDefault()
    if (!item) return
    setBusy(true); setActionError(null)
    try {
      await api(`/api/items/${item.id}/requests`, { protected: true, method: 'POST', body: { justification } })
      setRequestOpen(false); setJustification(''); setSuccess('Solicitação enviada! Acompanhe o andamento em Minhas solicitações.')
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Não foi possível enviar a solicitação.') }
    finally { setBusy(false) }
  }

  async function changeStatus(event: FormEvent) {
    event.preventDefault()
    if (!item) return
    setBusy(true); setActionError(null)
    try {
      await api(`/api/admin/items/${item.id}/status`, { protected: true, method: 'PATCH', body: { status: newStatus, reason } })
      setStatusOpen(false); setReason(''); setSuccess('Status atualizado.'); setRevision(value => value + 1)
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Falha ao atualizar status.') }
    finally { setBusy(false) }
  }

  async function returnItem() {
    if (!item || !window.confirm('Confirmar a entrega física deste item?')) return
    setBusy(true); setActionError(null)
    try {
      await api(`/api/admin/items/${item.id}/return`, { protected: true, method: 'POST' })
      setSuccess('Devolução registrada.'); setRevision(value => value + 1)
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Falha ao registrar devolução.') }
    finally { setBusy(false) }
  }

  if (loading) return <Container maxWidth="lg"><Loading label="Carregando item…" /></Container>
  if (error || !item) return <Container maxWidth="lg" sx={{ py: 5 }}><ErrorState message={error || 'Item não encontrado.'} /></Container>

  return <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, pb: 10 }}>
    <Breadcrumbs sx={{ mb: 3 }}><Link component={RouterLink} to="/" underline="hover" color="inherit">Itens encontrados</Link><Typography color="text.primary">{item.name}</Typography></Breadcrumbs>
    <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>Voltar ao catálogo</Button>
    <div className="detail-grid">
      <ItemIllustration category={item.category} large />
      <div className="detail-content">
        <Stack direction="row" spacing={1} alignItems="center">{itemStatus(item.status)}<Typography color="text.secondary" variant="body2">Item #{item.id}</Typography></Stack>
        <Typography component="h1" variant="h3" sx={{ mt: 2, mb: 1 }}>{item.name}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.7 }}>{item.description}</Typography>
        <Divider sx={{ my: 3 }} />
        <Stack spacing={2.2} className="detail-facts">
          <Stack direction="row" spacing={1.5}><CategoryOutlinedIcon /><div><strong>Categoria</strong><Typography color="text.secondary">{item.category}</Typography></div></Stack>
          <Stack direction="row" spacing={1.5}><LocationOnOutlinedIcon /><div><strong>Local encontrado</strong><Typography color="text.secondary">{item.location}</Typography></div></Stack>
          <Stack direction="row" spacing={1.5}><CalendarMonthOutlinedIcon /><div><strong>Encontrado em</strong><Typography color="text.secondary">{formatDate(item.foundOn)}</Typography></div></Stack>
        </Stack>
        {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}
        {actionError && <Alert severity="error" sx={{ mt: 3 }}>{actionError}</Alert>}
        {item.status === 'Active' && <Paper variant="outlined" className="claim-panel">
          <Typography variant="h6">Este item pode ser seu?</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.7, mb: 2 }}>Conte alguns detalhes para a equipe verificar sua solicitação.</Typography>
          <Button variant="contained" size="large" onClick={() => authenticated ? setRequestOpen(true) : void instance.loginRedirect(loginRequest)}>{authenticated ? 'Solicitar este item' : 'Entrar para solicitar'}</Button>
        </Paper>}
        {me?.isAdmin && <Paper variant="outlined" className="admin-detail-panel">
          <Typography variant="subtitle1" fontWeight={700}>Ações administrativas</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
            <Button variant="outlined" component={RouterLink} to={`/admin?item=${item.id}`}>Editar dados</Button>
            <Button variant="outlined" onClick={() => setStatusOpen(true)}>Alterar status</Button>
            {item.status === 'Active' && <Button variant="outlined" color="success" disabled={busy} onClick={returnItem}>Registrar devolução</Button>}
          </Stack>
          {activity.length > 0 && <Box sx={{ mt: 2 }}><Typography variant="body2" fontWeight={700}>Histórico recente</Typography>{activity.slice(0, 4).map(entry => <Typography key={entry.id} variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>{formatDate(entry.createdAt)} · {entry.description}</Typography>)}</Box>}
        </Paper>}
      </div>
    </div>

    <Dialog open={requestOpen} onClose={() => !busy && setRequestOpen(false)} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={requestItem}>
        <DialogTitle>Solicitar {item.name}</DialogTitle>
        <DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>Descreva características que ajudem a confirmar que o item pertence a você.</Typography>{actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}<TextField multiline minRows={4} fullWidth autoFocus label="Por que este item é seu?" value={justification} onChange={event => setJustification(event.target.value)} inputProps={{ maxLength: 2000 }} required /></DialogContent>
        <DialogActions><Button onClick={() => setRequestOpen(false)} disabled={busy}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy || !justification.trim()}>Enviar solicitação</Button></DialogActions>
      </Box>
    </Dialog>
    <Dialog open={statusOpen} onClose={() => !busy && setStatusOpen(false)} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={changeStatus}>
        <DialogTitle>Alterar status do item</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{actionError && <Alert severity="error">{actionError}</Alert>}<TextField select fullWidth label="Novo status" value={newStatus} onChange={event => setNewStatus(event.target.value as ItemStatus)}><MenuItem value="Active">Disponível</MenuItem><MenuItem value="Returned">Devolvido</MenuItem><MenuItem value="Archived">Arquivado</MenuItem></TextField><TextField fullWidth multiline minRows={3} label="Motivo da alteração" value={reason} onChange={event => setReason(event.target.value)} required /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setStatusOpen(false)} disabled={busy}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy || !reason.trim()}>Salvar status</Button></DialogActions>
      </Box>
    </Dialog>
  </Container>
}
