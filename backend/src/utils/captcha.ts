import crypto from 'crypto';

interface CaptchaEntry {
  answer: number;
  expiresAt: number;
}

const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes
const pending = new Map<string, CaptchaEntry>();

function purgeExpired() {
  const now = Date.now();
  for (const [id, entry] of pending) {
    if (entry.expiresAt < now) pending.delete(id);
  }
}

export function generateCaptcha(): { captchaId: string; question: string } {
  purgeExpired();

  const a = Math.floor(1 + Math.random() * 9);
  const b = Math.floor(1 + Math.random() * 9);
  const captchaId = crypto.randomUUID();
  pending.set(captchaId, { answer: a + b, expiresAt: Date.now() + CAPTCHA_TTL_MS });

  return { captchaId, question: `${a} + ${b}` };
}

export function verifyCaptcha(captchaId: string, answer: number | string): boolean {
  const entry = pending.get(captchaId);
  if (!entry) return false;

  // Single use: consume regardless of outcome to prevent retry-guessing against the same id.
  pending.delete(captchaId);

  if (entry.expiresAt < Date.now()) return false;
  return Number(answer) === entry.answer;
}
