const SHELL_CONTROL_SYNTAX = /[;&|`\n\r<>]|\$\(/;

export function hasShellControlSyntax(command) {
  return SHELL_CONTROL_SYNTAX.test(String(command ?? ''));
}

function tokenizeCommand(command) {
  const tokens = [];
  const source = String(command ?? '').trim();
  let current = '';
  let quote = null;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (ch === '\\' && quote === '"' && i + 1 < source.length) {
        current += source[i + 1];
        i += 1;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }
  if (quote) return null;
  if (current) tokens.push(current);
  return tokens;
}

function argHasMetacharacters(arg) {
  return /[;&|`$<>\\]/.test(String(arg ?? '')) || /\$\(/.test(String(arg ?? ''));
}

export function commandAllowed(command, declaredCommands = []) {
  const normalized = command.trim();
  if (!normalized || hasShellControlSyntax(normalized)) return false;
  const cmdTokens = tokenizeCommand(normalized);
  if (!cmdTokens) return false;

  return declaredCommands.some((declared) => {
    const allowed = String(declared).trim();
    if (!allowed || hasShellControlSyntax(allowed)) return false;
    if (normalized === allowed) return true;

    const allowedTokens = tokenizeCommand(allowed);
    if (!allowedTokens || allowedTokens.length === 0) return false;
    if (cmdTokens.length < allowedTokens.length) return false;
    for (let i = 0; i < allowedTokens.length; i += 1) {
      if (cmdTokens[i] !== allowedTokens[i]) return false;
    }
    const remaining = cmdTokens.slice(allowedTokens.length);
    return remaining.every((token) => !argHasMetacharacters(token));
  });
}

export function commandExactlyAllowed(command, declaredCommands = []) {
  const normalized = String(command ?? '').trim();
  if (!normalized || hasShellControlSyntax(normalized)) return false;
  return declaredCommands.some((declared) => normalized === String(declared).trim());
}

const SHELL_NETWORK_CLIENTS = /\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|bitsadmin|certutil|fetch)\b/i;

export function shellImpliesNetwork(command) {
  if (SHELL_NETWORK_CLIENTS.test(command)) return true;
  if (/\bpython(?:3)?\b/i.test(command) && /\s-c\b/.test(command)
    && /\b(urllib|requests|http\.client|httpx|urlopen)\b/i.test(command)) {
    return true;
  }
  if (/\bnode\b/i.test(command) && /\s-e\b/.test(command)
    && /\b(fetch|https?:\/\/|https?\.|axios|got)\b/i.test(command)) {
    return true;
  }
  return false;
}

const SHELL_WRITE_COMMANDS = new Set([
  'add-content',
  'copy',
  'copy-item',
  'cp',
  'del',
  'git',
  'install',
  'mkdir',
  'move',
  'move-item',
  'mv',
  'new-item',
  'npm',
  'out-file',
  'pnpm',
  'remove-item',
  'rm',
  'rmdir',
  'set-content',
  'tee',
  'touch',
  'yarn'
]);

const SHELL_WRITE_FLAGS = new Set([
  '-o',
  '--dest',
  '--destination',
  '--force',
  '--home',
  '--out',
  '--output',
  '--save',
  '--save-dev',
  '--write'
]);

const INLINE_WRITE_PATTERNS = [
  /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream|rename|renameSync|rm|rmSync|unlink|unlinkSync|mkdir|mkdirSync|cp|cpSync)\s*\(/i,
  /\b(?:Set-Content|Add-Content|Out-File|New-Item|Copy-Item|Move-Item|Remove-Item)\b/i,
  /\bopen\s*\([^)]*,\s*['"](?:w|a|x|w\+|a\+)/i,
  /\bPath\s*\([^)]*\)\.(?:write_text|write_bytes|unlink|rename|mkdir)\s*\(/i,
  /\b(?:shutil\.(?:copy|copyfile|move|rmtree)|os\.(?:remove|unlink|rename|mkdir|makedirs|rmdir))\s*\(/i
];

export function shellImpliesWrite(command) {
  const text = String(command ?? '');
  const tokens = tokenizeCommand(text);
  if (!tokens || tokens.length === 0) return true;
  const commandName = tokens[0].split(/[\\/]/).pop().toLowerCase();
  if (SHELL_WRITE_COMMANDS.has(commandName)) {
    if (commandName === 'git') {
      return /^(add|am|apply|checkout|clean|commit|merge|mv|pull|push|rebase|reset|restore|rm|stash|switch)\b/i.test(tokens[1] ?? '');
    }
    if (['npm', 'pnpm', 'yarn'].includes(commandName)) {
      return /^(add|ci|install|link|pack|publish|remove|run|uninstall)\b/i.test(tokens[1] ?? '');
    }
    return true;
  }
  if (tokens.some((token) => SHELL_WRITE_FLAGS.has(token.toLowerCase()))) return true;
  if (INLINE_WRITE_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return false;
}

export function hostFromUrl(value) {
  try {
    return new URL(String(value)).host.toLowerCase();
  } catch {
    return null;
  }
}

export function hostAllowed(host, declaredHosts = []) {
  const normalized = host.toLowerCase();
  return declaredHosts.some((declared) => {
    const allowed = String(declared).toLowerCase();
    return normalized === allowed
      || (allowed.startsWith('*.') && normalized.endsWith(allowed.slice(1)));
  });
}
