import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import type { Item, ItemStatus, RequestStatus } from './types'
import { apiUrl } from './api'

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}

export function itemStatus(status: ItemStatus) {
  const labels = { Active: 'Disponível', Returned: 'Devolvido', Archived: 'Arquivado' }
  const colors = { Active: 'success', Returned: 'info', Archived: 'default' } as const
  return <Chip label={labels[status]} color={colors[status]} size="small" variant="outlined" />
}

export function requestStatus(status: RequestStatus) {
  const labels = { Pending: 'Em análise', Approved: 'Aprovada', Rejected: 'Recusada', Cancelled: 'Cancelada', Expired: 'Expirada' }
  const colors = { Pending: 'warning', Approved: 'success', Rejected: 'error', Cancelled: 'default', Expired: 'default' } as const
  return <Chip label={labels[status]} color={colors[status]} size="small" />
}

export function ItemIllustration({ category, large = false }: { category: string; large?: boolean }) {
  const normalized = category.toLowerCase()
  const Icon = normalized.includes('eletr') || normalized.includes('tecn') ? DevicesOutlinedIcon
    : normalized.includes('chave') ? KeyOutlinedIcon
    : normalized.includes('livro') || normalized.includes('document') ? MenuBookOutlinedIcon
    : normalized.includes('bolsa') || normalized.includes('mochila') ? BackpackOutlinedIcon
    : Inventory2OutlinedIcon
  return (
    <Box className={`item-illustration${large ? ' item-illustration-large' : ''}`}>
      <Box className="illustration-orbit illustration-orbit-one" />
      <Box className="illustration-orbit illustration-orbit-two" />
      <Icon className="illustration-icon" />
    </Box>
  )
}

export function ItemVisual({ item, large = false, photoId }: { item: Item; large?: boolean; photoId?: number }) {
  const selected = photoId ?? item.photos?.[0]?.id
  if (!selected) return <ItemIllustration category={item.category} large={large} />
  return <Box className={`item-illustration item-photo${large ? ' item-illustration-large' : ''}`}>
    <img src={apiUrl(`/api/items/${item.id}/photos/${selected}`)} alt={`Foto de ${item.name}`} loading={large ? 'eager' : 'lazy'} />
  </Box>
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 10 }}>
    <CircularProgress size={30} /><Typography color="text.secondary">{label}</Typography>
  </Stack>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <Stack spacing={2} sx={{ py: 4 }}>
    <Alert severity="error">{message}</Alert>
    {onRetry && <Button onClick={onRetry} variant="outlined" sx={{ alignSelf: 'flex-start' }}>Tentar novamente</Button>}
  </Stack>
}

export function EmptyState({ title, description, action, href }: {
  title: string; description: string; action?: string; href?: string
}) {
  return <Box className="empty-state">
    <CheckCircleOutlineIcon sx={{ fontSize: 44, color: 'primary.main' }} />
    <Typography variant="h6" sx={{ mt: 1 }}>{title}</Typography>
    <Typography color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mt: 0.5 }}>{description}</Typography>
    {action && href && <Button component={RouterLink} to={href} variant="contained" sx={{ mt: 2 }}>{action}</Button>}
  </Box>
}
