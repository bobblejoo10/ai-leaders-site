#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

async function text(path) {
  return (await readFile(resolve(projectRoot, path), 'utf8')).replace(/\r\n/g, '\n');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function parseCspDirectives(line) {
  const directives = new Map();
  const policy = line.replace(/^\s*Content-Security-Policy:\s*/i, '');
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    directives.set(tokens[0], new Set(tokens.slice(1)));
  }
  return directives;
}

function hasCspSource(directives, directive, source) {
  return directives.get(directive)?.has(source) === true;
}

function cspSourceAllowsUrl(sources, value) {
  let url;
  try { url = new URL(value); } catch (error) { return false; }
  for (const source of sources || []) {
    if (source === "'self'" || source === 'data:' || source === 'blob:') continue;
    if (source.startsWith('https://*.')) {
      const wildcardHost = source.slice('https://*.'.length);
      if (url.protocol === 'https:' && url.hostname.endsWith(`.${wildcardHost}`)) return true;
      continue;
    }
    if (source.startsWith('http://*.')) {
      const wildcardHost = source.slice('http://*.'.length);
      if (url.protocol === 'http:' && url.hostname.endsWith(`.${wildcardHost}`)) return true;
      continue;
    }
    try {
      if (new URL(source).origin === url.origin) return true;
    } catch (error) {}
  }
  return false;
}

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function externalResources(html) {
  const resources = [];
  const tags = /<(script|link|img|iframe|source)\b[^>]*>/gi;
  for (const match of html.matchAll(tags)) {
    const tagName = match[1].toLowerCase();
    const tag = match[0];
    const urlMatch = tag.match(/\b(?:src|href)=["'](https:\/\/[^"']+)["']/i);
    if (!urlMatch) continue;
    if (tagName === 'link' && !/\brel=["'][^"']*stylesheet/i.test(tag)) continue;
    const directive = {
      script: 'script-src',
      link: 'style-src',
      img: 'img-src',
      iframe: 'frame-src',
      source: 'media-src'
    }[tagName];
    resources.push({ directive, url: urlMatch[1] });
  }
  return resources;
}

// 관리자 페이지 검사는 kedp-admin-console 저장소로 옮겼습니다.
// 여기에는 홈페이지가 관리자 흔적을 남기지 않는지만 확인합니다.

const siteLayout = await text('src/assets/site-layout.js');
expect(!siteLayout.includes('ADMIN_ACCESS_PASSWORD'), 'site-layout.js still contains a shared admin password');
expect(!siteLayout.includes('adminAccessPassword'), 'site-layout.js still contains the retired shared-password dialog');
expect(!siteLayout.includes('/admin-login/?next=%2Fadmin-dashboard%2F'), 'site-layout.js still flashes the login page for an active admin session');
expect(!siteLayout.includes('admin-dashboard'), 'site-layout.js still exposes the admin console address');
expect(!siteLayout.includes('data-admin-access'), 'site-layout.js still renders the retired admin link');

const commonStore = await text('src/assets/supabase-store-common.js');
expect(commonStore.includes("Prefer: SENSITIVE_INSERT_TABLES[table] ? 'return=minimal'"), 'sensitive public inserts may return private records');
expect(commonStore.includes('activeSession.access_token'), 'authenticated requests do not use the staff access token');

const formStore = await text('src/assets/form-submissions-store.js');
expect(formStore.includes('10 * 1024 * 1024'), 'portfolio upload limit is not 10 MiB');
expect(formStore.includes("createSignedUrl(fileId, 'instructor-portfolio', 300)"), 'private portfolio download does not use a short-lived signed URL');
expect(!formStore.includes('api.buildPublicUrl(fileId)'), 'private portfolio file still builds a public URL');

const migration = await text('supabase/20260719_secure_staff_access.sql');
expect(migration.includes("'instructor-portfolio',\n  'instructor-portfolio',\n  false"), 'portfolio bucket is not private');
expect(migration.includes('lecture_applications_select_staff'), 'lecture applications are missing staff-only read policy');
expect(!migration.includes('lecture_applications_select_public'), 'lecture applications still declare a public read policy');
expect(migration.includes('private.has_staff_role'), 'role checks are missing from the security migration');
expect(migration.includes('content_audit_log'), 'content audit log is missing from the security migration');
expect(migration.includes('lecture_applications_insert_public'), 'public lecture applications cannot be submitted');
expect(!migration.includes('grant select, insert, update, delete on table public.lecture_applications to anon'), 'anonymous users retain broad application-table privileges');
expect(migration.includes('portfolio_file_public_url is null'), 'anonymous submissions can persist a public portfolio URL');
expect(migration.trim().startsWith('-- Secure staff access') && migration.trim().endsWith('commit;'), 'security migration is not wrapped in its expected transaction');

const headers = await text('src/static/_headers');
expect(headers.includes('Content-Security-Policy:'), 'Cloudflare security headers are missing CSP');
expect(headers.includes('X-Frame-Options: DENY'), 'Cloudflare headers do not prevent framing');
const cspLine = headers.split(/\r?\n/).find((line) => line.includes('Content-Security-Policy:')) || '';
expect(cspLine.length < 2000, 'Cloudflare CSP header exceeds the per-header rule limit');
const cspDirectives = parseCspDirectives(cspLine);
expect(hasCspSource(cspDirectives, 'frame-src', 'https://www.googletagmanager.com'), 'GTM noscript iframe is not covered by frame-src');
expect(hasCspSource(cspDirectives, 'script-src', 'https://connect.facebook.net'), 'Meta Pixel library is not covered by script-src');
expect(hasCspSource(cspDirectives, 'connect-src', 'https://connect.facebook.net'), 'Meta Pixel network endpoint is not covered by connect-src');
expect(hasCspSource(cspDirectives, 'img-src', 'https://www.facebook.com'), 'Meta Pixel image endpoint is not covered by img-src');
expect(hasCspSource(cspDirectives, 'connect-src', 'https://www.google.co.kr'), 'Google regional conversion endpoint is not covered by connect-src');
expect(!Array.from(cspDirectives.values()).some((sources) => sources.has('*') || sources.has('https:') || sources.has('http:')), 'CSP contains an unrestricted network source');
expect(!Array.from(cspDirectives.values()).some((sources) => sources.has("'unsafe-eval'")), 'CSP enables unsafe-eval');

const htmlFiles = await collectHtmlFiles(resolve(projectRoot, 'src/pages'));
for (const file of htmlFiles) {
  const page = await readFile(file, 'utf8');
  for (const resource of externalResources(page)) {
    expect(cspSourceAllowsUrl(cspDirectives.get(resource.directive), resource.url), `${relative(projectRoot, file)}: ${resource.directive} does not allow ${resource.url}`);
  }
}

const layout = await text('src/assets/site-layout.js');
expect(layout.includes('aiLeadersAttributionContext'), 'first-party attribution context storage is missing');
expect(layout.includes('aiLeadersLastApplication'), 'completion payload storage helper is missing');
expect(layout.includes('buildCompletionUrl'), 'completion URL fallback builder is missing');

const detailPage = await text('src/pages/courses/detail.html');
expect(detailPage.includes('saveCompletionPayload'), 'course application does not save a storage fallback payload');
expect(detailPage.includes('buildCompletionUrl'), 'course application does not pass a guarded completion fallback URL');

const completionPage = await text('src/pages/forms/application-complete.html');
expect(completionPage.includes('validApplicationId'), 'completion page does not validate conversion identifiers');
expect(completionPage.includes('transaction_id: applicationId'), 'Google conversion event is missing a stable transaction id');
expect(completionPage.includes('{ eventID: applicationId }'), 'Meta Purchase event is missing a stable event id');
expect(completionPage.includes('!sessionState.available || !localState.available'), 'completion URL fallback is not restricted to storage failures');

if (failures.length) {
  for (const failure of failures) console.error(`[security-check] ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`[security-check] PASS (public site boundaries)`);
}
