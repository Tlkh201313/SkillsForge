import Ajv2020 from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = new Map();
const registeredSchemaIds = new Set();

export async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function registerSchemas(schemaSources) {
  const schemas = await Promise.all(schemaSources.map((source) => typeof source === 'string' ? loadJson(source) : source));
  for (const schema of schemas) {
    if (!schema.$id) throw new Error('Registered schemas must define $id');
    if (registeredSchemaIds.has(schema.$id)) continue;
    ajv.addSchema(schema);
    registeredSchemaIds.add(schema.$id);
  }
}

export async function validateWithSchema(schemaPath, value) {
  const schema = typeof schemaPath === 'string' ? await loadJson(schemaPath) : schemaPath;
  const cacheKey = schema.$id ?? schema;
  let validate = validators.get(cacheKey);
  if (!validate) {
    if (schema.$id) {
      await registerSchemas([schema]);
      validate = ajv.getSchema(schema.$id);
      if (!validate) throw new Error(`Registered schema could not be compiled: ${schema.$id}`);
    } else {
      validate = ajv.compile(schema);
    }
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
  if (error.keyword === 'unevaluatedProperties') {
    return `${location} contains unsupported field ${error.params.unevaluatedProperty}`;
  }
  if (error.keyword === 'const') {
    return `${location} must equal ${JSON.stringify(error.params.allowedValue)}`;
  }
  return `${location} ${error.message}`;
}
