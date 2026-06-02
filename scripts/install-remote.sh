#!/usr/bin/env bash
# Genesis Framework — Instalador Remoto (Linux/macOS)
# Uso: curl -fsSL https://raw.githubusercontent.com/rafaeldourado9/genesis/main/scripts/install-remote.sh | bash
# Ou:  curl -fsSL ... | bash -s -- /caminho/do/projeto

set -euo pipefail

REPO="rafaeldourado9/genesis"
BRANCH="main"
TARGET="${1:-.}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}Genesis Framework — Instalando...${NC}"
echo ""

# ── Método 1: npx (preferido, mais rápido) ──────────────────────────────────
if command -v npx &>/dev/null; then
  echo -e "${GREEN}Node.js detectado — usando npx${NC}"
  echo ""
  npx genesis-framework@latest init "$TARGET"
  exit 0
fi

# ── Método 2: curl + tar (sem Node.js) ──────────────────────────────────────
if command -v curl &>/dev/null && command -v tar &>/dev/null; then
  echo -e "${YELLOW}Node.js não encontrado — baixando via curl${NC}"
  TMPDIR_GENESIS=$(mktemp -d)
  trap "rm -rf $TMPDIR_GENESIS" EXIT

  echo "Baixando genesis@${BRANCH}..."
  curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" \
    | tar -xz -C "$TMPDIR_GENESIS" --strip-components=1

  bash "$TMPDIR_GENESIS/install.sh" "$TARGET"
  exit 0
fi

# ── Método 3: git clone ──────────────────────────────────────────────────────
if command -v git &>/dev/null; then
  echo -e "${YELLOW}Usando git clone como fallback${NC}"
  TMPDIR_GENESIS=$(mktemp -d)
  trap "rm -rf $TMPDIR_GENESIS" EXIT

  git clone --depth=1 "https://github.com/${REPO}.git" "$TMPDIR_GENESIS"
  bash "$TMPDIR_GENESIS/install.sh" "$TARGET"
  exit 0
fi

echo -e "${RED}Erro: instale Node.js (npx), curl+tar, ou git para continuar.${NC}"
echo "  Node.js (recomendado): https://nodejs.org"
exit 1
