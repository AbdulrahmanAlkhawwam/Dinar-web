// A stand-in for the Dinar API, for working on the dashboard without an
// account on the real one. In-memory, resets on restart.
//
//   node scripts/mock-api.mjs            → http://localhost:4010/api/v1
//   npm run dev:mock                     → dashboard wired to it
//
// It mirrors the NestJS services' behaviour where the dashboard depends on
// it: token shapes per route, per-user operations, the rate snapshot rules in
// OperationsService.update, admin-only currency writes, and the two response
// envelopes. Any email signs in; an email starting with "admin" is an ADMIN.

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);
const PREFIX = '/api/v1';
const ACCESS_TTL = Number(process.env.MOCK_ACCESS_TTL ?? 900);
const REFRESH_TTL = 7 * 24 * 3600;

const now = () => new Date().toISOString();
const users = new Map();
const currencies = new Map();
const operations = new Map();

function token(user, ttl, kind) {
  const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + ttl;
  return `${b64({ alg: 'none' })}.${b64({ sub: user.id, email: user.email, role: user.role, exp, kind })}.mock`;
}

function claims(raw) {
  try {
    const payload = JSON.parse(Buffer.from(raw.split('.')[1], 'base64url').toString());
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

function userFor(email, name) {
  for (const user of users.values()) if (user.email === email) return user;
  const user = {
    id: randomUUID(),
    name: name ?? email.split('@')[0],
    email,
    phone: null,
    avatar: null,
    role: email.startsWith('admin') ? 'ADMIN' : 'USER',
    createdAt: now(),
    updatedAt: now(),
  };
  users.set(user.id, user);
  seedOperations(user);
  return user;
}

function seedCurrencies() {
  for (const [code, name, symbol, rate] of [
    ['USD', 'US Dollar', '$', 1],
    ['SYP', 'Syrian Pound', 'SP', 13000],
    ['EUR', 'Euro', '€', 0.92],
  ]) {
    const c = { id: randomUUID(), code, name, symbol, exchangeRateFromUSD: rate, createdAt: now(), updatedAt: now() };
    currencies.set(c.id, c);
  }
}

function seedOperations(user) {
  const [usd, syp] = [...currencies.values()];
  const today = new Date();
  const day = (offset) => {
    const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - offset));
    return d.toISOString();
  };
  const rows = [
    ['INCOME', 'Salary', 1800, usd, 2],
    ['EXPENSE', 'Rent', 450, usd, 3],
    ['EXPENSE', 'Groceries', 910000, syp, 1],
    ['EXPENSE', 'Transport', 120000, syp, 4],
    ['INCOME', 'Freelance', 300, usd, 6],
    ['EXPENSE', 'Electricity', 260000, syp, 9],
    ['EXPENSE', 'Dinner out', 38, usd, 12],
    ['INCOME', 'Salary', 1800, usd, 33],
    ['EXPENSE', 'Rent', 450, usd, 34],
    ['EXPENSE', 'Groceries', 780000, syp, 40],
  ];
  for (const [type, title, amount, currency, offset] of rows) {
    const op = {
      id: randomUUID(),
      userId: user.id,
      type,
      title,
      description: null,
      amount,
      currencyId: currency.id,
      exchangeRate: currency.exchangeRateFromUSD,
      amountInUSD: amount / currency.exchangeRateFromUSD,
      operationDate: day(offset),
      createdAt: now(),
      updatedAt: now(),
    };
    operations.set(op.id, op);
  }
}

const withCurrency = (op) => ({ ...op, currency: currencies.get(op.currencyId) });

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const fail = (res, status, message) =>
  send(res, status, { message, error: status === 401 ? 'Unauthorized' : 'Error', statusCode: status });

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function auth(req) {
  const header = req.headers.authorization ?? '';
  const payload = header.startsWith('Bearer ') ? claims(header.slice(7)) : null;
  return payload && payload.kind === 'access' ? payload : null;
}

