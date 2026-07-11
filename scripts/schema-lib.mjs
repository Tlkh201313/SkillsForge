import Ajv2020 from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = new Map();

export async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function validateWithSchema(schemaPath, value) {
  const cacheKey = typeof schemaPath === 'string' ? schemaPath : schemaPath.$id ?? schemaPath;
  let validate = validators.get(cacheKey);
  if (!validate) {
    const schema = typeof schemaPath === 'string' ? await loadJson(schemaPath) : schemaPath;
    validate = ajv.compile(schema);
    validators.set(cacheKey, validate);
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
