#!/usr/bin/env node
import { resolve } from 'node:path';
import { validateRepository } from './validate-repo-lib.mjs';

const root = process.argv[2] ? resolve(process.argv[2]) : process.cwd();
const result = await validateRepository(root);
process.stdout.write(result.text);
process.exit(result.ok ? 0 : 1);
