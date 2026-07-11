import { validateSkillPaths } from './validate-skill-lib.mjs';

const args = process.argv.slice(2);
const all = consumeFlag(args, '--all');
const json = consumeFlag(args, '--json');
const allowEmpty = consumeFlag(args, '--allow-empty');
const profile = consumeOption(args, '--profile') ?? 'canonical';

if (!['canonical', 'claude-code'].includes(profile)) {
  console.error(`Unknown profile: ${profile}`);
  process.exit(2);
}

if (!all && args.length === 0) {
  console.error('Usage: skillsforge-validate [--profile canonical|claude-code] [--json] (--all | <skill-path> [...skill-path])');
  process.exit(2);
}

const result = await validateSkillPaths(args, {
  root: process.cwd(),
  all,
  allowEmpty,
  profile
});

if (json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  process.stdout.write(result.text);
}
process.exit(result.ok ? 0 : 1);

function consumeFlag(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return false;
  values.splice(index, 1);
  return true;
}

function consumeOption(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`${flag} requires a value`);
    process.exit(2);
  }
  values.splice(index, 2);
  return value;
}
