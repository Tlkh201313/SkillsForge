import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  const skill = await readFile(join(root, 'skills', 'using-skillsforge', 'SKILL.md'), 'utf8');
  const overview = skill.split('## Overview')[1]?.split('##')[0]?.trim() ?? '';
  process.stdout.write(`SkillsForge active. ${overview}\nCommands: skillsforge doctor|validate|route|forge|receipt|verify-receipt\n`);
} catch {
  process.stdout.write('SkillsForge active. Run skillsforge doctor to check plugin health.\n');
}
process.exit(0);
