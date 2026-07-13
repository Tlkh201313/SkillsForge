/**
 * Portable Agent Skills export: name + description frontmatter + body.
 * Strips Claude-only fields, sidecars, hooks, routing, and capabilities.
 *
 * @param {{ name: string, description: string, body: string, requires?: string[] }} skill
 * @returns {{ files: Array<{ path: string, contents: string }> }}
 */
export function exportPortableSkill(skill) {
  const requires = Array.isArray(skill.requires) ? skill.requires : [];
  const requiresNote = requires.length
    ? `\n\n## Requires\n${requires.map((name) => `- ${name}`).join('\n')}`
    : '';
  const contents = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n${String(skill.body ?? '').trim()}${requiresNote}\n`;
  return {
    files: [{ path: 'SKILL.md', contents }]
  };
}
