#!/usr/bin/env node
'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');

const PKG_ROOT   = path.join(__dirname, '..');
const SKILLS_SRC = path.join(PKG_ROOT, '.agents', 'skills');
const VERSION    = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')).version;

// ── Args ────────────────────────────────────────────────────────────────────
const argv     = process.argv.slice(2);
const cmd      = argv[0] || 'help';
const isGlobal = argv.includes('--global') || argv.includes('-g');
const isForce  = argv.includes('--force')  || argv.includes('-f');
const targetArg = (() => {
  const idx = argv.findIndex(a => a === '--path' || a === '-p');
  if (idx !== -1) return argv[idx + 1];
  const pos = argv.slice(1).find(a => !a.startsWith('-'));
  return pos || null;
})();

// ── Colors ───────────────────────────────────────────────────────────────────
const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;
const g = {
  reset:  NO_COLOR ? '' : '\x1b[0m',
  bold:   NO_COLOR ? '' : '\x1b[1m',
  green:  NO_COLOR ? '' : '\x1b[32m',
  yellow: NO_COLOR ? '' : '\x1b[33m',
  cyan:   NO_COLOR ? '' : '\x1b[36m',
  gray:   NO_COLOR ? '' : '\x1b[90m',
  red:    NO_COLOR ? '' : '\x1b[31m',
};
const c   = (color, text) => `${g[color]}${text}${g.reset}`;
const log = (color, text) => console.log(c(color, text));

// ── Helpers ──────────────────────────────────────────────────────────────────
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function listSkills() {
  if (!fs.existsSync(SKILLS_SRC)) {
    log('red', `Erro: skills não encontradas em ${SKILLS_SRC}`);
    log('red', 'O pacote pode estar corrompido. Reinstale com: npm install -g genesis-framework');
    process.exit(1);
  }
  return fs.readdirSync(SKILLS_SRC).filter(
    n => n.startsWith('genesis') && fs.statSync(path.join(SKILLS_SRC, n)).isDirectory()
  );
}

// ── Install content ──────────────────────────────────────────────────────────
const CLAUDE_MD = `# Genesis Framework

> Framework multi-agente instalado neste projeto.

## Como usar

Digite \`/genesis\` para iniciar ou retomar a construção do projeto.

## Comandos disponíveis

| Comando | Função |
|---------|--------|
| \`/genesis\` | Iniciar ou retomar (ponto de entrada principal) |
| \`/genesis-architect\` | Apenas arquitetura e ADRs |
| \`/genesis-sprint\` | Executar próximo sprint |
| \`/genesis-qa\` | Gerar e rodar testes |
| \`/genesis-guard\` | Auditar conformidade antes de merge |
| \`/genesis-reviewer\` | Code review |
| \`/genesis-docs\` | Gerar documentação |

## Regra

Nunca sobrescreva arquivos existentes sem confirmação explícita do usuário.
O Genesis escreve em \`.genesis/\` e nos diretórios de código gerado.
`;

const GITIGNORE_BLOCK = `
# Genesis Framework (runtime — não commitar)
.genesis/memory/
.genesis/state.json
`;

// ── Commands ─────────────────────────────────────────────────────────────────

function cmdInit(targetDir, force) {
  const absTarget = path.resolve(targetDir);

  if (!fs.existsSync(absTarget)) {
    log('red', `\nDiretório não encontrado: ${absTarget}`);
    process.exit(1);
  }

  log('cyan', '\nGenesis Framework — Instalação no Projeto');
  log('cyan', '==========================================');
  console.log(`\nInstalando em: ${c('yellow', absTarget)}\n`);

  // Copy skills → .agents/skills/NOME/SKILL.md
  const skillsDir = path.join(absTarget, '.agents', 'skills');
  log('green', 'Copiando skills...');

  for (const skill of listSkills()) {
    const srcFile  = path.join(SKILLS_SRC, skill, 'SKILL.md');
    const destDir  = path.join(skillsDir, skill);
    const destFile = path.join(destDir, 'SKILL.md');

    if (fs.existsSync(destFile) && !force) {
      log('gray', `  [SKIP] ${skill} — já existe (use --force para sobrescrever)`);
      continue;
    }
    ensureDir(destDir);
    fs.copyFileSync(srcFile, destFile);
    log('green', `  [OK]   ${skill}`);
  }

  // Copy templates if present
  const templatesSrc  = path.join(PKG_ROOT, 'templates');
  const templatesDest = path.join(absTarget, '.genesis', 'templates');
  if (fs.existsSync(templatesSrc) && fs.readdirSync(templatesSrc).length > 0) {
    ensureDir(templatesDest);
    copyDir(templatesSrc, templatesDest);
    log('green', '  [OK]   templates');
  }

  // CLAUDE.md
  const claudeMdPath = path.join(absTarget, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, CLAUDE_MD, 'utf8');
    log('green', '\n  [OK]   CLAUDE.md criado');
  } else {
    log('gray', '\n  [SKIP] CLAUDE.md — já existe');
    log('yellow', '         Dica: adicione "Digite /genesis para usar o Genesis Framework"');
  }

  // .genesis/state.json
  const genesisDir = path.join(absTarget, '.genesis');
  ensureDir(genesisDir);
  const statePath = path.join(genesisDir, 'state.json');
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, '{}', 'utf8');
  }

  // .gitignore
  const giPath = path.join(absTarget, '.gitignore');
  if (fs.existsSync(giPath)) {
    const gi = fs.readFileSync(giPath, 'utf8');
    if (!gi.includes('.genesis/memory')) {
      fs.appendFileSync(giPath, GITIGNORE_BLOCK);
      log('green', '  [OK]   .gitignore atualizado');
    }
  }

  console.log('');
  log('green', '✅ Genesis instalado com sucesso!');
  console.log('');
  log('cyan', 'Próximos passos:');
  console.log('  1. Abra Claude Code neste projeto');
  console.log('  2. Digite: /genesis');
  console.log('  3. O Genesis guia todo o resto');
  console.log('');
}

