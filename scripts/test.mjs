import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverTestFiles } from './test-lib.mjs';

const files = await discoverTestFiles(fileURLToPath(new URL('../tests', import.meta.url)));

if (files.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

const child = spawn(process.execPath, ['--test', ...files], {
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Test runner stopped by ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(`Unable to start test runner: ${error.message}`);
  process.exit(1);
});
