import { resolve } from 'node:path';
import { detectHosts, installSkills, resolveHostSelection } from '../../../lib/capabilities/install.mjs';
import { pickHosts } from '../../../lib/capabilities/install-tui.mjs';
import { buildCustomHost, HOST_REGISTRY } from '../../../lib/capabilities/hosts.mjs';
import {
  consumeFlag, consumeOption, consumeOptions, resolveRuntimeRoot
} from '../shared.mjs';

export async function runHostsCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const homeOption = consumeOption(args, '--home');
  if (homeOption === null) {
    process.stderr.write('--home requires a value\n');
    return 2;
  }
  if (args.some((item) => item.startsWith('--'))) {
    process.stderr.write(`unknown hosts option: ${args.find((item) => item.startsWith('--'))}\n`);
    return 2;
  }
  if (args.length) {
    process.stderr.write(`unknown hosts argument: ${args[0]}\n`);
    return 2;
  }

  const home = homeOption ? resolve(homeOption) : options.home;
  const hosts = await detectHosts({ home });
  const registry = HOST_REGISTRY.map((host) => ({
    id: host.id,
    label: host.label,
    fidelity: host.fidelity,
    runtimeEnforced: host.runtimeEnforced,
    usesSidecar: host.usesSidecar,
    installHint: host.installHint
  }));
  const examples = [
    'skillsforge install --hosts codex,claude-code --yes --dry-run',
    'skillsforge install --hosts all --yes --dry-run',
    'skillsforge install --custom-host my-agent:.my-agent/skills --yes --dry-run'
  ];
  const payload = { ok: true, registry, hosts, examples };

  if (json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return 0;
  }

  process.stdout.write('Universal AI CLI hosts\n');
  for (const host of hosts) {
    const mark = host.detected ? 'detected' : 'missing';
    const policy = host.runtimeEnforced ? 'runtime-policy' : 'package-only';
    process.stdout.write(`${host.id}\t${mark}\t${host.fidelity}\t${policy}\t${host.skillsDir}\n`);
    process.stdout.write(`  ${host.installHint}\n`);
  }
  process.stdout.write('Examples:\n');
  for (const example of examples) process.stdout.write(`  ${example}\n`);
  return 0;
}

export async function runInstall(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const list = consumeFlag(args, '--list');
  const yes = consumeFlag(args, '--yes');
  const dryRun = consumeFlag(args, '--dry-run');
  const force = consumeFlag(args, '--force');
  const customSpecs = consumeOptions(args, '--custom-host');
  if (customSpecs === null) {
    process.stderr.write('--custom-host requires <id>:<skills-dir>\n');
    return 2;
  }
  const hostsOption = consumeOption(args, '--hosts');
  if (hostsOption === null) {
    process.stderr.write('--hosts requires a value\n');
    return 2;
  }
  const homeOption = consumeOption(args, '--home');
  if (homeOption === null) {
    process.stderr.write('--home requires a value\n');
    return 2;
  }
  const home = homeOption ? resolve(homeOption) : options.home;
  const skillPaths = args.filter((item) => !item.startsWith('--'));
  const root = await resolveRuntimeRoot(options, { explicitPaths: skillPaths.length > 0 });

  const detected = await detectHosts({ home });
  if (list) {
    const payload = {
      ok: true,
      registry: HOST_REGISTRY.map((host) => ({
        id: host.id,
        label: host.label,
        fidelity: host.fidelity,
        runtimeEnforced: host.runtimeEnforced,
        usesSidecar: host.usesSidecar,
        installHint: host.installHint
      })),
      hosts: detected
    };
    if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    else {
      for (const host of detected) {
        const mark = host.detected ? 'detected' : 'missing';
        process.stdout.write(`${host.id}\t${mark}\t${host.fidelity}\t${host.skillsDir}\n`);
      }
    }
    return 0;
  }

  let hostIds = hostsOption
    ? hostsOption.split(',').map((item) => item.trim()).filter(Boolean)
    : null;

  if (hostIds?.length === 1 && hostIds[0] === 'all') {
    hostIds = HOST_REGISTRY.map((host) => host.id);
  } else if (hostIds?.length === 1 && hostIds[0] === 'detected') {
    hostIds = detected.filter((host) => host.detected).map((host) => host.id);
  } else if (hostIds?.includes('all') || hostIds?.includes('detected')) {
    process.stderr.write('--hosts all|detected cannot be combined with other ids\n');
    return 2;
  }

  let customHosts;
  try {
    customHosts = customSpecs.map((spec) => buildCustomHost(spec, { home }));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }

  if (!hostIds) {
    if (customHosts.length) {
      hostIds = [];
    } else if (yes) {
      process.stderr.write('install --yes requires --hosts <ids> or --custom-host <id>:<skills-dir>\n');
      return 2;
    } else {
      const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
      if (!interactive) {
        process.stderr.write('usage: skillsforge install --hosts <ids> --yes [skill-paths...]\n');
        process.stderr.write('       (interactive picker requires a TTY; use --list to see hosts)\n');
        return 2;
      }
      try {
        const picked = await pickHosts(detected);
        if (picked == null) {
          process.stderr.write('install aborted\n');
          return 1;
        }
        hostIds = picked;
      } catch (error) {
        process.stderr.write(`${error.message}\n`);
        return 2;
      }
    }
  }

  if (!hostIds.length && !customHosts.length) {
    process.stderr.write('no hosts selected\n');
    return 1;
  }

  const selection = hostIds.length
    ? await resolveHostSelection(hostIds, { home })
    : { selected: [], unknown: [], all: detected };
  if (selection.unknown.length) {
    process.stderr.write(`unknown hosts: ${selection.unknown.join(', ')}\n`);
    process.stderr.write(`known: ${HOST_REGISTRY.map((host) => host.id).join(', ')} or --custom-host <id>:<skills-dir>\n`);
    return 2;
  }
  const selectedHosts = [...selection.selected, ...customHosts];

  const result = await installSkills({
    hosts: selectedHosts,
    home,
    root,
    skillPaths: skillPaths.length ? skillPaths : undefined,
    dryRun,
    force
  });

  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    if (!result.ok) {
      process.stdout.write(`FAIL install: ${result.error ?? 'unknown'}\n`);
      if (result.validation?.text) process.stdout.write(result.validation.text);
    } else {
      for (const item of result.installs) {
        process.stdout.write(`${item.status.toUpperCase()} ${item.host}/${item.skill} -> ${item.dir}\n`);
      }
      process.stdout.write(`OK install (${result.dryRun ? 'dry-run' : 'wrote'} ${result.installs.length} target(s))\n`);
    }
  }
  return result.ok ? 0 : 1;
}
