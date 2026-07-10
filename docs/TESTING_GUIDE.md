# Testing Guide

## Testing Stack

| Layer     | Framework    | Libraries                        |
|-----------|-------------|----------------------------------|
| Backend   | Jest        | Supertest, Prisma test helpers   |
| Frontend  | Vitest      | @testing-library/react, jsdom    |
| API       | Jest + Supertest | express-validator test helpers |
| E2E       | Playwright  | @playwright/test                 |

---

## Backend Testing (Jest + Supertest)

### Setup

```bash
cd server
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

Add to `server/package.json`:

```json
{
  "scripts": {
    "test": "jest --forceExit --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Create `server/jest.config.ts`:

```ts
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
```

### Test Examples

#### Auth Tests

```ts
// server/src/routes/__tests__/auth.test.ts
import request from 'supertest';
import app from '../../index.js';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Registration successful');
    expect(res.body.userId).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'TestPass123', name: 'Dup' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'TestPass123', name: 'Dup' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already registered');
  });

  it('should validate password length', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'short', name: 'Test' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@propfirm.com', password: 'Admin@123456' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('admin@propfirm.com');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@propfirm.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});
```

#### Challenge Plan Tests

```ts
// server/src/routes/__tests__/challenges.test.ts
import request from 'supertest';
import app from '../../index.js';

describe('GET /api/challenges', () => {
  it('should return active challenge plans', async () => {
    const res = await request(app).get('/api/challenges');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((plan: any) => {
      expect(plan.name).toBeDefined();
      expect(plan.price).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('POST /api/challenges', () => {
  let adminToken: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@propfirm.com', password: 'Admin@123456' });
    adminToken = login.body.accessToken;
  });

  it('should create a challenge plan (admin)', async () => {
    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Plan',
        price: 99,
        accountSize: 10000,
        profitTarget: 10,
        maxDrawdown: 8,
        durationDays: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Plan');
  });

  it('should reject creation by non-admin', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'TestPass123' });

    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        name: 'Unauthorized Plan',
        price: 99,
        accountSize: 10000,
        profitTarget: 10,
        maxDrawdown: 8,
        durationDays: 30,
      });

    expect(res.status).toBe(403);
  });
});
```

#### Payment Tests

```ts
// server/src/routes/__tests__/payments.test.ts
import request from 'supertest';
import app from '../../index.js';

describe('POST /api/payments/create-order', () => {
  let userToken: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'TestPass123' });
    userToken = login.body.accessToken;
  });

  it('should create a Razorpay order', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 99,
        gateway: 'razorpay',
        currency: 'INR',
      });

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe('razorpay');
    expect(res.body.orderId).toBeDefined();
    expect(res.body.paymentId).toBeDefined();
  });
});
```

### Running Backend Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific test file
npx jest src/routes/__tests__/auth.test.ts
```

---

## Frontend Testing (Vitest)

### Setup

Vitest is included with Vite by default. Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^24.0.0"
  }
}
```

### Test Examples

#### Store Tests

```ts
// src/store/__tests__/tradingStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTradingStore } from '../tradingStore';

describe('TradingStore', () => {
  beforeEach(() => {
    useTradingStore.setState({
      balance: 10000,
      equity: 10000,
      margin: 0,
      freeMargin: 10000,
      positions: [],
    });
  });

  it('should open a position', () => {
    useTradingStore.getState().openPosition({
      symbol: 'BTCUSDT',
      type: 'buy',
      entryPrice: 50000,
      size: 0.1,
      currentPrice: 50000,
    });

    const state = useTradingStore.getState();
    expect(state.positions).toHaveLength(1);
    expect(state.positions[0].symbol).toBe('BTCUSDT');
    expect(state.margin).toBeGreaterThan(0);
  });

  it('should update position PnL on price change', () => {
    useTradingStore.getState().openPosition({
      symbol: 'BTCUSDT',
      type: 'buy',
      entryPrice: 50000,
      size: 0.1,
      currentPrice: 50000,
    });

    useTradingStore.getState().updatePrice('BTCUSDT', 51000);

    const state = useTradingStore.getState();
    expect(state.positions[0].unrealizedPnL).toBe(100);
    expect(state.equity).toBe(10100);
  });

  it('should close a position', () => {
    useTradingStore.getState().openPosition({
      symbol: 'BTCUSDT',
      type: 'buy',
      entryPrice: 50000,
      size: 0.1,
      currentPrice: 50000,
    });

    useTradingStore.getState().updatePrice('BTCUSDT', 51000);
    const posId = useTradingStore.getState().positions[0].id;
    useTradingStore.getState().closePosition(posId);

    const state = useTradingStore.getState();
    expect(state.positions).toHaveLength(0);
    expect(state.balance).toBe(10100);
  });
});
```

#### Component Tests

```ts
// src/components/__tests__/Navbar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/home/i)).toBeDefined();
    expect(screen.getByText(/pricing/i)).toBeDefined();
    expect(screen.getByText(/faq/i)).toBeDefined();
  });
});
```

### Running Frontend Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# UI mode
npx vitest --ui
```

---

## API Testing (Supertest)

Supertest is used within Jest as shown in the backend examples above. It allows testing Express endpoints without binding to a port.

### Key patterns:

```ts
// Authenticated request
const res = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${adminToken}`)
  .query({ page: 1, limit: 10 });

// File upload (KYC)
const res = await request(app)
  .post('/api/kyc/submit')
  .set('Authorization', `Bearer ${userToken}`)
  .field('fullName', 'John Doe')
  .field('documentType', 'PASSPORT')
  .attach('documentFront', 'test/fixtures/passport.jpg');
```

---

## E2E Testing (Playwright)

### Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Test Example

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('text=Get Started');
  await page.fill('[name="email"]', 'e2e@test.com');
  await page.fill('[name="password"]', 'TestPass123');
  await page.fill('[name="name"]', 'E2E User');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Registration successful')).toBeVisible();
});

test('challenge checkout flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('text=Pricing');
  await page.click('text=Buy Now >> nth=0');
  await expect(page).toHaveURL(/\/checkout/);
  await page.fill('[name="coupon"]', 'WELCOME15');
  await page.click('text=Apply');
  await expect(page.locator('.discount-amount')).toBeVisible();
});

test('admin can view dashboard stats', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:5173/auth');
  await page.fill('[name="email"]', 'admin@propfirm.com');
  await page.fill('[name="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');

  await page.goto('http://localhost:5173/admin');
  await expect(page.locator('text=Total Users')).toBeVisible();
  await expect(page.locator('text=Total Revenue')).toBeVisible();
});
```

### Running Playwright Tests

```bash
# Run all E2E tests
npx playwright test

# With UI
npx playwright test --ui

# Specific file
npx playwright test e2e/auth.spec.ts

# Generate report
npx playwright show-report
```

---

## Running All Tests

```bash
# Backend
cd server && npm test

# Frontend
npm test

# E2E
npx playwright test

# All at once (root package.json)
npm run test:all
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: propfirm
          POSTGRES_PASSWORD: propfirm_secret
          POSTGRES_DB: propfirm
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Backend Tests
        working-directory: server
        run: |
          npm ci
          npx prisma generate
          npm test
      - name: Frontend Tests
        run: |
          npm ci
          npm test
      - name: E2E Tests
        run: |
          npx playwright install
          npx playwright test
```
