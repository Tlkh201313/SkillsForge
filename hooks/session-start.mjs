import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  const skill = await readFile(join(root, 'skills', 'using-skillsforge', 'SKILL.md'), 'utf8');
  const overview = skill.split('## Overview')[1]?.split('##')[0]?.trim() ?? '';
  process.stdout.write(`SkillsForge active. ${overview}\nCommands: /skillsforge:route, /skillsforge:forge, /skillsforge:doctor\n`);
} catch {
  process.stdout.write('SkillsForge active. Run npm run validate in the plugin root to check skill health.\n');
}
process.exit(0);
