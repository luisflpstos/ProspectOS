import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/queryClient"
import { PaletaComando } from "@/components/shared/PaletaComando"
import { DashboardPage } from "@/pages/DashboardPage"

// Telas carregadas sob demanda: cada uma vira um chunk proprio, entao o
// dashboard abre sem baixar o mapa (Leaflet), os graficos (Recharts) etc.
const TarefasPage = lazy(() => import("@/pages/TarefasPage").then((m) => ({ default: m.TarefasPage })))
const SessaoProspeccaoPage = lazy(() =>
  import("@/pages/SessaoProspeccaoPage").then((m) => ({ default: m.SessaoProspeccaoPage })),
)
const LeadsMapsPage = lazy(() => import("@/pages/LeadsMapsPage").then((m) => ({ default: m.LeadsMapsPage })))
const ConversaPage = lazy(() => import("@/pages/ConversaPage").then((m) => ({ default: m.ConversaPage })))
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })))
const InstagramPage = lazy(() => import("@/pages/InstagramPage").then((m) => ({ default: m.InstagramPage })))
const InstagramAnalyticsPage = lazy(() =>
  import("@/pages/InstagramAnalyticsPage").then((m) => ({ default: m.InstagramAnalyticsPage })),
)
const InstagramArquivadosPage = lazy(() =>
  import("@/pages/InstagramArquivadosPage").then((m) => ({ default: m.InstagramArquivadosPage })),
)
const ConfiguracoesPage = lazy(() =>
  import("@/pages/ConfiguracoesPage").then((m) => ({ default: m.ConfiguracoesPage })),
)
const DocumentacaoPage = lazy(() =>
  import("@/pages/DocumentacaoPage").then((m) => ({ default: m.DocumentacaoPage })),
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <PaletaComando />
          <Suspense fallback={<div className="min-h-screen" />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tarefas" element={<TarefasPage />} />
              <Route path="/sessao" element={<SessaoProspeccaoPage />} />
              <Route path="/leads" element={<LeadsMapsPage />} />
              <Route path="/conversas/:placeId" element={<ConversaPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/instagram" element={<InstagramPage />} />
              <Route path="/instagram/analytics" element={<InstagramAnalyticsPage />} />
              <Route path="/instagram/arquivados" element={<InstagramArquivadosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/documentacao" element={<DocumentacaoPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
