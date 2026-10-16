import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'

export default function QrScanner({ onDetected, onClose }: {
  onDetected: (content: string) => string | null
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const onDetectedRef = useRef(onDetected)
  const [message, setMessage] = useState<string | null>(null)
  onDetectedRef.current = onDetected

  useEffect(() => {
    let active = true
    let controls: { stop(): void } | null = null
    let completed = false

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('A câmera exige HTTPS ou localhost e um navegador compatível.')
        }
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        if (!active || !videoRef.current) return
        const reader = new BrowserQRCodeReader()
        const scanning = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result, _error, scanControls) => {
            if (!active || completed || !result) return
            const problem = onDetectedRef.current(result.getText())
            if (problem) setMessage(problem)
            else { completed = true; scanControls.stop() }
          },
        )
        if (active) controls = scanning
        else scanning.stop()
      } catch (reason) {
        if (!active) return
        const name = reason instanceof DOMException ? reason.name : ''
        setMessage(name === 'NotAllowedError'
          ? 'Permita o acesso à câmera nas configurações do navegador.'
          : name === 'NotFoundError'
            ? 'Nenhuma câmera foi encontrada neste dispositivo.'
            : reason instanceof Error ? reason.message : 'Não foi possível abrir a câmera.')
      }
    }
    void start()
    return () => { active = false; controls?.stop() }
  }, [])

  return <Box sx={{ mt: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Aponte a câmera para a etiqueta impressa. A leitura selecionará a etiqueta automaticamente.</Typography>
    {message && <Alert severity="warning" sx={{ mb: 1 }}>{message}</Alert>}
    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, background: '#18222b' }} />
    <Stack direction="row" sx={{ mt: 1 }}><Button type="button" onClick={onClose}>Fechar câmera</Button></Stack>
  </Box>
}
