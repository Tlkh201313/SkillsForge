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
