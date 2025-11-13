export type BaserowConfig = {
  token: string;
  baseUrl: string;
  tableId: string;
};

const missingEnv = (name: string) =>
  new Error(`Missing required environment variable ${name}. Add it to .env.local.`);

export const getBaserowConfig = (): BaserowConfig => {
  const token = process.env.BASEROW_API_TOKEN;
  const baseUrl = process.env.BASEROW_BASE_URL;
  const tableId = process.env.BASEROW_TABLE_ID;

  if (!token) {
    throw missingEnv('BASEROW_API_TOKEN');
  }

  if (!baseUrl) {
    throw missingEnv('BASEROW_BASE_URL');
  }

  if (!tableId) {
    throw missingEnv('BASEROW_TABLE_ID');
  }

  return {
    token,
    baseUrl: baseUrl.replace(/\/$/, ''),
    tableId
  };
};
