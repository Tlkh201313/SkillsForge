export function analyzeDependencies(skills) {
  const byName = new Map();
  const duplicates = [];
  for (const skill of skills) {
    if (byName.has(skill.name)) duplicates.push(skill.name);
    else byName.set(skill.name, skill);
  }

  const missing = [];
  for (const skill of byName.values()) {
    for (const dep of skill.requires ?? []) {
      if (!byName.has(dep)) missing.push({ skill: skill.name, requires: dep });
    }
  }

  const cycles = [];
  const order = [];
  const state = new Map();

  const visit = (name, path) => {
    if (state.get(name) === 'done') return;
    if (state.get(name) === 'active') {
      cycles.push([...path.slice(path.indexOf(name)), name]);
      return;
    }
    state.set(name, 'active');
    for (const dep of byName.get(name)?.requires ?? []) {
      if (byName.has(dep)) visit(dep, [...path, name]);
    }
    state.set(name, 'done');
    order.push(name);
  };

  for (const name of byName.keys()) visit(name, []);

  return {
    cycles,
    missing,
    duplicates,
    order: cycles.length === 0 ? order : []
  };
}
