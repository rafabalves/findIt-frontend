import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import { QRCodeSVG } from 'qrcode.react'
import { apiUrl, publicApi, useApi } from '../api'
import type { AdminRequest, AdminUser, Category, Item, Page, QRCode, RequestStatus } from '../types'
import { EmptyState, ErrorState, formatDate, itemStatus, Loading, requestStatus } from '../ui'
import QrScanner from '../QrScanner'
import { labelGuidFromQr } from '../qr'
import { downloadLabelsPdf, labelBaseUrl, labelUrl } from '../labels'

type AdminTab = 'requests' | 'items' | 'categories' | 'qr' | 'users'
const tabs: { value: AdminTab; label: string }[] = [
  { value: 'requests', label: 'Solicitações' }, { value: 'items', label: 'Itens' },
  { value: 'categories', label: 'Categorias' }, { value: 'qr', label: 'Etiquetas QR' },
  { value: 'users', label: 'Usuários' },
]

export default function Admin() {
  const [params, setParams] = useSearchParams()
  const current = params.get('item') ? 'items' : params.get('tab')
  const tab: AdminTab = tabs.some(entry => entry.value === current) ? current as AdminTab : 'requests'
  return <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, pb: 10 }}>
    <span className="eyebrow">PAINEL DA EQUIPE</span>
    <Typography component="h1" variant="h3" sx={{ mt: 0.8 }}>Administração</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>Organize os itens e acompanhe cada solicitação em um só lugar.</Typography>
    <Box className="admin-tabs"><Tabs value={tab} onChange={(_, value: AdminTab) => setParams({ tab: value })} variant="scrollable" scrollButtons="auto">{tabs.map(entry => <Tab key={entry.value} value={entry.value} label={entry.label} />)}</Tabs></Box>
    <Box sx={{ pt: 4 }}>
      {tab === 'requests' && <RequestsPanel />}
      {tab === 'items' && <ItemsPanel editId={params.get('item')} onDone={() => setParams({ tab: 'items' })} />}
      {tab === 'categories' && <CategoriesPanel />}
      {tab === 'qr' && <QRPanel />}
      {tab === 'users' && <UsersPanel />}
    </Box>
  </Container>
}

