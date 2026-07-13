import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function fieldStatus(field, status, note) {
  return { field, status, note };
}

export async function emitCursor(skills, outDir) {
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  await mkdir(outDir, { recursive: true });
  const lossiness = [];
  const emitted = [];

  for (const skill of skills) {
    const requiresNote = skill.requires.length > 0
      ? `\n\n## Requires\n${skill.requires.map((name) => `- ${name}`).join('\n')}`
      : '';
    const maturityNote = `\n\n## Maturity\n${skill.maturity}`;
    const content = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n${skill.body.trim()}${requiresNote}${maturityNote}\n`;
    const path = join(outDir, skill.name, 'SKILL.md');
    await mkdir(join(outDir, skill.name), { recursive: true });
    await writeFile(path, content);
    emitted.push(`${skill.name}/SKILL.md`);

    lossiness.push({
      name: skill.name,
      fields: [
        fieldStatus('name', 'mapped', 'frontmatter name'),
        fieldStatus('description', 'mapped', 'frontmatter description'),
        fieldStatus('body', 'mapped', 'markdown body'),
        fieldStatus('maturity', 'transformed', 'folded into ## Maturity section'),
        fieldStatus('platform', 'unsupported', 'no Cursor-native platform field'),
        fieldStatus('requires', skill.requires.length ? 'transformed' : 'mapped', skill.requires.length ? 'folded into ## Requires section' : 'empty'),
        fieldStatus('routing.triggers', 'unsupported', 'no Cursor-native trigger list'),
        fieldStatus('routing.antiTriggers', 'unsupported', 'no Cursor-native anti-trigger list'),
        fieldStatus('capabilities', 'unsupported', 'no Cursor-native capability declaration')
      ]
    });
  }

  return { emitted: emitted.sort(), lossiness };
}
