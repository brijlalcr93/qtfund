import { Client, Environment, TokenContainer } from 'bitpay-sdk';

let client: Client | null = null;
let initError: string | null = null;

function buildClient(): Client | null {
  const privateKey = process.env.BITPAY_PRIVATE_KEY;
  const merchantToken = process.env.BITPAY_MERCHANT_TOKEN;
  const environment = process.env.BITPAY_ENVIRONMENT === 'Prod' ? Environment.Prod : Environment.Test;

  if (!privateKey || !merchantToken) {
    initError = 'BITPAY_PRIVATE_KEY and/or BITPAY_MERCHANT_TOKEN are not set — crypto payments are disabled until configured.';
    return null;
  }

  try {
    const tokenContainer = new TokenContainer();
    tokenContainer.addMerchant(merchantToken);
    return Client.createClientByPrivateKey(privateKey, tokenContainer, environment, 'QuantumPropFirm');
  } catch (error: any) {
    initError = `Failed to initialize BitPay client: ${error?.message || error}`;
    return null;
  }
}

// Lazily build the client on first use — schema init / server boot must not fail just
// because crypto payments haven't been configured yet.
export function getBitPayClient(): Client {
  if (!client) {
    client = buildClient();
  }
  if (!client) {
    throw new Error(initError || 'BitPay client is not configured');
  }
  return client;
}

export function isBitPayConfigured(): boolean {
  if (!client) client = buildClient();
  return client !== null;
}
