#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const vault    = require('../lib/vault');
const llm      = require('../lib/llm');
const router   = require('../lib/router');
const cache    = require('../lib/cache');
const coalesce = require('../lib/coalesce');
const tok      = require('../lib/tokens');
const progress = require('../lib/progress');

const PKG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

// ── ANSI ─────────────────────────────────────────────────────────────────────

const A = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  white: '\x1b[97m',
  gray:  '\x1b[90m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow:'\x1b[33m',
};
const c = {
  w:    (s) => `${A.white}${s}${A.reset}`,
  b:    (s) => `${A.bold}${s}${A.reset}`,
  dim:  (s) => `${A.dim}${s}${A.reset}`,
  cyan: (s) => `${A.cyan}${s}${A.reset}`,
  ok:   (s) => `${A.green}${s}${A.reset}`,
  err:  (s) => `${A.red}${s}${A.reset}`,
  warn: (s) => `${A.yellow}${s}${A.reset}`,
};

const S = { tl:'╭', tr:'╮', bl:'╰', br:'╯', h:'─', v:'│', arrow:'›', ok:'✓', fail:'✗', skip:'·', dot:'·' };

const out = (s = '') => process.stdout.write(s);
const ln  = (s = '') => process.stdout.write(s + '\n');

function rule(label = '', w = 52) {
  if (!label) { ln(c.dim('  ' + S.h.repeat(w))); return; }
  const left = S.h.repeat(2);
  const right = S.h.repeat(Math.max(0, w - label.length - 4));
  ln(c.dim(`  ${left} ${label} ${right}`));
}

function box(lines, w = 54) {
  ln(c.dim(`  ${S.tl}${S.h.repeat(w)}${S.tr}`));
  for (const line of lines) {
    const pad = ' '.repeat(Math.max(0, w - line.replace(/\x1b\[[0-9;]*m/g, '').length - 2));
    ln(`  ${c.dim(S.v)}  ${line}${pad}${c.dim(S.v)}`);
  }
  ln(c.dim(`  ${S.bl}${S.h.repeat(w)}${S.br}`));
}

function spinner(label) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  out(c.dim(`  ${label} `));
  const t = setInterval(() => { out(`\r${c.dim(`  ${label} ${frames[i++ % frames.length]}`)}  `); }, 80);
  return () => { clearInterval(t); out('\r' + ' '.repeat(label.length + 6) + '\r'); };
}

function banner() {
  ln();
  box([
    `${c.b(c.w('genesis'))}  ${c.dim('run')}   ${c.dim(`v${PKG.version}`)}`,
    c.dim('multi-LLM · vault seguro · token tracking · routing'),
  ]);
  ln();
  ln(c.dim(`  ${S.arrow} /help  listar comandos   ${S.arrow} /exit  sair`));
  ln();
}

// ── Input ─────────────────────────────────────────────────────────────────────

// All interactive input goes through raw mode to avoid readline/setRawMode conflicts
// on Windows PowerShell. Falls back to a muted readline in non-TTY environments (CI).

process.on('SIGINT', () => { out('\n'); ln(c.dim('  até logo.')); process.exit(0); });

function readRaw(prompt, masked = false) {
  out(prompt);

  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      const { Writable } = require('stream');
      const muted = new Writable({ write: (_c, _e, cb) => cb() });
      const rl = readline.createInterface({ input: process.stdin, output: muted, terminal: false });
      rl.once('line', (line) => { rl.close(); resolve(line); });
      return;
    }

    let buf = '';

    const cleanup = () => {
      process.stdin.removeListener('data', handler);
      try { process.stdin.setRawMode(false); } catch {}
      process.stdin.pause();
    };

    function handler(chunk) {
      for (let i = 0; i < chunk.length; i++) {
        const b = chunk[i];

        if (b === 13 || b === 10) {        // Enter
          cleanup();
          out('\n');
          resolve(buf);
          return;
        }

        if (b === 3) {                     // Ctrl+C
          cleanup();
          out('\n');
          process.exit(0);
          return;
        }

        if (b === 27) {                    // ESC — skip ANSI sequences (arrow keys etc.)
          if (i + 1 < chunk.length && chunk[i + 1] === 91) {
            i += 2;
            while (i < chunk.length && (chunk[i] < 0x40 || chunk[i] > 0x7e)) i++;
          }
          continue;
        }

        if (b === 127 || b === 8) {        // Backspace
          if (buf.length) { buf = buf.slice(0, -1); out('\b \b'); }
          continue;
        }

        if (b >= 32 && b < 127) {          // Printable ASCII
          const ch = String.fromCharCode(b);
          buf += ch;
          out(masked ? c.dim('∗') : ch);
        }
      }
    }

    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', handler);
    } catch {
      const { Writable } = require('stream');
      const muted = new Writable({ write: (_c, _e, cb) => cb() });
      const rl = readline.createInterface({ input: process.stdin, output: muted, terminal: false });
      rl.once('line', (line) => { rl.close(); resolve(line); });
    }
  });
}

