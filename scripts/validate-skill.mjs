import { validateSkillPaths } from './validate-skill-lib.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const paths = args.filter((arg) => arg !== '--all');

if (!all && paths.length === 0) {
  console.error('Usage: node scripts/validate-skill.mjs --all | <skill-path> [...skill-path]');
  process.exit(2);
}

const result = await validateSkillPaths(paths, { root: process.cwd(), all });
process.stdout.write(result.text);
process.exit(result.ok ? 0 : 1);
