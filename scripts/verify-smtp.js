import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

const env = { ...process.env, ...parseEnvFile(envPath) };
const requiredKeys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const optionalKeys = ['SMTP_PORT', 'SMTP_SECURE', 'EMAIL_FROM', 'SUPPORT_EMAIL'];

console.log('SMTP verification check');
console.log('Environment file:', fs.existsSync(envPath) ? envPath : 'not found');

for (const key of requiredKeys) {
  const value = env[key];
  console.log(`${key}: ${value ? 'configured' : 'missing'}`);
}

for (const key of optionalKeys) {
  const value = env[key];
  console.log(`${key}: ${value ? 'configured' : 'not set'}`);
}

const missingRequired = requiredKeys.filter((key) => !String(env[key] || '').trim());
if (missingRequired.length > 0) {
  console.error(`Missing required SMTP values: ${missingRequired.join(', ')}`);
  console.error('Add them to your server environment or .env file before restarting the backend.');
  process.exit(1);
}

const port = Number(env.SMTP_PORT || 587);
const secure = String(env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

try {
  await transporter.verify();
  console.log('SMTP verification successful: the credentials and host are accepted.');
  process.exit(0);
} catch (error) {
  console.error('SMTP verification failed.');
  console.error(error.message);
  if (error.response) {
    console.error(error.response);
  }
  process.exit(1);
}