function ask(prompt) {
  return readRaw(prompt, false);
}

function readSecret(label) {
  const padded = label.padEnd(22);
  return readRaw(`  ${c.dim(padded)}  ${c.dim(S.arrow)}  `, true);
}

// Parse: /run --tier senior --provider openai "do the thing"
function parseArgs(args) {
  const flags = {};
  const words = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      flags[args[i].slice(2)] = args[i + 1]?.startsWith('--') ? true : (args[++i] ?? true);
    } else {
      words.push(args[i].replace(/^"|"$/g, ''));
    }
  }
  return { task: words.join(' '), flags };
}

// ── Provider helpers ──────────────────────────────────────────────────────────

const KEY_MAP = {
  anthropic: 'ANTHROPIC_API_KEY', claude: 'ANTHROPIC_API_KEY',
  openai:    'OPENAI_API_KEY',
  gemini:    'GEMINI_API_KEY',    google: 'GEMINI_API_KEY',
};

async function apiKey(provider) {
  const envName = KEY_MAP[provider];
  if (!envName) throw new Error(`provider desconhecido: ${provider}`);
  const k = await vault.getOrEnv(envName);
  if (!k) throw new Error(`chave não encontrada: ${envName}. Execute /setup`);
  return k;
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function cmdHelp() {
  ln();
  rule('comandos');
  const cmds = [
    ['/setup',                 'configurar chaves de API e budget'],
    ['/keys list|set|delete',  'gerenciar chaves no vault cifrado'],
    ['/run <tarefa>',          'executar com roteamento automático de tier'],
    ['/parallel <tarefa>',     'rodar em múltiplos LLMs simultaneamente'],
    ['/status',                'tokens usados · cache · tasks pendentes'],
    ['/cache clear|stats',     'gerenciar cache de respostas'],
    ['/budget set <n>|reset',  'budget diário de tokens'],
    ['/exit',                  'sair'],
  ];
  for (const [cmd, desc] of cmds) {
    ln(`  ${c.w(cmd.padEnd(28))} ${c.dim(desc)}`);
  }
  ln();
  ln(c.dim('  tiers disponíveis:  junior · pleno · senior · backend · frontend · qa · architect'));
  ln(c.dim('  providers:          anthropic · openai · gemini'));
  ln(c.dim('  flags:              --tier --provider --model --no-cache --label'));
  ln();
}

async function cmdSetup() {
  ln();
  box([
    c.w('Setup  ·  vault AES-256-GCM + PBKDF2'),
    c.dim('Chaves cifradas localmente. Nunca em texto plano.'),
    c.dim('CI/CD: use $GENESIS_VAULT_PASSPHRASE para evitar prompt.'),
  ]);
  ln();

  // Master password
  rule('senha master do vault');
  const p1 = await readSecret('Senha');
  if (!p1) { ln(c.err(`  ${S.fail} senha não pode ser vazia`)); return; }
  const p2 = await readSecret('Confirme');
  if (p1 !== p2) { ln(c.err(`  ${S.fail} senhas não coincidem`)); return; }

  // Use env var so vault doesn't prompt again during this session
  process.env.GENESIS_VAULT_PASSPHRASE = p1;

  ln();
  rule('API keys  ·  enter para pular');
  ln();

  const providers = [
    { env: 'ANTHROPIC_API_KEY', hint: '(Anthropic / Claude)' },
    { env: 'OPENAI_API_KEY',    hint: '(OpenAI)' },
    { env: 'GEMINI_API_KEY',    hint: '(Google Gemini)' },
  ];

  for (const p of providers) {
    const label = `${p.env}`;
    const val = await readSecret(label);
    if (val) {
      await vault.set(p.env, val);
      ln(`  ${' '.repeat(24)}${c.ok(S.ok)} ${c.dim('salva')}`);
    } else {
      ln(`  ${' '.repeat(24)}${c.dim(S.skip + ' pulada')}`);
    }
  }

  // Custom slots
  for (let i = 4; i <= 5; i++) {
    const input = await ask(`  ${c.dim(`Provider ${i}`.padEnd(24))}  ${c.dim(S.arrow)}  ${c.dim('NOME=valor ou enter  ')}`);
    if (!input || !input.includes('=')) continue;
    const eq = input.indexOf('=');
    const name = input.slice(0, eq).trim();
    const val  = input.slice(eq + 1).trim();
    if (name && val) {
      await vault.set(name, val);
      ln(`  ${' '.repeat(24)}${c.ok(S.ok)} ${c.dim(`${name} salva`)}`);
    }
  }

  ln();
  rule('budget de tokens por dia');
  const raw = await ask(`  ${'Tokens (padrão 500000)'.padEnd(24)}  ${c.dim(S.arrow)}  `);
  const budget = Number(raw) || 500_000;
  tok.setBudget(budget);
  ln(`  ${' '.repeat(24)}${c.ok(S.ok)} ${c.dim(`${budget.toLocaleString()} tokens/dia`)}`);

  ln();
  ln(c.ok(`  ${S.ok}  setup concluído.`));
  ln(c.dim('     Execute /run "sua tarefa" para começar.'));
  ln();

  delete process.env.GENESIS_VAULT_PASSPHRASE;
}

async function cmdKeys(args) {
  const sub = args[0] || 'list';
  ln();

  if (sub === 'list') {
    const keys = vault.list();
    rule(`vault  ·  ${keys.length} chave(s)`);
    if (!keys.length) { ln(c.dim('  nenhuma chave. Execute /setup')); ln(); return; }
    for (const k of keys) ln(`  ${c.dim(S.dot)}  ${c.w(k)}`);
    ln();
    return;
  }

  if (sub === 'set') {
    if (!args[1]) { ln(c.err('  uso: /keys set NOME')); return; }
    const val = await readSecret(args[1]);
    await vault.set(args[1], val);
    ln(`  ${c.ok(S.ok)} ${args[1]} salva`);
    ln();
    return;
  }

  if (sub === 'delete' || sub === 'remove') {
    if (!args[1]) { ln(c.err('  uso: /keys delete NOME')); return; }
    await vault.remove(args[1]);
    ln(`  ${c.ok(S.ok)} ${args[1]} removida`);
    ln();
    return;
  }

  ln(c.err(`  subcomando desconhecido: ${sub}`));
}

async function cmdRun(args) {
  const { task, flags } = parseArgs(args);
  if (!task) {
    ln(c.err('  uso: /run <tarefa> [--tier pleno] [--provider anthropic] [--no-cache]'));
    return;
  }

  const route  = router.route(task, { tier: flags.tier, provider: flags.provider, model: flags.model });
  const system = router.systemPrompt(route.tier);
  const msgs   = [{ role: 'user', content: task }];
  const label  = (flags.label || task).slice(0, 50);

  ln();
  ln(c.dim(`  ${S.arrow}  tier=${route.tier}  ${S.dot}  ${route.provider}/${route.model}`));

  if (!flags['no-cache']) {
    const hit = cache.get(route.provider, route.model, msgs);
    if (hit) {
      ln(c.dim(`  ${S.ok}  cache hit`)); ln();
      ln(hit.content); ln();
      const saved = (hit.tokens?.input || 0) + (hit.tokens?.output || 0);
      ln(c.dim(`  tokens economizados  ${S.arrow}  ~${saved.toLocaleString()}`));
      ln(); return;
    }
  }

  const key  = await apiKey(route.provider);
  const stop = spinner('aguardando resposta');
  let result;
  try {
    result = await llm.call({ provider: route.provider, model: route.model, messages: msgs, system, apiKey: key });
  } finally {
    stop();
  }

  const used = result.tokens.input + result.tokens.output;
  tok.track(route.provider, route.model, result.tokens, label);
  cache.set(route.provider, route.model, msgs, result);
  progress.append({ task: label, status: 'done', agent: route.tier, tokens: used });

  ln();
  ln(result.content);
  ln();
  ln(c.dim(`  in=${result.tokens.input}  out=${result.tokens.output}  cache_read=${result.tokens.cache_read || 0}  total=${used.toLocaleString()}`));
  ln();
}

async function cmdParallel(args) {
  const { task, flags } = parseArgs(args);
  if (!task) {
    ln(c.err('  uso: /parallel <tarefa> --providers anthropic,openai'));
    return;
  }

  const providerList = (flags.providers || 'anthropic').split(',').map((p) => p.trim());
  ln();
  ln(c.dim(`  ${S.arrow}  ${providerList.length} provider(s): ${providerList.join('  ·  ')}`));

  const requests = await Promise.all(providerList.map(async (provider) => {
    const route = router.route(task, { tier: flags.tier, provider });
    return {
      provider: route.provider,
      model: route.model,
      messages: [{ role: 'user', content: task }],
      system: router.systemPrompt(route.tier),
      apiKey: await apiKey(route.provider),
    };
  }));

  const stop = spinner('rodando em paralelo');
  let results;
  try { results = await llm.parallel(requests); }
  finally { stop(); }

  let totalUsed = 0;
  results.forEach((r, i) => {
    const used = (r.tokens.input || 0) + (r.tokens.output || 0);
    totalUsed += used;
    tok.track(r.provider, r.model, r.tokens, task.slice(0, 40));
    ln();
    rule(`${providerList[i]}  ${S.dot}  ${r.model}`);
    ln();
    ln(r.content);
    ln();
    ln(c.dim(`  in=${r.tokens.input}  out=${r.tokens.output}`));
  });

  progress.append({ task: task.slice(0, 50), status: 'done', agent: `parallel(${providerList.join(',')})`, tokens: totalUsed });
  ln();
}

async function cmdStatus() {
  ln();
  rule('tokens');
  const summary = tok.summary();
  for (const line of summary.split('\n')) ln(c.dim(line ? '  ' + line : ''));

  ln();
  rule('cache');
  const cs = cache.stats();
  ln(c.dim(`  ${cs.entries} entradas  ${S.dot}  ${cs.sizeKb} KB`));

  const pending = progress.pendingTasks();
  if (pending.length) {
    ln();
    rule(`tasks pendentes (${pending.length})`);
    for (const t of pending) ln(c.dim(`  ⬜  ${t}`));
  }
  ln();
}

async function cmdCache(args) {
  const sub = args[0] || 'stats';
  ln();
  if (sub === 'clear') {
    const n = cache.clear();
    ln(c.ok(`  ${S.ok}  ${n} entradas removidas`));
  } else {
    const s = cache.stats();
    ln(c.dim(`  ${s.entries} entradas  ${S.dot}  ${s.sizeKb} KB`));
  }
  ln();
}

async function cmdBudget(args) {
  const sub = args[0];
  ln();
  if (sub === 'set') {
    const n = Number(args[1]);
    if (!n) { ln(c.err('  uso: /budget set <número>')); return; }
    tok.setBudget(n);
    ln(c.ok(`  ${S.ok}  budget: ${n.toLocaleString()} tokens/dia`));
  } else if (sub === 'reset') {
    tok.reset();
    ln(c.ok(`  ${S.ok}  sessão reiniciada`));
  } else {
    for (const line of tok.summary().split('\n')) ln(c.dim(line ? '  ' + line : ''));
  }
  ln();
}

// ── REPL ─────────────────────────────────────────────────────────────────────

const COMMANDS = {
  '/setup':    cmdSetup,
  '/keys':     cmdKeys,
  '/run':      cmdRun,
  '/parallel': cmdParallel,
  '/status':   cmdStatus,
  '/cache':    cmdCache,
  '/budget':   cmdBudget,
  '/help':     cmdHelp,
  '/exit':     () => { ln(c.dim('  até logo.')); process.exit(0); },
  '/quit':     () => { ln(c.dim('  até logo.')); process.exit(0); },
};

async function repl() {
  coalesce.init(llm.call);
  banner();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const input = await ask(`${c.cyan(S.arrow)} `);
    if (!input) continue;

    // Tokenize respecting quoted strings
    const parts = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const rawCmd = parts[0] || '';
    const cmd = rawCmd.startsWith('/') ? rawCmd.toLowerCase() : `/${rawCmd.toLowerCase()}`;
    const args = parts.slice(1).map((a) => a.replace(/^["']|["']$/g, ''));

    const handler = COMMANDS[cmd];
    if (handler) {
      try { await handler(args); }
      catch (e) { ln(c.err(`\n  ${S.fail}  ${e.message}`)); ln(); }
    } else {
      ln(c.dim(`  ${S.fail}  comando desconhecido: ${rawCmd}  ${S.dot}  /help para ver comandos`));
    }
  }
}

// ── Entry — REPL (sem args) ou one-shot (com args) ───────────────────────────

const argv = process.argv.slice(2);

if (argv.length === 0) {
  repl().catch((e) => { ln(c.err(e.message)); process.exit(1); });
} else {
  // Legacy one-shot: genesis-run run "task"
  (async () => {
    coalesce.init(llm.call);
    const [rawCmd, ...args] = argv;
    const cmd = rawCmd.startsWith('/') ? rawCmd.toLowerCase() : `/${rawCmd.toLowerCase()}`;
    const handler = COMMANDS[cmd];
    if (!handler) { ln(c.err(`  ${S.fail}  comando desconhecido: ${rawCmd}`)); process.exitCode = 1; return; }
    try { await handler(args); }
    catch (e) { ln(c.err(`  ${S.fail}  ${e.message}`)); process.exitCode = 1; }
  })();
}

module.exports = { repl };
