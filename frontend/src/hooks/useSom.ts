import { useEffect, useState } from "react"

const SONS = {
  "busca-maps-concluida": "/sounds/busca-maps-concluida.mp3",
  "analise-instagram-concluida": "/sounds/analise-instagram-concluida.mp3",
  "followup-marcado": "/sounds/followup-marcado.mp3",
  "card-movido": "/sounds/card-movido.mp3",
  copiado: "/sounds/copiado.mp3",
  "lead-fechou": "/sounds/lead-fechou.mp3",
  "apagar-lead": "/sounds/apagar-lead.mp3",
} as const

export type NomeSom = keyof typeof SONS

const CHAVE_ATIVADO = "som-ativado"
const CHAVE_VOLUME = "som-volume"
const VOLUME_PADRAO = 0.5

function lerSomAtivado(): boolean {
  return localStorage.getItem(CHAVE_ATIVADO) !== "false"
}

function lerSomVolume(): number {
  const bruto = localStorage.getItem(CHAVE_VOLUME)
  // Number(null) e Number("") viram 0 - sem isso, instalação nova começava muda
  if (bruto === null || bruto.trim() === "") return VOLUME_PADRAO
  const salvo = Number(bruto)
  return Number.isFinite(salvo) && salvo >= 0 && salvo <= 1 ? salvo : VOLUME_PADRAO
}

export function tocarSom(nome: NomeSom): void {
  if (!lerSomAtivado()) return
  try {
    const audio = new Audio(SONS[nome])
    audio.volume = lerSomVolume()
    audio.play().catch(() => {
      // navegador pode bloquear autoplay antes da primeira interação do usuário - ignora silenciosamente
    })
  } catch {
    // ignora falha de reprodução (arquivo ausente, navegador sem suporte, etc.)
  }
}

export function useConfigSom() {
  const [ativado, setAtivadoState] = useState(lerSomAtivado)
  const [volume, setVolumeState] = useState(lerSomVolume)

  useEffect(() => {
    localStorage.setItem(CHAVE_ATIVADO, String(ativado))
  }, [ativado])

  useEffect(() => {
    localStorage.setItem(CHAVE_VOLUME, String(volume))
  }, [volume])

  const testarSom = () => {
    const somAntes = lerSomAtivado()
    if (!somAntes) localStorage.setItem(CHAVE_ATIVADO, "true")
    tocarSom("copiado")
    if (!somAntes) localStorage.setItem(CHAVE_ATIVADO, String(ativado))
  }

  return {
    ativado,
    setAtivado: setAtivadoState,
    volume,
    setVolume: setVolumeState,
    testarSom,
  }
}
