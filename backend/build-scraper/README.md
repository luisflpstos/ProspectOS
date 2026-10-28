# Rebuild do google-maps-scraper (Windows)

O binário oficial quebra no Windows por:

1. CDN aposentado do Playwright (404 no driver)
2. Bug `isClosed()` invertido no scrapemate (`unexpected page type`)
3. Flags Chromium `--single-process` / `--no-zygote` que derrubam o browser

Este Dockerfile gera um `.exe` com o [PR #25 do scrapemate](https://github.com/gosom/scrapemate/pull/25) + patches locais.

## Como rebuildar

Requisitos: Docker Desktop rodando.

```powershell
cd ProspectOS\backend\build-scraper
docker build -t prospectos-gmaps-scraper-fix .
docker create --name gmaps-extract prospectos-gmaps-scraper-fix
docker cp gmaps-extract:/out/google-maps-scraper.exe .\out\google-maps-scraper.exe
docker rm gmaps-extract
Copy-Item .\out\google-maps-scraper.exe ..\google-maps-scraper.exe -Force
```

Depois reinicie o backend (`py app.py`).
