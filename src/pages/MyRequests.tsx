import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useApi } from '../api'
import type { RecoveryRequest } from '../types'
import { EmptyState, ErrorState, formatDate, Loading, requestStatus } from '../ui'

export default function MyRequests() {
  const api = useApi()
  const [requests, setRequests] = useState<RecoveryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    api<RecoveryRequest[]>('/api/me/requests', { protected: true })
      .then(data => { if (alive) { setRequests(data); setError(null) } })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar solicitações.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [api, revision])

  async function cancel(id: number) {
    if (!window.confirm('Cancelar esta solicitação?')) return
    setBusy(id); setMessage(null)
    try {
      await api(`/api/requests/${id}/cancel`, { protected: true, method: 'POST' })
      setMessage('Solicitação cancelada.'); setRevision(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível cancelar.') }
    finally { setBusy(null) }
  }

  return <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 }, pb: 11 }}>
    <span className="eyebrow">ÁREA PESSOAL</span>
    <Typography component="h1" variant="h3" sx={{ mt: 0.8 }}>Minhas solicitações</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>Acompanhe cada etapa até o reencontro com seu item.</Typography>
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={() => setRevision(value => value + 1)} /> : requests.length === 0 ? <EmptyState title="Você ainda não fez solicitações" description="Explore os itens encontrados e, se reconhecer o seu, conte à equipe por que ele pertence a você." action="Explorar itens" href="/" /> : <Stack spacing={2}>
      {requests.map(request => <Paper key={request.id} variant="outlined" className="request-card">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'start', sm: 'center' }}><div><Typography variant="caption" color="text.secondary">SOLICITAÇÃO #{request.id} · {formatDate(request.createdAt)}</Typography><Typography variant="h6" sx={{ mt: 0.5 }}>{request.itemName}</Typography></div>{requestStatus(request.status)}</Stack>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>{request.justification}</Typography>
        {request.adminNotes && <Alert severity={request.status === 'Approved' ? 'success' : 'info'} sx={{ mt: 2 }}>Resposta da equipe: {request.adminNotes}</Alert>}
        {request.expiresAt && request.status === 'Approved' && <Typography variant="body2" sx={{ mt: 1.5 }}><strong>Prazo para retirada:</strong> {formatDate(request.expiresAt)}</Typography>}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Button component={RouterLink} to={`/itens/${request.itemId}`} endIcon={<ArrowForwardIcon />}>Ver item</Button>{request.status === 'Pending' && <Button color="error" disabled={busy === request.id} onClick={() => void cancel(request.id)}>Cancelar solicitação</Button>}</Stack>
      </Paper>)}
    </Stack>}
  </Container>
}
