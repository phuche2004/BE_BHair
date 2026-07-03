#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { setTimeout: sleep } = require('timers/promises');

const DEFAULT_BASE_URL = 'https://api.bhair.site';
const cli = parseArgs(process.argv.slice(2));

const config = {
  baseUrl: opt('base-url', env('BASE_URL', DEFAULT_BASE_URL)).replace(/\/+$/, ''),
  scenario: opt('scenario', env('SCENARIO', 'realistic')),
  durationSeconds: intOpt('duration', intEnv('DURATION_SECONDS', 120)),
  rampSeconds: intOpt('ramp', intEnv('RAMP_SECONDS', 30)),
  concurrency: intOpt('concurrency', intEnv('CONCURRENCY', 100)),
  maxRps: intOpt('max-rps', intEnv('MAX_RPS', 0)),
  timeoutMs: intOpt('timeout', intEnv('TIMEOUT_MS', 15000)),
  warmupSeconds: intOpt('warmup', intEnv('WARMUP_SECONDS', 10)),
  outputDir: opt('output-dir', env('OUTPUT_DIR', path.join(process.cwd(), 'stress-results'))),
  allowWrites: boolOpt('allow-writes', boolEnv('ALLOW_WRITES', false)),
  loginPhone: opt('login-phone', env('LOGIN_PHONE', '')),
  loginPassword: opt('login-password', env('LOGIN_PASSWORD', '')),
  shopId: opt('shop-id', env('SHOP_ID', '')),
  serviceId: opt('service-id', env('SERVICE_ID', '')),
  barberId: opt('barber-id', env('BARBER_ID', '')),
  verbose: boolOpt('verbose', boolEnv('VERBOSE', false)),
  dryRun: boolOpt('dry-run', false),
};

const state = {
  token: opt('token', env('TOKEN', '')),
  shops: [],
  servicesByShop: new Map(),
  failures: [],
  resultRows: [],
  startedAt: null,
};

const stats = {
  total: 0,
  ok: 0,
  httpErrors: 0,
  networkErrors: 0,
  timeouts: 0,
  byName: new Map(),
  byStatus: new Map(),
  latencies: [],
  maxInflight: 0,
};

function env(name, fallback) {
  return process.env[name] === undefined || process.env[name] === '' ? fallback : process.env[name];
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const withoutPrefix = arg.slice(2);
    if (withoutPrefix.includes('=')) {
      const [key, ...valueParts] = withoutPrefix.split('=');
      parsed[key] = valueParts.join('=');
      continue;
    }
    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[withoutPrefix] = next;
      index += 1;
    } else {
      parsed[withoutPrefix] = 'true';
    }
  }
  return parsed;
}

function opt(name, fallback) {
  return cli[name] === undefined || cli[name] === '' ? fallback : cli[name];
}