function cmdGlobal(force) {
  // Global = Claude Code commands at ~/.claude/commands/
  const claudeCommandsDir = path.join(os.homedir(), '.claude', 'commands');
  ensureDir(claudeCommandsDir);

  log('cyan', '\nGenesis Framework — Instalação Global (Claude Code)');
  log('cyan', '====================================================');
  console.log(`\nInstalando em: ${c('yellow', claudeCommandsDir)}\n`);

  log('green', 'Copiando commands globais...');

  for (const skill of listSkills()) {
    const srcFile  = path.join(SKILLS_SRC, skill, 'SKILL.md');
    const destFile = path.join(claudeCommandsDir, `${skill}.md`);

    if (fs.existsSync(destFile) && !force) {
      log('gray', `  [SKIP] /${skill} — já existe`);
      continue;
    }
    fs.copyFileSync(srcFile, destFile);
    log('green', `  [OK]   /${skill}`);
  }

  console.log('');
  log('green', '✅ Genesis instalado globalmente!');
  console.log('');
  log('cyan', 'Disponível em qualquer projeto no Claude Code:');
  console.log('  Abra qualquer projeto → Digite /genesis');
  console.log('');
  log('yellow', 'Nota: para estado persistente por projeto, rode também:');
  console.log('  npx genesis-framework init [diretório]');
  console.log('');
}

function cmdUpdate(targetDir, force) {
  if (isGlobal) {
    cmdGlobal(true);
  } else {
    cmdInit(targetDir, true);
  }
}

function cmdHelp() {
  console.log('');
  log('bold', `Genesis Framework  v${VERSION}`);
  console.log('Framework multi-agente para construir software a partir de uma descrição.');
  console.log('');
  log('cyan', 'Uso:');
  console.log('  npx genesis-framework <comando> [opções]');
  console.log('');
  log('cyan', 'Comandos:');
  console.log('  init [dir]    Instala no projeto (padrão: diretório atual)');
  console.log('  global        Instala globalmente no Claude Code (~/.claude/commands/)');
  console.log('  update        Atualiza skills para a versão atual');
  console.log('  help          Mostra esta ajuda');
  console.log('');
  log('cyan', 'Opções:');
  console.log('  --force, -f   Sobrescreve arquivos existentes');
  console.log('  --global, -g  Instala globalmente (alias para "global")');
  console.log('');
  log('cyan', 'Exemplos:');
  console.log('  npx genesis-framework init');
  console.log('  npx genesis-framework init /caminho/do/projeto');
  console.log('  npx genesis-framework global');
  console.log('  npx genesis-framework init --force');
  console.log('  npx genesis-framework update --global');
  console.log('');
  log('cyan', 'Após instalar:');
  console.log('  Abra Claude Code e digite /genesis');
  console.log('');
  console.log('  Documentação: https://github.com/rafaeldourado9/genesis');
  console.log('');
}

// ── Utility ──────────────────────────────────────────────────────────────────
function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
switch (cmd) {
  case 'init':
  case 'install':
  case 'i': {
    if (isGlobal) {
      cmdGlobal(isForce);
    } else {
      cmdInit(targetArg || '.', isForce);
    }
    break;
  }
  case 'global':
  case 'g':
    cmdGlobal(isForce);
    break;

  case 'update':
  case 'upgrade':
  case 'u':
    cmdUpdate(targetArg || '.', isForce);
    break;

  case 'help':
  case '--help':
  case '-h':
  default:
    cmdHelp();
    break;
}