function validateOperation(body, partial) {
  const errors = [];
  if (!partial || body.title !== undefined)
    if (typeof body.title !== 'string' || !body.title.trim()) errors.push('title should not be empty');
  if (!partial || body.amount !== undefined)
    if (typeof body.amount !== 'number' || !(body.amount > 0)) errors.push('amount must be a positive number');
  if (!partial || body.type !== undefined)
    if (!['INCOME', 'EXPENSE'].includes(body.type)) errors.push('type must be one of the following values: INCOME, EXPENSE');
  if (!partial || body.currencyId !== undefined)
    if (typeof body.currencyId !== 'string' || !body.currencyId) errors.push('currencyId should not be empty');
  return errors;
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://mock');
  if (!url.pathname.startsWith(PREFIX)) return fail(res, 404, 'Not Found');
  const [resource, id] = url.pathname.slice(PREFIX.length + 1).split('/');
  const method = req.method;

  // Slow enough to see loading states, like a cold serverless start.
  await new Promise((r) => setTimeout(r, Number(process.env.MOCK_LATENCY ?? 250)));

  if (resource === 'auth') {
    const body = await readJson(req);
    if (id === 'login' || id === 'register') {
      if (!body.email || !body.password) return fail(res, 400, ['email must be an email']);
      const user = userFor(body.email, body.name);
      const accessToken = token(user, ACCESS_TTL, 'access');
      // AuthService.register returns no refresh token.
      if (id === 'register') return send(res, 201, { user, accessToken });
      return send(res, 200, { user, accessToken, refreshToken: token(user, REFRESH_TTL, 'refresh') });
    }
    if (id === 'refresh') {
      const payload = claims(body.refreshToken ?? '');
      const user = payload?.kind === 'refresh' && users.get(payload.sub);
      if (!user) return fail(res, 401, 'Invalid or expired refresh token');
      return send(res, 200, { accessToken: token(user, ACCESS_TTL, 'access') });
    }
    if (id === 'logout') return auth(req) ? send(res, 200, { message: 'Logged out successfully' }) : fail(res, 401, 'Unauthorized');
  }

  if (resource === 'currencies') {
    if (method === 'GET') return send(res, 200, [...currencies.values()]);
    const user = auth(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    if (user.role !== 'ADMIN') return fail(res, 403, 'Administrator access is required');
    const body = method === 'DELETE' ? {} : await readJson(req);
    if (method === 'POST') {
      const c = { id: randomUUID(), ...body, code: String(body.code).toUpperCase(), createdAt: now(), updatedAt: now() };
      currencies.set(c.id, c);
      return send(res, 201, c);
    }
    const existing = currencies.get(id);
    if (!existing) return fail(res, 404, `Currency with ID ${id} was not found`);
    if (method === 'PATCH') {
      const c = { ...existing, ...body, updatedAt: now() };
      currencies.set(id, c);
      return send(res, 200, c);
    }
    if (method === 'DELETE') {
      // Operation.currency is onDelete: Restrict; the real API 500s here.
      if ([...operations.values()].some((op) => op.currencyId === id)) return fail(res, 500, 'Internal server error');
      currencies.delete(id);
      return send(res, 200, existing);
    }
  }

  if (resource === 'operations') {
    const user = auth(req);
    if (!user) return fail(res, 401, 'Unauthorized');
    const mine = [...operations.values()].filter((op) => op.userId === user.sub);

    if (method === 'GET' && !id) {
      const page = Number(url.searchParams.get('page') ?? 1);
      const limit = Number(url.searchParams.get('limit') ?? 20);
      if (limit > 100) return fail(res, 400, ['limit must not be greater than 100']);
      const type = url.searchParams.get('type');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const rows = mine
        .filter((op) => !type || op.type === type)
        .filter((op) => !from || op.operationDate.slice(0, 10) >= from)
        .filter((op) => !to || op.operationDate.slice(0, 10) <= to)
        .sort((a, b) => b.operationDate.localeCompare(a.operationDate));
      return send(res, 200, {
        data: rows.slice((page - 1) * limit, page * limit).map(withCurrency),
        meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
      });
    }

    if (method === 'POST') {
      const body = await readJson(req);
      const errors = validateOperation(body, false);
      if (errors.length) return fail(res, 400, errors);
      const currency = currencies.get(body.currencyId);
      if (!currency) return fail(res, 404, 'Currency not found');
      const op = {
        id: randomUUID(),
        userId: user.sub,
        type: body.type,
        title: body.title,
        description: body.description ?? null,
        amount: body.amount,
        currencyId: currency.id,
        exchangeRate: currency.exchangeRateFromUSD,
        amountInUSD: body.amount / currency.exchangeRateFromUSD,
        operationDate: body.operationDate ? `${body.operationDate}T00:00:00.000Z` : now(),
        createdAt: now(),
        updatedAt: now(),
      };
      operations.set(op.id, op);
      return send(res, 201, withCurrency(op));
    }

    const op = mine.find((o) => o.id === id);
    if (!op) return fail(res, 404, `Operation with ID ${id} was not found`);
    if (method === 'GET') return send(res, 200, withCurrency(op));
    if (method === 'DELETE') {
      operations.delete(id);
      return send(res, 200, op);
    }
    if (method === 'PATCH') {
      const body = await readJson(req);
      const errors = validateOperation(body, true);
      if (errors.length) return fail(res, 400, errors);
      // OperationsService.update: only a currency change takes today's rate.
      const currencyChanged = body.currencyId !== undefined && body.currencyId !== op.currencyId;
      const currency = currencies.get(body.currencyId ?? op.currencyId);
      if (!currency) return fail(res, 404, 'Currency not found');
      const amount = body.amount ?? op.amount;
      const exchangeRate = currencyChanged ? currency.exchangeRateFromUSD : op.exchangeRate;
      const updated = {
        ...op,
        ...body,
        operationDate: body.operationDate ? `${body.operationDate}T00:00:00.000Z` : op.operationDate,
        amount,
        currencyId: currency.id,
        exchangeRate,
        amountInUSD: amount / exchangeRate,
        updatedAt: now(),
      };
      operations.set(id, updated);
      return send(res, 200, withCurrency(updated));
    }
  }

  if (resource === 'products') return send(res, 200, { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  if (resource === 'categories' || resource === 'users') return send(res, 200, []);

  return fail(res, 404, 'Not Found');
}

seedCurrencies();
createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    fail(res, 500, 'Internal server error');
  });
}).listen(PORT, () => {
  console.log(`Mock Dinar API on http://localhost:${PORT}${PREFIX}`);
});
