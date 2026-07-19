import { resetSettings, setSetting, validateSettingsFile, writeSettings, loadSettings } from '../../../lib/capabilities/settings.mjs';
import {
  consumeFlag, consumeOption, hasUnknownOption, resolveRuntimeRoot, usage
} from '../shared.mjs';

export function settingsHelp() {
  return `usage: skillsforge settings <show|set|reset|validate> [options]

Settings:
  show                         Print resolved config defaults + overrides
  validate                     Validate skillsforge.config.json
  set <key> <value>            Set recommendThreshold/defaultHost/library.* safely
  reset                        Write default config, or delete with --delete

Options:
  --json                       Print JSON
  --config <file>              Config path, default skillsforge.config.json
  --delete                     With reset, remove config instead of writing defaults

Known keys:
  recommendThreshold
  defaultHost
  library.theme
  library.outDir
  library.cacheHostChecks
  mutations.allowByDefault
`;
}

export async function runSettingsCommand(argv, options) {
  const args = [...argv];
  const subcommand = args.shift();
  const json = consumeFlag(args, '--json');
  const config = consumeOption(args, '--config');
  const deleteConfig = consumeFlag(args, '--delete');
  if (config === null) return usage('--config requires a value');
  if (!subcommand || subcommand === 'help' || subcommand === '--help') {
    process.stdout.write(settingsHelp());
    return 0;
  }
  const root = await resolveRuntimeRoot(options);
  let result;
  try {
    if (subcommand === 'show') {
      result = await loadSettings(root, { config });
    } else if (subcommand === 'validate') {
      result = await validateSettingsFile(root, { config });
    } else if (subcommand === 'reset') {
      result = await resetSettings(root, { config, delete: deleteConfig });
    } else if (subcommand === 'set') {
      const key = args.shift();
      const value = args.shift();
      if (!key || value == null) return usage('usage: skillsforge settings set <key> <value>');
      result = await setSetting(root, key, value, { config });
    } else {
      return usage(`unknown settings command: ${subcommand}`);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  if (hasUnknownOption(args)) return usage(`unknown settings option: ${hasUnknownOption(args)}`);
  const payload = { ...result, ok: result.ok };
  if (json || subcommand !== 'show') {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  }
  return result.ok ? 0 : 1;
}

export async function initSettings(root, options = {}) {
  return writeSettings(root, {}, options);
}
