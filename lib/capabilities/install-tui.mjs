import readline from 'node:readline';

/**
 * Interactive checkbox picker for host selection.
 * Arrow keys move, space toggles, enter confirms, q/ctrl-c aborts.
 *
 * @param {Array<{ id: string, label: string, detected: boolean, fidelity: string }>} hosts
 * @param {{ input?: NodeJS.ReadableStream, output?: NodeJS.WritableStream }} [options]
 * @returns {Promise<string[] | null>} selected host ids, or null if aborted
 */
export async function pickHosts(hosts, options = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;

  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('interactive picker requires a TTY; pass --hosts <ids> --yes');
  }

  const selected = new Set(hosts.filter((host) => host.detected).map((host) => host.id));
  let cursor = 0;
  let done = false;
  let aborted = false;

  function render() {
    output.write('\x1b[?25l'); // hide cursor
    output.write('\x1b[H\x1b[J'); // clear
    output.write('Which agents should SkillsForge configure?\n\n');
    hosts.forEach((host, index) => {
      const pointer = index === cursor ? '>' : ' ';
      const mark = selected.has(host.id) ? '[x]' : '[ ]';
      const note = host.detected ? '' : ' (not detected)';
      const fidelity = host.fidelity === 'full' ? 'full' : 'package';
      const dimStart = host.detected ? '' : '\x1b[2m';
      const dimEnd = host.detected ? '' : '\x1b[0m';
      output.write(`${dimStart}${pointer} ${mark} ${host.label} — ${fidelity}${note}${dimEnd}\n`);
    });
    output.write('\n↑/↓ move · space toggle · enter confirm · q abort\n');
  }

  return await new Promise((resolvePromise) => {
    const rl = readline.createInterface({ input, output, terminal: true });
    readline.emitKeypressEvents(input, rl);
    input.setRawMode(true);

    render();

    function cleanup(result) {
      if (done) return;
      done = true;
      input.setRawMode(false);
      input.removeListener('keypress', onKeypress);
      rl.close();
      output.write('\x1b[?25h'); // show cursor
      resolvePromise(result);
    }

    function onKeypress(_str, key) {
      if (!key) return;
      if (key.ctrl && key.name === 'c') {
        aborted = true;
        cleanup(null);
        return;
      }
      switch (key.name) {
        case 'up':
          cursor = (cursor - 1 + hosts.length) % hosts.length;
          render();
          break;
        case 'down':
          cursor = (cursor + 1) % hosts.length;
          render();
          break;
        case 'space': {
          const id = hosts[cursor].id;
          if (selected.has(id)) selected.delete(id);
          else selected.add(id);
          render();
          break;
        }
        case 'return':
        case 'enter':
          cleanup([...selected]);
          break;
        case 'q':
        case 'escape':
          aborted = true;
          cleanup(null);
          break;
        default:
          break;
      }
      if (aborted) {
        // handled
      }
    }

    input.on('keypress', onKeypress);
  });
}
