import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Container, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import { publicApi } from '../api'
import type { Category, Item, Page } from '../types'
import { EmptyState, ErrorState, formatDate, ItemVisual, Loading } from '../ui'

export function ItemCard({ item }: { item: Item }) {
  return <Card className="item-card">
    <CardActionArea component={RouterLink} to={`/itens/${item.id}`} sx={{ height: '100%' }}>
      <ItemVisual item={item} />
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Chip size="small" label={item.category} className="category-chip" />
          <Typography variant="caption" color="text.secondary">#{item.id}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ mt: 1.5, mb: 0.5, lineHeight: 1.2 }}>{item.name}</Typography>
        <Typography color="text.secondary" variant="body2" className="card-description">{item.description}</Typography>
        <Stack direction="row" justifyContent="space-between" className="card-bottom" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.4}><LocationOnOutlinedIcon sx={{ fontSize: 16 }} /><Typography variant="caption" noWrap>{item.location}</Typography></Stack>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </Stack>
      </CardContent>
    </CardActionArea>
  </Card>
}

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const categoryId = params.get('categoryId') || ''
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [draft, setDraft] = useState(search)
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<Page<Item> | null>(null)
  const [recent, setRecent] = useState<Page<Item> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => { setDraft(search) }, [search])
  useEffect(() => {
    let alive = true
    publicApi<Category[]>('/api/categories').then(data => { if (alive) setCategories(data) }).catch(() => {})
    publicApi<Page<Item>>('/api/items/recently-closed?pageSize=3').then(data => { if (alive) setRecent(data) }).catch(() => {})
    return () => { alive = false }
  }, [revision])
  useEffect(() => {
    let alive = true
    setLoading(true)
    const query = new URLSearchParams({ page: String(page), pageSize: '9' })
    if (search) query.set('search', search)
    if (categoryId) query.set('categoryId', categoryId)
    publicApi<Page<Item>>(`/api/items?${query}`)
      .then(data => { if (alive) { setResult(data); setError(null) } })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Falha ao carregar itens.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [search, categoryId, page, revision])

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (draft.trim()) next.set('search', draft.trim())
    if (categoryId) next.set('categoryId', categoryId)
    setParams(next)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return <>
    <section className="hero-section">
      <Container maxWidth="lg" className="hero-inner">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow"><AutoAwesomeOutlinedIcon sx={{ fontSize: 17 }} /> ACHADOS E PERDIDOS · UEMG DIVINÓPOLIS</span>
          <Typography component="h1" variant="h1" className="hero-title">Um reencontro<br />começa <em>aqui.</em></Typography>
          <Typography className="hero-subtitle">Encontre objetos perdidos no campus e acompanhe sua solicitação em um só lugar.</Typography>
          <Box component="form" onSubmit={submit} className="hero-search">
            <SearchIcon sx={{ color: '#729096' }} />
            <input aria-label="Buscar item" placeholder="O que você está procurando?" value={draft} onChange={event => setDraft(event.target.value)} />
            <Button type="submit" variant="contained">Buscar item</Button>
          </Box>
          <Stack direction="row" spacing={2.5} className="hero-trust">
            <span><ShieldOutlinedIcon fontSize="small" /> Solicitação segura</span>
            <span><CalendarMonthOutlinedIcon fontSize="small" /> Atualizado pelo campus</span>
          </Stack>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-circle hero-circle-back" />
          <div className="hero-circle hero-circle-front" />
          <div className="hero-float-card hero-float-main"><span className="hero-float-icon"><SearchIcon /></span><span><strong>Encontrou!</strong><small>O próximo passo é seu.</small></span></div>
          <div className="hero-float-card hero-float-secondary"><span className="tiny-success" /> <strong>Mais perto de você</strong></div>
          <div className="hero-dot hero-dot-one" /><div className="hero-dot hero-dot-two" />
        </div>
      </Container>
    </section>

    <Container maxWidth="lg" sx={{ pb: 9 }}>
      <section className="steps-section">
        <div><span className="step-number">01</span><strong>Explore os itens</strong><span>Pesquise por nome ou filtre por categoria.</span></div>
        <div><span className="step-number">02</span><strong>Conte sua história</strong><span>Faça uma solicitação informando por que o item é seu.</span></div>
        <div><span className="step-number">03</span><strong>Acompanhe tudo</strong><span>Veja o andamento e receba as instruções de retirada.</span></div>
      </section>

      <section id="catalogo" className="catalog-section">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'end' }} spacing={2} sx={{ mb: 3 }}>
          <div><span className="eyebrow">EXPLORE O CATÁLOGO</span><Typography variant="h3" sx={{ mt: 0.6 }}>Itens encontrados</Typography><Typography color="text.secondary" sx={{ mt: 0.8 }}>Veja o que está aguardando seu dono.</Typography></div>
          <FormControl size="small" sx={{ minWidth: 210 }}>
            <Select displayEmpty value={categoryId} aria-label="Filtrar por categoria" onChange={event => {
              const next = new URLSearchParams()
              if (search) next.set('search', search)
              if (event.target.value) next.set('categoryId', event.target.value)
              setParams(next)
            }}>
              <MenuItem value="">Todas as categorias</MenuItem>
              {categories.map(category => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        {search && <Alert severity="info" sx={{ mb: 2 }}>Resultados para <strong>{search}</strong> <Button size="small" onClick={() => setParams(categoryId ? { categoryId } : {})}>Limpar busca</Button></Alert>}
        {loading ? <Loading label="Buscando itens no catálogo…" /> : error ? <ErrorState message={error} onRetry={() => setRevision(value => value + 1)} /> : result?.items.length ? <>
          <div className="items-grid">{result.items.map(item => <ItemCard key={item.id} item={item} />)}</div>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
            <Typography color="text.secondary" variant="body2">{result.total} {result.total === 1 ? 'item encontrado' : 'itens encontrados'}</Typography>
            <Stack direction="row" spacing={1}>
              <Button disabled={page <= 1} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(page - 1)); return next })}>Anterior</Button>
              <Button disabled={page * result.pageSize >= result.total} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(page + 1)); return next })}>Próxima página</Button>
            </Stack>
          </Stack>
        </> : <EmptyState title="Nenhum item por aqui" description="Tente outros termos ou escolha uma categoria diferente." />}
      </section>

      {recent && recent.items.length > 0 && <section className="recent-section">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><div><span className="eyebrow">BOAS NOTÍCIAS</span><Typography variant="h4" sx={{ mt: 0.5 }}>Reencontros recentes</Typography></div></Stack>
        <div className="recent-grid">{recent.items.map(item => <RouterLink key={item.id} to={`/itens/${item.id}`} className="recent-item" aria-label={`Ver detalhes de ${item.name}`}><span className="recent-check">✓</span><div><strong>{item.name}</strong><Typography variant="body2" color="text.secondary">{item.status === 'Returned' ? 'Devolvido' : 'Arquivado'} · {formatDate(item.statusChangedAt)}</Typography></div><ArrowForwardIcon className="recent-arrow" fontSize="small" /></RouterLink>)}</div>
      </section>}
    </Container>
  </>
}
