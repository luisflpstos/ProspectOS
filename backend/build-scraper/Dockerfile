FROM golang:1.26-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates python3 && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# google-maps-scraper latest
RUN git clone --depth 1 https://github.com/gosom/google-maps-scraper.git .

# scrapemate PR #25 (mxschmitt playwright-go fix for CDN 404)
RUN git clone https://github.com/gosom/scrapemate.git /tmp/scrapemate \
 && cd /tmp/scrapemate \
 && git fetch origin pull/25/head:pr-25 \
 && git checkout pr-25

# Patches for Windows reliability:
# 1) isClosed() was inverted (!IsClosed)
# 2) recreateBrowser success returned (nil, nil)
# 3) Chromium --single-process / --no-zygote crash on modern Windows Chrome
RUN python3 - <<'PY'
from pathlib import Path

# --- session_slot.go ---
path = Path('/tmp/scrapemate/adapters/fetchers/jshttp/session_slot.go')
text = path.read_text()
old_closed = '''func (p *playwrightPage) isClosed() bool {
\treturn !p.p.IsClosed()
}'''
new_closed = '''func (p *playwrightPage) isClosed() bool {
\treturn p.p.IsClosed()
}'''
if old_closed not in text:
    raise SystemExit('isClosed pattern not found')
text = text.replace(old_closed, new_closed, 1)

old_acquire = '''\tif err := s.runtime.recreatePage(); err != nil {
\t\tif err := s.runtime.recreateContext(); err != nil {
\t\t\treturn nil, s.runtime.recreateBrowser()
\t\t}
\t}

\treturn s.runtime.primaryPage()
}'''
new_acquire = '''\tif err := s.runtime.recreatePage(); err != nil {
\t\tif err := s.runtime.recreateContext(); err != nil {
\t\t\tif err := s.runtime.recreateBrowser(); err != nil {
\t\t\t\treturn nil, err
\t\t\t}
\t\t}
\t}

\treturn s.runtime.primaryPage()
}'''
if old_acquire not in text:
    raise SystemExit('acquirePage recreate pattern not found')
text = text.replace(old_acquire, new_acquire, 1)
path.write_text(text)
print('patched session_slot.go')

# --- jshttp.go launch args ---
path = Path('/tmp/scrapemate/adapters/fetchers/jshttp/jshttp.go')
text = path.read_text()
# Drop crashy flags for Windows desktop Chromium
for flag in ("`--single-process`,\n\t\t\t", "`--no-zygote`,\n\t\t\t"):
    if flag not in text:
        raise SystemExit(f'launch flag pattern not found: {flag!r}')
    text = text.replace(flag, '', 1)
path.write_text(text)
print('patched jshttp.go launch args')
PY

# Point scraper at the fixed scrapemate
RUN mkdir -p /out \
 && go mod edit -replace=github.com/gosom/scrapemate=/tmp/scrapemate \
 && go mod tidy

ENV CGO_ENABLED=0
ENV GOOS=windows
ENV GOARCH=amd64

RUN go build -trimpath -ldflags="-s -w" -o /out/google-maps-scraper.exe .
