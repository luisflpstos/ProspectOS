# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota versionamento semântico.

## [Não lançado]

### Segurança
- A API local só atende a própria máquina: Host não-local (DNS rebinding) e
  escritas com Origin de outro site (CSRF) recebem 403.
- Analisador de sites não acessa mais localhost/rede interna (SSRF), nem via
  redirecionamento; lê no máximo 300 KB dentro de um prazo total.
- Exportação CSV escapa fórmulas (CSV injection a partir de bios/comentários).
- App de desktop: links comparados pela origem exata, bloqueio por padrão e
  `will-navigate` nas janelas principal e do WhatsApp.
- Dependências do frontend atualizadas: 23 vulnerabilidades (1 crítica, 16
  altas) → 3 baixas, só no CLI de desenvolvimento do shadcn.

### Corrigido
- Leads recebiam nicho/cidade da query errada quando uma query não tinha
  resultado (agora o `input_id` é determinístico: `q0`, `q1`...).
- Timeout do scraper não disparava se ele travasse sem imprimir nada; ao
  cancelar, os processos do Chromium agora também são encerrados.
- Análise do Instagram interrompida por restart ficava "em andamento" para
  sempre, sem botão de retomar.
- Excluir um post do Instagram podia apagar um lead já trabalhado que tinha
  comentado nele.
- Backup do banco agora usa a API de backup do SQLite (seguro em modo WAL).
- Erro inesperado numa empresa não derruba mais a verificação do lote todo.
- "Sem atualização desde 2001" em sites com copyright "2001-2026".
- Observações salvas e fim da análise do Instagram não atualizavam a tela.
- Som começava mudo em instalação nova.
- Exportação CSV com BOM (acentos corretos no Excel).
- App de desktop: uma segunda instância não sobe mais um segundo backend.

### Alterado
- Telas carregadas sob demanda: bundle inicial de 1,36 MB → 669 kB.
- Dependências atualizadas (React 19.3, Vite 8.3, React Router 7.18.5,
  google-genai 2.33, openai 2.54, instagrapi 2.18.20, entre outras).
- Receita versionada do rebuild do `google-maps-scraper.exe` para Windows em
  `backend/build-scraper/`.

## [2.0.0] - 2026-07-17

Salto grande: o ProspectOS deixou de ser "achador de leads sem site" e virou uma
ferramenta completa de prospecção — com análise real de sites, diagnóstico em PDF,
busca por mapa, estratégia por lead e um modo foco pra prospectar em ritmo.

### Adicionado

**Análise de sites (o coração da qualificação)**
- Detecção de **site ruim** além de "sem site": fora do ar, sem HTTPS/"não seguro",
  certificado SSL inválido, conteúdo misto, não adaptado para celular, página vazia,
  **site lento** (servidor demora a responder) e **feito em construtor pronto**
  (Wix, Canva, Google Sites, Webnode e afins). Site que existe mas afasta cliente
  também é lead — o pool de leads por busca aumenta bastante.
- **Raio-X do site**: extração do que a página realmente tem e o que falta
  (WhatsApp, telefone clicável, e-mail, redes, mapa, fotos, título, meta description,
  favicon) direto do HTML — dado real, nunca chute.
- Detecção de site **parado no tempo** pelo ano de copyright no rodapé.
- Checagem de disponibilidade mais inteligente: retry em falha transitória, e
  domínio que não resolve é diagnosticado como "pode ter expirado" (não "fora do ar").

**Diagnóstico em PDF**
- Relatório de presença digital de uma página, pronto pra mandar no WhatsApp:
  placar visual (reputação, desempenho, pontos a corrigir), problemas em linguagem
  leiga, raio-X em painéis e chamada final assinada com o nome do vendedor.
- Integração opcional com o **Google PageSpeed Insights** (nota oficial de
  desempenho e tempo de carregamento no celular).

**Busca por mapa (estilo segmentação do Facebook Ads)**
- Solte pinos num mapa (Leaflet + OpenStreetMap, sem chave de API), defina o raio
  de cada um e escolha nichos num catálogo clicável de 170+ opções por categoria.
  Cada pino roda uma busca geolocalizada; o rótulo do pino vira a cidade do lead.
- Busca de cidade/bairro e geocodificação reversa via Nominatim.

**Fluxo de prospecção**
- **Estratégia de abordagem por lead**: cenário detectado (sem site / fora do ar /
  inseguro / lento / construtor...), ângulo de venda, ganchos concretos e objeções
  com respostas prontas — determinístico, sem custo de IA.
- **Score de priorização** (0-100) combinando nota, volume de avaliações e situação
  do site, com ordenação da fila por score.
- **Sessão de prospecção**: modo foco, um lead por vez do mais quente ao mais frio,
  começando pelos follow-ups vencidos; abordagem em um clique (Enter/→/Backspace).
- **Tarefas de hoje**: follow-ups vencidos + leads quentes com WhatsApp preenchido.
- **Perfil do vendedor**: as copies de IA saem assinadas e na sua voz.

**Qualidade de vida**
- Filtro por situação do site na lista de leads.
- Botão "Reanalisar site" para atualizar status/problemas/raio-X na hora.
- Histórico de buscas do Maps.
- Busca global por atalho (Ctrl/Cmd + K): pula pra qualquer página ou acha um lead.
- Retomada de análise do Instagram interrompida.

### Alterado

- **Reengenharia dos prompts de IA**: arquitetura system + user, copy sempre em
  primeira pessoa do singular (voz de freelancer, não de agência), fechamento
  sorteado no servidor, follow-up que enxerga a mensagem anterior para variar de
  verdade, e classificação de perfis com JSON mode nativo.
- **Backend reorganizado**: o monólito `app.py` (~2.900 linhas) foi dividido em
  blueprints por domínio (`rotas_leads`, `rotas_instagram`, `rotas_analytics`,
  `rotas_config`) mais módulos dedicados (`ia`, `jobs`, `db`, `diagnostico`,
  `constantes`).
- **Instagram defensivo**: backoff exponencial com jitter, parada limpa em
  checkpoint/rate limit, e salvamento incremental que permite retomar a análise.
- **Redesign da interface**: heros e estados vazios padronizados, tiles de métrica
  com hierarquia, gráficos com paleta de marca, modais de lead mais largos e
  responsivos, tema claro/escuro consistente.

### Corrigido

- Race condition no disparo de buscas/análises simultâneas.
- 404/405 deixavam de ser tratados como erro interno.
- Leads do Instagram passam a ser deduplicados por username entre posts.
- Dados pessoais que estavam hardcoded no código foram removidos.

### Segurança

- Chaves de API salvas pela interface vão para o cofre de credenciais do sistema
  (Windows Credential Manager via `keyring`/DPAPI), não mais em texto puro no banco.
- Migração automática move chaves legadas do banco para o cofre no primeiro boot.
- `.gitignore` reforçado (arquivos temporários do SQLite, `.env` em qualquer nível).

## [1.x] - 2026-07

Versão inicial: CRM de prospecção com canais Google Maps e Instagram, geração de
mensagens por IA com fallback entre provedores, funil de status com Kanban,
follow-up com cadência, tags, analytics e exportação CSV.
