import Ajv2020 from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = new Map();

export async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function validateWithSchema(schemaPath, value) {
  let validate = validators.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(await loadJson(schemaPath));
    validators.set(schemaPath, validate);
  }

  const valid = validate(value);
  return {
    valid,
    errors: valid ? [] : validate.errors.map(formatAjvError)
  };
}

export function formatAjvError(error) {
  const location = error.instancePath || '/';
  if (error.keyword === 'required') {
    return `${location} must contain ${error.params.missingProperty}`;
  }
  if (error.keyword === 'additionalProperties') {
    return `${location} contains unsupported field ${error.params.additionalProperty}`;
  }
  return `${location} ${error.message}`;
}
