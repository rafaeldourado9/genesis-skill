# Genesis Framework — Instalador Remoto (Windows PowerShell)
# Uso: iwr -useb https://raw.githubusercontent.com/rafaeldourado9/genesis/main/scripts/install-remote.ps1 | iex
# Ou:  iwr -useb ... | iex; Invoke-Genesis "C:\seu\projeto"

param([string]$Target = ".")

$Repo   = "rafaeldourado9/genesis"
$Branch = "main"

Write-Host ""
Write-Host "Genesis Framework — Instalando..." -ForegroundColor Cyan
Write-Host ""

# ── Método 1: npx (preferido) ────────────────────────────────────────────────
$npx = Get-Command npx -ErrorAction SilentlyContinue
if ($npx) {
    Write-Host "Node.js detectado — usando npx" -ForegroundColor Green
    Write-Host ""
    & npx genesis-framework@latest init $Target
    exit 0
}

# ── Método 2: Invoke-WebRequest + Expand-Archive ─────────────────────────────
Write-Host "Node.js não encontrado — baixando via PowerShell" -ForegroundColor Yellow

$TmpDir = Join-Path $env:TEMP "genesis-install-$(Get-Random)"
New-Item -ItemType Directory -Path $TmpDir | Out-Null

try {
    $ZipUrl  = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"
    $ZipPath = Join-Path $TmpDir "genesis.zip"
    $ExtPath = Join-Path $TmpDir "extracted"

    Write-Host "Baixando genesis@$Branch..."
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing

    Expand-Archive -Path $ZipPath -DestinationPath $ExtPath -Force
    $ExtractedDir = Get-ChildItem $ExtPath -Directory | Select-Object -First 1

    & powershell -NonInteractive -File (Join-Path $ExtractedDir.FullName "install.ps1") -ProjectPath $Target
}
finally {
    Remove-Item -Recurse -Force $TmpDir -ErrorAction SilentlyContinue
}