function intOpt(name, fallback) {
  const parsed = Number.parseInt(opt(name, String(fallback)), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boolOpt(name, fallback) {
  const raw = String(opt(name, String(fallback))).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(raw);
}

function intEnv(name, fallback) {
  const parsed = Number.parseInt(env(name, String(fallback)), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boolEnv(name, fallback) {
  const raw = env(name, String(fallback)).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(raw);
}

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.ceil((p / 100) * values.length) - 1);
  return values[index];
}

function jsonHeaders(extra = {}) {
  return { 'content-type': 'application/json', ...extra };
}

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

function safeId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

async function request(name, method, route, options = {}) {
  const url = `${config.baseUrl}${route}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || config.timeoutMs);
  const start = nowMs();

  try {
    const response = await fetch(url, {
      method,
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal,
    });
    const latency = nowMs() - start;
    clearTimeout(timeout);

    const text = await response.text().catch(() => '');
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text.slice(0, 500);
      }
    }

    recordResult({ name, status: response.status, ok: response.ok, latency });
    return { ok: response.ok, status: response.status, data, latency };
  } catch (error) {
    const latency = nowMs() - start;
    clearTimeout(timeout);
    const isTimeout = error && error.name === 'AbortError';
    recordResult({ name, status: isTimeout ? 'timeout' : 'network', ok: false, latency, error: error.message });
    return { ok: false, status: isTimeout ? 'timeout' : 'network', error, latency };
  }
}

function recordResult(result) {
  stats.total += 1;
  stats.latencies.push(result.latency);
  stats.byStatus.set(result.status, (stats.byStatus.get(result.status) || 0) + 1);

  if (result.ok) stats.ok += 1;
  else if (result.status === 'timeout') stats.timeouts += 1;
  else if (result.status === 'network') stats.networkErrors += 1;
  else stats.httpErrors += 1;

  const routeStats = stats.byName.get(result.name) || {
    total: 0,
    ok: 0,
    errors: 0,
    latencies: [],
    statuses: new Map(),
  };
  routeStats.total += 1;
  routeStats.latencies.push(result.latency);
  routeStats.statuses.set(result.status, (routeStats.statuses.get(result.status) || 0) + 1);
  if (result.ok) routeStats.ok += 1;
  else routeStats.errors += 1;
  stats.byName.set(result.name, routeStats);

  if (!result.ok && state.failures.length < 50) {
    state.failures.push(result);
  }

  if (config.verbose) {
    console.log(`${result.ok ? 'OK ' : 'ERR'} ${result.name} ${result.status} ${result.latency}ms`);
  }
}

async function bootstrap() {
  console.log(`Target: ${config.baseUrl}`);
  console.log(`Scenario: ${config.scenario}, concurrency=${config.concurrency}, duration=${config.durationSeconds}s, ramp=${config.rampSeconds}s`);

  const health = await request('health', 'GET', '/', { timeoutMs: 5000 });
  if (!health.ok) {
    console.warn(`Health check did not return 2xx (${health.status}). Continuing because some deployments only expose API routes.`);
  }

  if (!state.token && config.loginPhone && config.loginPassword) {
    const login = await request('login-bootstrap', 'POST', '/api/v1/user/login', {
      headers: jsonHeaders(),
      body: JSON.stringify({ phoneNumber: config.loginPhone, password: config.loginPassword }),
      timeoutMs: Math.max(config.timeoutMs, 20000),
    });
    if (login.ok && login.data && login.data.token) {
      state.token = login.data.token;
      console.log('Authenticated bootstrap user.');
    } else {
      console.warn(`Bootstrap login failed (${login.status}). Authenticated routes will be skipped.`);
    }
  }

  await discoverPublicData();

  if (config.warmupSeconds > 0) {
    console.log(`Warmup ${config.warmupSeconds}s...`);
    await runWorkers(Math.min(10, config.concurrency), config.warmupSeconds * 1000, true);
    resetStats();
  }
}

async function discoverPublicData() {
  const search = await request('discover-search', 'GET', '/api/v1/search');
  if (search.ok && Array.isArray(search.data)) {
    state.shops = search.data.slice(0, 20);
  }

  if (config.shopId && !state.shops.some((shop) => safeId(shop) === config.shopId)) {
    state.shops.unshift({ _id: config.shopId });
  }

  for (const shop of state.shops.slice(0, 5)) {
    const shopId = safeId(shop);
    if (!shopId) continue;
    const services = await request('discover-services', 'GET', `/api/v1/service/shop/${shopId}`);
    if (services.ok && Array.isArray(services.data)) {
      state.servicesByShop.set(shopId, services.data);
    }
  }

  if (config.serviceId && config.shopId) {
    const current = state.servicesByShop.get(config.shopId) || [];
    if (!current.some((svc) => safeId(svc) === config.serviceId)) {
      current.unshift({ _id: config.serviceId });
      state.servicesByShop.set(config.shopId, current);
    }
  }

  console.log(`Discovered shops=${state.shops.length}, service groups=${state.servicesByShop.size}`);
}

function resetStats() {
  stats.total = 0;
  stats.ok = 0;
  stats.httpErrors = 0;
  stats.networkErrors = 0;
  stats.timeouts = 0;
  stats.byName.clear();
  stats.byStatus.clear();
  stats.latencies.length = 0;
  stats.maxInflight = 0;
  state.failures.length = 0;
}

function chooseScenarioTask() {
  const weighted = scenarioWeights(config.scenario);
  const roll = Math.random();
  let acc = 0;
  for (const [name, weight] of weighted) {
    acc += weight;
    if (roll <= acc) return taskByName(name);
  }
  return taskByName(weighted[weighted.length - 1][0]);
}

function scenarioWeights(name) {
  if (name === 'read-heavy') {
    return normalize([
      ['search', 35], ['shop-detail', 25], ['services', 20], ['slots', 15], ['profile', 5],
    ]);
  }
  if (name === 'login-bcrypt') {
    return normalize([
      ['login', 90], ['search', 10],
    ]);
  }
  if (name === 'spike') {
    return normalize([
      ['login', 20], ['search', 25], ['shop-detail', 15], ['services', 15], ['slots', 20], ['my-appointments', 5],
    ]);
  }
  if (name === 'booking-race') {
    return normalize([
      ['create-appointment', 70], ['slots', 20], ['my-appointments', 10],
    ]);
  }
  if (name === 'soak') {
    return normalize([
      ['login', 10], ['search', 25], ['shop-detail', 20], ['services', 15], ['slots', 20], ['profile', 5], ['my-appointments', 5],
    ]);
  }
  return normalize([
    ['login', 15], ['search', 25], ['shop-detail', 15], ['services', 15], ['slots', 20], ['profile', 5], ['my-appointments', 5],
  ]);
}

function normalize(items) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  return items.map(([name, weight]) => [name, weight / total]);
}

function randomItem(items) {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function randomShopId() {
  return safeId(randomItem(state.shops)) || config.shopId;
}

function randomService(shopId) {
  const services = state.servicesByShop.get(shopId) || [];
  return randomItem(services);
}

function nextBookingDate() {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const hour = 9 + Math.floor(Math.random() * 10);
  const minute = Math.random() < 0.5 ? 0 : 30;
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function taskByName(name) {
  if (name === 'login') {
    return async () => {
      if (!config.loginPhone || !config.loginPassword) return taskByName('search')();
      return request('login', 'POST', '/api/v1/user/login', {
        headers: jsonHeaders(),
        body: JSON.stringify({ phoneNumber: config.loginPhone, password: config.loginPassword }),
      });
    };
  }

  if (name === 'search') {
    return async () => {
      const keywords = ['', '?keyword=hair', '?keyword=barber', '?keyword=30', '?lat=21.028&long=105.799&radius=10'];
      return request('search', 'GET', `/api/v1/search${randomItem(keywords)}`);
    };
  }

  if (name === 'shop-detail') {
    return async () => {
      const shopId = randomShopId();
      if (!shopId) return taskByName('search')();
      return request('shop-detail', 'GET', `/api/v1/shop/${shopId}`);
    };
  }

  if (name === 'services') {
    return async () => {
      const shopId = randomShopId();
      if (!shopId) return taskByName('search')();
      return request('services', 'GET', `/api/v1/service/shop/${shopId}`);
    };
  }

  if (name === 'slots') {
    return async () => {
      const shopId = randomShopId();
      if (!shopId) return taskByName('search')();
      const date = new Date(Date.now() + (1 + Math.floor(Math.random() * 7)) * 86400000).toISOString().slice(0, 10);
      const barber = config.barberId && Math.random() < 0.5 ? `&barberId=${encodeURIComponent(config.barberId)}` : '';
      return request('slots', 'GET', `/api/v1/shop/${shopId}/slots?date=${date}${barber}`);
    };
  }

  if (name === 'profile') {
    return async () => {
      if (!state.token) return taskByName('search')();
      return request('profile', 'GET', '/api/v1/user/profile', { headers: authHeaders() });
    };
  }

  if (name === 'my-appointments') {
    return async () => {
      if (!state.token) return taskByName('search')();
      return request('my-appointments', 'GET', '/api/v1/appointment/me', { headers: authHeaders() });
    };
  }

  if (name === 'create-appointment') {
    return async () => {
      if (!config.allowWrites || !state.token) return taskByName('slots')();
      const shopId = config.shopId || randomShopId();
      const service = config.serviceId ? { _id: config.serviceId } : randomService(shopId);
      const serviceId = safeId(service);
      if (!shopId || !serviceId) return taskByName('slots')();
      return request('create-appointment', 'POST', '/api/v1/appointment', {
        headers: jsonHeaders(authHeaders()),
        body: JSON.stringify({
          shopId,
          barberId: config.barberId || undefined,
          serviceIds: [serviceId],
          bookingDate: nextBookingDate(),
          note: 'load-test',
        }),
      });
    };
  }

  return async () => request('health', 'GET', '/');
}

async function rateLimit(lastStartRef) {
  if (!config.maxRps) return;
  const gap = 1000 / config.maxRps;
  const elapsed = nowMs() - lastStartRef.value;
  if (elapsed < gap) await sleep(gap - elapsed);
  lastStartRef.value = nowMs();
}

async function runWorkers(workerCount, durationMs, isWarmup = false) {
  let inflight = 0;
  const startedAt = nowMs();
  const deadline = startedAt + durationMs;
  const lastStartRef = { value: 0 };

  async function worker(index) {
    while (nowMs() < deadline) {
      const elapsedSeconds = (nowMs() - startedAt) / 1000;
      if (!isWarmup && config.rampSeconds > 0) {
        const allowed = Math.max(1, Math.ceil(config.concurrency * Math.min(1, elapsedSeconds / config.rampSeconds)));
        if (index >= allowed) {
          await sleep(100);
          continue;
        }
      }

      await rateLimit(lastStartRef);
      inflight += 1;
      stats.maxInflight = Math.max(stats.maxInflight, inflight);
      try {
        await chooseScenarioTask()();
      } finally {
        inflight -= 1;
      }
    }
  }

  const workers = Array.from({ length: workerCount }, (_, index) => worker(index));
  await Promise.all(workers);
}

function summarize() {
  stats.latencies.sort((a, b) => a - b);
  const durationSeconds = (nowMs() - state.startedAt) / 1000;
  const summary = {
    target: config.baseUrl,
    scenario: config.scenario,
    allowWrites: config.allowWrites,
    durationSeconds: Number(durationSeconds.toFixed(2)),
    concurrency: config.concurrency,
    maxRpsLimit: config.maxRps || null,
    total: stats.total,
    ok: stats.ok,
    errorRate: stats.total ? Number(((stats.total - stats.ok) / stats.total).toFixed(4)) : 0,
    rps: durationSeconds ? Number((stats.total / durationSeconds).toFixed(2)) : 0,
    okRps: durationSeconds ? Number((stats.ok / durationSeconds).toFixed(2)) : 0,
    latencyMs: {
      min: stats.latencies[0] || 0,
      p50: percentile(stats.latencies, 50),
      p90: percentile(stats.latencies, 90),
      p95: percentile(stats.latencies, 95),
      p99: percentile(stats.latencies, 99),
      max: stats.latencies[stats.latencies.length - 1] || 0,
    },
    errors: {
      http: stats.httpErrors,
      network: stats.networkErrors,
      timeout: stats.timeouts,
    },
    statuses: Object.fromEntries([...stats.byStatus.entries()].map(([key, value]) => [String(key), value])),
    maxInflight: stats.maxInflight,
    routes: Object.fromEntries([...stats.byName.entries()].map(([name, routeStats]) => {
      const sorted = routeStats.latencies.sort((a, b) => a - b);
      return [name, {
        total: routeStats.total,
        ok: routeStats.ok,
        errors: routeStats.errors,
        errorRate: routeStats.total ? Number((routeStats.errors / routeStats.total).toFixed(4)) : 0,
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        statuses: Object.fromEntries([...routeStats.statuses.entries()].map(([key, value]) => [String(key), value])),
      }];
    })),
    sampleFailures: state.failures,
  };
  return summary;
}

function writeSummary(summary) {
  fs.mkdirSync(config.outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(config.outputDir, `${stamp}-${config.scenario}.json`);
  fs.writeFileSync(file, JSON.stringify(summary, null, 2));
  return file;
}

async function main() {
  if (config.verbose) {
    console.log(`argv: ${JSON.stringify(process.argv.slice(2))}`);
  }
  if (config.dryRun) {
    console.log(JSON.stringify({
      baseUrl: config.baseUrl,
      scenario: config.scenario,
      concurrency: config.concurrency,
      durationSeconds: config.durationSeconds,
      rampSeconds: config.rampSeconds,
      warmupSeconds: config.warmupSeconds,
      maxRps: config.maxRps,
      timeoutMs: config.timeoutMs,
      allowWrites: config.allowWrites,
      hasLoginPhone: Boolean(config.loginPhone),
      hasLoginPassword: Boolean(config.loginPassword),
      shopId: config.shopId,
      serviceId: config.serviceId,
      barberId: config.barberId,
    }, null, 2));
    return;
  }

  await bootstrap();
  state.startedAt = nowMs();
  console.log('Running load test...');
  await runWorkers(config.concurrency, config.durationSeconds * 1000);
  const summary = summarize();
  const file = writeSummary(summary);

  console.log('\n=== Summary ===');
  console.log(`Requests: ${summary.total} total, ${summary.ok} ok, errorRate=${(summary.errorRate * 100).toFixed(2)}%`);
  console.log(`Throughput: ${summary.rps} req/s total, ${summary.okRps} req/s ok`);
  console.log(`Latency: p50=${summary.latencyMs.p50}ms p95=${summary.latencyMs.p95}ms p99=${summary.latencyMs.p99}ms max=${summary.latencyMs.max}ms`);
  console.log(`Errors: http=${summary.errors.http} network=${summary.errors.network} timeout=${summary.errors.timeout}`);
  console.log(`Output: ${file}`);

  const hasSevereFailure = summary.errorRate > 0.05 || summary.latencyMs.p95 > config.timeoutMs * 0.8;
  process.exitCode = hasSevereFailure ? 2 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
