import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configuredApiBaseUrl = process.env.API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  throw new Error('Set API_BASE_URL to the deployed API origin ending in /api/v1.');
}

let apiUrl;
try {
  apiUrl = new URL(configuredApiBaseUrl);
} catch {
  throw new Error('API_BASE_URL must be a valid HTTPS URL ending in /api/v1.');
}

const apiPath = apiUrl.pathname.replace(/\/+$/, '');
if (
  apiUrl.protocol !== 'https:' ||
  apiPath !== '/api/v1' ||
  apiUrl.username ||
  apiUrl.password ||
  apiUrl.search ||
  apiUrl.hash
) {
  throw new Error('API_BASE_URL must be a valid HTTPS URL ending in /api/v1.');
}

const apiBaseUrl = `${apiUrl.origin}${apiPath}`;
const outputPath = resolve('dist/test-auth/browser/runtime-config.js');
const runtimeConfig = `window.__APP_CONFIG__ = Object.freeze(${JSON.stringify({ apiBaseUrl })});\n`;

await writeFile(outputPath, runtimeConfig, 'utf8');
