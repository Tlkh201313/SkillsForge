import { loadAllSkills } from '../core/skill-loader.mjs';
import { routeQuery } from '../router/index.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const query = process.argv.slice(2).join(' ').trim();

if (!query) {
  console.error('usage: node scripts/route.mjs <query>');
  process.exit(2);
}

const skills = await loadAllSkills(join(root, 'skills'));
process.stdout.write(JSON.stringify(routeQuery(query, skills), null, 2) + '\n');