function RequestsPanel() {
  const api = useApi()
  const [status, setStatus] = useState<RequestStatus | ''>('Pending')
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminRequest | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    const query = status ? `?status=${status}` : ''
    api<AdminRequest[]>(`/api/admin/requests${query}`, { protected: true })
      .then(data => { if (alive) { setRequests(data); setError(null) } })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar solicitações.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [api, status, revision])

  function openDecision(request: AdminRequest, kind: 'approve' | 'reject') {
    setSelected(request); setDecision(kind); setNotes(''); setError(null)
  }
  async function submitDecision(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    setBusy(true); setError(null)
    try {
      await api(`/api/admin/requests/${selected.id}/${decision}`, { protected: true, method: 'POST', body: { adminNotes: notes.trim() || null } })
      setMessage(decision === 'approve' ? 'Solicitação aprovada.' : 'Solicitação recusada.')
      setSelected(null); setRevision(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.') }
    finally { setBusy(false) }
  }

  return <>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
      <div><Typography variant="h5">Solicitações de recuperação</Typography><Typography color="text.secondary">Analise os pedidos e registre sua decisão.</Typography></div>
      <TextField select label="Mostrar" value={status} onChange={event => setStatus(event.target.value as RequestStatus | '')} sx={{ minWidth: 180 }}><MenuItem value="">Todas</MenuItem><MenuItem value="Pending">Em análise</MenuItem><MenuItem value="Approved">Aprovadas</MenuItem><MenuItem value="Rejected">Recusadas</MenuItem><MenuItem value="Cancelled">Canceladas</MenuItem><MenuItem value="Expired">Expiradas</MenuItem></TextField>
    </Stack>
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {error && <ErrorState message={error} onRetry={() => setRevision(value => value + 1)} />}
    {loading ? <Loading /> : !error && requests.length === 0 ? <EmptyState title="Tudo em dia" description="Nenhuma solicitação encontrada para este filtro." /> : <Stack spacing={2}>
      {requests.map(request => <Paper key={request.id} variant="outlined" className="admin-request-card">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
          <div><Typography variant="caption" color="text.secondary">PEDIDO #{request.id} · {formatDate(request.createdAt)}</Typography><Typography variant="h6" sx={{ mt: 0.4 }}>{request.itemName}</Typography><Typography variant="body2" color="text.secondary">{request.userName} · {request.userEmail}</Typography></div>
          <Box>{requestStatus(request.status)}</Box>
        </Stack>
        <Box className="quote-box">“{request.justification}”</Box>
        {request.adminNotes && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Nota da equipe: {request.adminNotes}</Typography>}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          <Button component={RouterLink} to={`/itens/${request.itemId}`} endIcon={<ArrowForwardIcon />}>Ver item</Button>
          {request.status === 'Pending' && <><Button color="success" variant="contained" onClick={() => openDecision(request, 'approve')}>Aprovar</Button><Button color="error" variant="outlined" onClick={() => openDecision(request, 'reject')}>Recusar</Button></>}
        </Stack>
      </Paper>)}
    </Stack>}
    <Dialog open={Boolean(selected)} onClose={() => !busy && setSelected(null)} fullWidth maxWidth="sm"><Box component="form" onSubmit={submitDecision}><DialogTitle>{decision === 'approve' ? 'Aprovar solicitação' : 'Recusar solicitação'}</DialogTitle><DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>{selected?.itemName} · {selected?.userName}</Typography><TextField fullWidth multiline minRows={3} label={decision === 'approve' ? 'Orientações para retirada (opcional)' : 'Motivo da recusa'} value={notes} onChange={event => setNotes(event.target.value)} required={decision === 'reject'} /></DialogContent><DialogActions><Button disabled={busy} onClick={() => setSelected(null)}>Cancelar</Button><Button type="submit" variant="contained" color={decision === 'approve' ? 'success' : 'error'} disabled={busy || (decision === 'reject' && !notes.trim())}>Confirmar</Button></DialogActions></Box></Dialog>
  </>
}

function toLocalInput(value: string) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

type ItemForm = { categoryId: string; qrCodeGuid: string; name: string; description: string; location: string; foundOn: string }
const emptyItemForm: ItemForm = { categoryId: '', qrCodeGuid: '', name: '', description: '', location: '', foundOn: '' }

function ItemsPanel({ editId, onDone }: { editId: string | null; onDone: () => void }) {
  const api = useApi()
  const [active, setActive] = useState<Page<Item> | null>(null)
  const [closed, setClosed] = useState<Page<Item> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [codes, setCodes] = useState<QRCode[]>([])
  const [editing, setEditing] = useState<Item | null>(null)
  const [photoItemId, setPhotoItemId] = useState<number | null>(null)
  const [form, setForm] = useState<ItemForm>(emptyItemForm)
  const [formOpen, setFormOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let alive = true
    Promise.all([
      publicApi<Page<Item>>('/api/items?pageSize=100'),
      publicApi<Page<Item>>('/api/items/recently-closed?pageSize=100'),
      publicApi<Category[]>('/api/categories'),
      api<QRCode[]>('/api/admin/qr-codes/available', { protected: true }),
    ]).then(([items, recent, cat, qr]) => { if (alive) { setActive(items); setClosed(recent); setCategories(cat); setCodes(qr); setError(null) } })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar itens.') })
    return () => { alive = false }
  }, [api, revision])
  useEffect(() => {
    if (!editId) return
    let alive = true
    publicApi<Item>(`/api/items/${editId}`).then(item => {
      if (!alive) return
      setEditing(item)
      setScanOpen(false)
      setForm({ categoryId: String(categories.find(category => category.name === item.category)?.id || ''), qrCodeGuid: '', name: item.name, description: item.description, location: item.location, foundOn: toLocalInput(item.foundOn) })
      setFormOpen(true)
    }).catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Item não encontrado.') })
    return () => { alive = false }
  }, [editId, categories])

  function update<K extends keyof ItemForm>(key: K, value: ItemForm[K]) { setForm(current => ({ ...current, [key]: value })) }
  function openCreate() { setEditing(null); setScanOpen(false); setForm({ ...emptyItemForm, foundOn: toLocalInput(new Date().toISOString()) }); setFormOpen(true) }
  function closeForm() { setScanOpen(false); setFormOpen(false); if (editId) onDone() }
  function selectScannedQr(content: string): string | null {
    const guid = labelGuidFromQr(content)
    if (!guid) return 'Este QR não é uma etiqueta válida do FindIt.'
    const code = codes.find(entry => entry.guid.toLowerCase() === guid)
    if (!code) return 'Esta etiqueta não está disponível. Ela pode já estar vinculada a outro item.'
    update('qrCodeGuid', code.guid)
    setScanOpen(false)
    return null
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(null)
    try {
      if (!form.categoryId || !form.foundOn) throw new Error('Informe categoria e data em que o item foi encontrado.')
      if (!editing && !form.qrCodeGuid) throw new Error('Selecione ou escaneie uma etiqueta QR para cadastrar o item.')
      const body = { categoryId: Number(form.categoryId), name: form.name.trim(), description: form.description.trim(), location: form.location.trim(), foundOn: new Date(form.foundOn).toISOString() }
      if (editing) {
        await api(`/api/admin/items/${editing.id}`, { protected: true, method: 'PATCH', body })
        setMessage('Item atualizado.');
        setPhotoItemId(editing.id)
      } else {
        const created = await api<{ id: number }>('/api/admin/items', { protected: true, method: 'POST', body: { ...body, qrCodeGuid: form.qrCodeGuid } })
        setMessage('Item cadastrado.');
        setPhotoItemId(created.id)
      }
      closeForm(); setRevision(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao salvar item.') }
    finally { setBusy(false) }
  }

  return <>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}><div><Typography variant="h5">Gestão de itens</Typography><Typography color="text.secondary">Itens ativos e encerrados nos últimos sete dias.</Typography></div><Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Cadastrar item</Button></Stack>
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {!active ? <Loading /> : <>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Disponíveis <Chip size="small" label={active.total} sx={{ ml: 1 }} /></Typography>
      <div className="admin-item-grid">{active.items.map(item => <Paper key={item.id} variant="outlined" className="admin-item-row"><div><Typography fontWeight={700}>{item.name}</Typography><Typography variant="body2" color="text.secondary">{item.category} · {item.location}</Typography></div><Stack direction="row" alignItems="center" spacing={1}>{itemStatus(item.status)}<IconButton component={RouterLink} to={`/itens/${item.id}`} aria-label={`Abrir ${item.name}`}><ArrowForwardIcon /></IconButton><IconButton aria-label={`Gerenciar fotos de ${item.name}`} onClick={() => setPhotoItemId(item.id)}><PhotoCameraOutlinedIcon /></IconButton><IconButton aria-label={`Editar ${item.name}`} onClick={() => { setEditing(item); setForm({ categoryId: String(categories.find(category => category.name === item.category)?.id || ''), qrCodeGuid: '', name: item.name, description: item.description, location: item.location, foundOn: toLocalInput(item.foundOn) }); setFormOpen(true) }}><EditOutlinedIcon /></IconButton></Stack></Paper>)}</div>
      {active.total > active.items.length && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Exibindo os 100 itens ativos mais recentes.</Typography>}
      {closed && closed.items.length > 0 && <><Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 1.5 }}>Encerrados recentemente</Typography><div className="admin-item-grid">{closed.items.map(item => <Paper key={item.id} variant="outlined" className="admin-item-row"><div><Typography fontWeight={700}>{item.name}</Typography><Typography variant="body2" color="text.secondary">{formatDate(item.statusChangedAt)}</Typography></div><Stack direction="row" alignItems="center" spacing={1}>{itemStatus(item.status)}<IconButton component={RouterLink} to={`/itens/${item.id}`} aria-label={`Abrir ${item.name}`}><ArrowForwardIcon /></IconButton><IconButton aria-label={`Gerenciar fotos de ${item.name}`} onClick={() => setPhotoItemId(item.id)}><PhotoCameraOutlinedIcon /></IconButton></Stack></Paper>)}</div></>}
    </>}
    <PhotoDialog itemId={photoItemId} onClose={() => setPhotoItemId(null)} onSaved={() => { setPhotoItemId(null); setRevision(value => value + 1); setMessage('Fotos atualizadas.') }} />
    <Dialog open={formOpen} onClose={() => !busy && closeForm()} fullWidth maxWidth="sm"><Box component="form" onSubmit={submit}><DialogTitle>{editing ? `Editar item #${editing.id}` : 'Cadastrar item'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <TextField label="Nome" value={form.name} onChange={event => update('name', event.target.value)} inputProps={{ maxLength: 255 }} required fullWidth />
      <TextField label="Descrição" value={form.description} onChange={event => update('description', event.target.value)} inputProps={{ maxLength: 2000 }} multiline minRows={3} required fullWidth />
      <TextField label="Local encontrado" value={form.location} onChange={event => update('location', event.target.value)} inputProps={{ maxLength: 255 }} required fullWidth />
      <TextField select label="Categoria" value={form.categoryId} onChange={event => update('categoryId', event.target.value)} required fullWidth>{categories.map(category => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}</TextField>
      <TextField label="Data e hora em que foi encontrado" type="datetime-local" value={form.foundOn} onChange={event => update('foundOn', event.target.value)} InputLabelProps={{ shrink: true }} required fullWidth helperText="O horário local será convertido para UTC ao enviar à API." />
      {!editing && <>
        <TextField select label="Etiqueta QR" value={form.qrCodeGuid} onChange={event => update('qrCodeGuid', event.target.value)} required fullWidth helperText={codes.length ? 'Selecione uma etiqueta livre ou escaneie a etiqueta impressa.' : 'Nenhuma etiqueta livre. Gere uma na aba Etiquetas QR.'}>
          <MenuItem value="" disabled>Selecione uma etiqueta</MenuItem>
          {codes.map(code => <MenuItem key={code.id} value={code.guid}>#{code.id} · {code.guid.slice(0, 8)}…</MenuItem>)}
        </TextField>
        <Button type="button" variant="outlined" startIcon={<QrCodeScannerIcon />} onClick={() => setScanOpen(true)} disabled={scanOpen || busy}>Escanear etiqueta com a câmera</Button>
        {scanOpen && <QrScanner onDetected={selectScannedQr} onClose={() => setScanOpen(false)} />}
      </>}
    </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={closeForm}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy}>Salvar item</Button></DialogActions></Box></Dialog>
  </>
}

function PhotoDialog({ itemId, onClose, onSaved }: { itemId: number | null; onClose: () => void; onSaved: () => void }) {
  const api = useApi()
  const [item, setItem] = useState<Item | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    setItem(null); setFiles([]); setError(null); setCameraOpen(false)
    if (itemId === null) return
    let alive = true
    publicApi<Item>(`/api/items/${itemId}`)
      .then(value => { if (alive) setItem(value) })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar fotos.') })
    return () => { alive = false }
  }, [itemId])

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])

  useEffect(() => {
    if (!cameraOpen) return
    let active = true
    let stream: MediaStream | null = null
    setCameraReady(false)
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('A câmera exige HTTPS ou localhost e um navegador compatível.')
        }
        const opened = await navigator.mediaDevices.getUserMedia({
          audio: false, video: { facingMode: { ideal: 'environment' } },
        })
        if (!active) { opened.getTracks().forEach(track => track.stop()); return }
        stream = opened
        if (videoRef.current) {
          videoRef.current.srcObject = opened
          await videoRef.current.play()
          if (active) setCameraReady(true)
        }
      } catch (reason) {
        if (!active) return
        const name = reason instanceof DOMException ? reason.name : ''
        setError(name === 'NotAllowedError'
          ? 'Permita o acesso à câmera nas configurações do navegador.'
          : name === 'NotFoundError'
            ? 'Nenhuma câmera foi encontrada neste dispositivo.'
            : reason instanceof Error ? reason.message : 'Não foi possível abrir a câmera.')
        setCameraOpen(false)
      }
    }
    void startCamera()
    return () => {
      active = false
      stream?.getTracks().forEach(track => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [cameraOpen])

  async function capturePhoto() {
    const video = videoRef.current
    if (!video?.videoWidth || !video.videoHeight) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) { setError('Não foi possível capturar a foto.'); return }
    const photo = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
    if (files.length >= 3 || photo.size > 5_000_000) {
      setError('Selecione até 3 fotos de no máximo 5 MB cada.'); return
    }
    setFiles(current => [...current, photo])
    setError(null)
    setCameraOpen(false)
  }

  function selectPhotos(selected: FileList | null, append = false) {
    if (!selected?.length) return
    const next = append ? [...files, ...Array.from(selected)] : Array.from(selected)
    if (next.length > 3 || next.some(file => file.size > 5_000_000 || file.size === 0)) {
      setError('Selecione até 3 fotos de no máximo 5 MB cada.'); return
    }
    setError(null); setFiles(next)
  }

  async function replacePhotos(replacements: File[]) {
    if (itemId === null) return
    setBusy(true); setError(null)
    try {
      const body = new FormData()
      replacements.forEach(file => body.append('files', file))
      await api(`/api/admin/items/${itemId}/photos`, { protected: true, method: 'PUT', body })
      onSaved()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar as fotos.') }
    finally { setBusy(false) }
  }

  return <Dialog open={itemId !== null} onClose={() => !busy && onClose()} fullWidth maxWidth="sm">
    <DialogTitle>Fotos do item {item ? `#${item.id} · ${item.name}` : `#${itemId}`}</DialogTitle>
    <DialogContent>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Fotos opcionais. Escolha até 3 imagens JPEG, PNG ou WebP, com no máximo 5 MB cada. O primeiro arquivo será a capa. Salvar novas fotos substitui todas as anteriores.</Typography>
      {item?.photos?.length ? <><Typography fontWeight={700} variant="body2">Fotos atuais</Typography><div className="photo-upload-grid">{item.photos?.map(photo => <img key={photo.id} src={apiUrl(`/api/items/${item.id}/photos/${photo.id}`)} alt={`Foto atual de ${item.name}`} />)}</div></> : null}
      {previews.length > 0 && <><Typography fontWeight={700} variant="body2" sx={{ mt: 2 }}>Novas fotos</Typography><div className="photo-upload-grid">{previews.map((url, index) => <img key={url} src={url} alt={`Nova foto ${index + 1}`} />)}</div></>}
      {cameraOpen && <Box sx={{ mt: 2 }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, background: '#18222b' }} />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={() => void capturePhoto()} disabled={!cameraReady}>Capturar foto</Button>
          <Button onClick={() => setCameraOpen(false)}>Fechar câmera</Button>
        </Stack>
      </Box>}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" startIcon={<PhotoCameraOutlinedIcon />} onClick={() => { setError(null); setCameraOpen(true) }} disabled={busy || cameraOpen || files.length >= 3}>Tirar foto</Button>
        <Button variant="outlined" component="label" disabled={busy}>Escolher arquivos<input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { selectPhotos(event.target.files); event.target.value = '' }} /></Button>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={busy}>{item?.photos?.length ? 'Cancelar' : 'Pular por enquanto'}</Button>
      {item?.photos?.length ? <Button color="error" onClick={() => void replacePhotos([])} disabled={busy}>Remover todas</Button> : null}
      <Button variant="contained" onClick={() => void replacePhotos(files)} disabled={busy || files.length === 0}>Salvar fotos</Button>
    </DialogActions>
  </Dialog>
}
function CategoriesPanel() {
  const api = useApi()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => { let alive = true; publicApi<Category[]>('/api/categories').then(data => { if (alive) setCategories(data) }).catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar categorias.') }); return () => { alive = false } }, [revision])
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null)
    try {
      await api(editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories', { protected: true, method: editing ? 'PUT' : 'POST', body: { name: name.trim() } })
      setMessage(editing ? 'Categoria renomeada.' : 'Categoria criada.'); setName(''); setEditing(null); setRevision(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao salvar categoria.') }
    finally { setBusy(false) }
  }
  return <><Typography variant="h5">Categorias</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Organize o catálogo com nomes claros e fáceis de encontrar.</Typography>{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper variant="outlined" className="admin-form-card"><Box component="form" onSubmit={submit}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth label={editing ? 'Novo nome da categoria' : 'Nova categoria'} value={name} onChange={event => setName(event.target.value)} required inputProps={{ maxLength: 255 }} /><Button type="submit" variant="contained" disabled={busy || !name.trim()} sx={{ whiteSpace: 'nowrap' }}>{editing ? 'Salvar nome' : 'Adicionar'}</Button>{editing && <Button onClick={() => { setEditing(null); setName('') }}>Cancelar</Button>}</Stack></Box></Paper>
    <div className="admin-item-grid" style={{ marginTop: 22 }}>{categories.map(category => <Paper key={category.id} variant="outlined" className="admin-item-row"><Typography fontWeight={700}>{category.name}</Typography><Button startIcon={<EditOutlinedIcon />} onClick={() => { setEditing(category); setName(category.name) }}>Renomear</Button></Paper>)}</div>
  </>
}

function QRPanel() {
  const api = useApi()
  const [codes, setCodes] = useState<QRCode[]>([])
  const [count, setCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [printing, setPrinting] = useState<number | 'all' | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => { let alive = true; api<QRCode[]>('/api/admin/qr-codes/available', { protected: true }).then(data => { if (alive) { setCodes(data); setError(null) } }).catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar etiquetas.') }); return () => { alive = false } }, [api, revision])
  async function generate() {
    setBusy(true); setError(null)
    try { const created = await api<QRCode[]>('/api/admin/qr-codes', { protected: true, method: 'POST', body: { count } }); setMessage(`${created.length} ${created.length === 1 ? 'etiqueta criada' : 'etiquetas criadas'}.`); setRevision(value => value + 1) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao gerar etiquetas.') }
    finally { setBusy(false) }
  }
  async function copy(guid: string) { try { await navigator.clipboard.writeText(labelUrl(guid)); setMessage('Link da etiqueta copiado.') } catch { setError('Não foi possível copiar o link.') } }
  async function print(selected: QRCode[], filename: string, key: number | 'all') {
    setPrinting(key); setError(null)
    try { await downloadLabelsPdf(selected, filename) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao gerar o PDF das etiquetas.') }
    finally { setPrinting(null) }
  }
  return <><Typography variant="h5">Etiquetas QR</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Crie etiquetas e vincule uma delas ao cadastrar um item.</Typography>{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper variant="outlined" className="admin-form-card"><Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}><TextField label="Quantidade" type="number" value={count} onChange={event => setCount(Number(event.target.value))} inputProps={{ min: 1, max: 100 }} sx={{ width: { sm: 150 } }} /><Button startIcon={<QrCode2Icon />} variant="contained" disabled={busy || count < 1 || count > 100} onClick={() => void generate()}>Gerar etiquetas</Button><Typography variant="body2" color="text.secondary">Até 100 por vez</Typography></Stack></Paper>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'start', sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mt: 4, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>Disponíveis para vincular <Chip label={codes.length} size="small" sx={{ ml: 1 }} /></Typography>
      <Button variant="outlined" startIcon={<PrintOutlinedIcon />} disabled={codes.length === 0 || printing !== null} onClick={() => void print(codes, 'findit-etiquetas-disponiveis.pdf', 'all')}>Imprimir todas (PDF)</Button>
    </Stack>
    {labelBaseUrl.includes('localhost') && <Alert severity="info" sx={{ mb: 2 }}>Os QR codes desta versão apontam para localhost. Para etiquetas usadas em outros dispositivos, configure VITE_PUBLIC_APP_URL com o endereço publicado antes de imprimir.</Alert>}
    {codes.length === 0 ? <EmptyState title="Nenhuma etiqueta disponível" description="Gere etiquetas para começar a vincular os objetos encontrados." /> : <div className="qr-grid">{codes.map(code => <Card key={code.id} className="qr-card"><CardContent><div className="qr-image"><QRCodeSVG value={labelUrl(code.guid)} size={128} marginSize={1} /></div><Typography fontWeight={700} sx={{ mt: 1.5 }}>Etiqueta #{code.id}</Typography><Typography variant="caption" color="text.secondary" className="guid-text">{code.guid}</Typography><Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1 }}><Button size="small" startIcon={<ContentCopyIcon />} onClick={() => void copy(code.guid)}>Copiar link</Button><Button size="small" startIcon={<PrintOutlinedIcon />} disabled={printing !== null} onClick={() => void print([code], `findit-etiqueta-${code.id}.pdf`, code.id)}>Imprimir</Button></Stack></CardContent></Card>)}</div>}
  </>
}

function UsersPanel() {
  const api = useApi()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => { let alive = true; api<AdminUser[]>(`/api/admin/users${query ? `?search=${encodeURIComponent(query)}` : ''}`, { protected: true }).then(data => { if (alive) { setUsers(data); setError(null) } }).catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar usuários.') }); return () => { alive = false } }, [api, query, revision])
  async function toggle(user: AdminUser) {
    const action = user.isAdmin ? 'remover o acesso administrativo de' : 'conceder acesso administrativo a'
    if (!window.confirm(`Deseja ${action} ${user.name}?`)) return
    setBusy(user.id); setError(null)
    try { await api(`/api/admin/users/${user.id}/admin`, { protected: true, method: 'PATCH', body: { isAdmin: !user.isAdmin } }); setMessage('Permissão atualizada.'); setRevision(value => value + 1) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao alterar permissão.') }
    finally { setBusy(null) }
  }
  return <><Typography variant="h5">Usuários</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Controle quem pode administrar o FindIt.</Typography>{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box component="form" onSubmit={event => { event.preventDefault(); setQuery(search.trim()) }} sx={{ display: 'flex', gap: 1, mb: 3, maxWidth: 500 }}><TextField fullWidth label="Buscar por nome ou e-mail" value={search} onChange={event => setSearch(event.target.value)} /><Button type="submit" variant="contained">Buscar</Button></Box>
    <Stack spacing={1.5}>{users.map(user => <Paper key={user.id} variant="outlined" className="admin-item-row"><div><Typography fontWeight={700}>{user.name} {user.isAdmin && <Chip label="Administrador" size="small" color="primary" sx={{ ml: 1 }} />}</Typography><Typography variant="body2" color="text.secondary">{user.email}</Typography></div><Button color={user.isAdmin ? 'error' : 'primary'} variant="outlined" disabled={busy === user.id} onClick={() => void toggle(user)}>{user.isAdmin ? 'Remover acesso' : 'Tornar admin'}</Button></Paper>)}</Stack>
    {!error && users.length === 0 && <EmptyState title="Nenhum usuário encontrado" description="Tente outra busca ou peça para a pessoa entrar no FindIt antes de atribuir permissões." />}
  </>
}
