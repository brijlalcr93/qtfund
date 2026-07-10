import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const useTestAccount = process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST;

    if (useTestAccount) {
      transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

function loadTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
  let template = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return template;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  template?: string;
  variables?: Record<string, string>;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const html = options.template
    ? loadTemplate(options.template, options.variables || {})
    : options.html;

  if (!html) {
    throw new Error('Email must have either html or template option');
  }

  await getTransporter().sendMail({
    from: `"PropFirm" <${process.env.SMTP_USER || 'noreply@propfirm.com'}>`,
    to: options.to,
    subject: options.subject,
    html,
  });
}
