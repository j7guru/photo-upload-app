import { getBaserowConfig } from './env';

export type BaserowAttachment = {
  id: number;
  name: string;
  url: string;
  thumbnails?: Record<
    string,
    {
      url: string;
      width: number;
      height: number;
    }
  >;
  mime_type?: string;
  size?: number;
  image_width?: number;
  image_height?: number;
};

export type ShipmentRecord = {
  id: number;
  customerName: string;
  inboundOutbound: string;
  orderType: string;
  carrierName: string;
  invoiced: boolean;
  photo?: BaserowAttachment[];
};

type SingleSelectValue =
  | string
  | number
  | {
      id: number;
      value: string;
      color?: string;
    };

type RawShipmentRecord = {
  id: number;
  Photo?: BaserowAttachment[];
  'Customer Name'?: unknown;
  'Inbound/Outbound'?: SingleSelectValue;
  'Order Type'?: unknown;
  'Carrier Name'?: unknown;
  Invoiced?: boolean;
};

const toDisplayString = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => toDisplayString(item))
      .filter((item): item is string => Boolean(item?.length));
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    const nested = (value as { value?: unknown }).value;
    if (typeof nested === 'string') {
      return nested;
    }
  }
  return null;
};

const formatField = (value: unknown, fallback = 'N/A') => {
  const text = toDisplayString(value);
  const trimmed = text?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const formatSelect = (value: SingleSelectValue | undefined) => {
  if (value == null) {
    return 'N/A';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return value.value ?? 'N/A';
};

const normalizeRecord = (row: RawShipmentRecord): ShipmentRecord => ({
  id: row.id,
  customerName: formatField(row['Customer Name'], 'Unknown'),
  inboundOutbound: formatSelect(row['Inbound/Outbound']),
  orderType: formatField(row['Order Type']),
  carrierName: formatField(row['Carrier Name']),
  invoiced: Boolean(row.Invoiced),
  photo: row.Photo
});

export const fetchShipmentRows = async (): Promise<ShipmentRecord[]> => {
  const { token, baseUrl, tableId } = getBaserowConfig();
  const response = await fetch(
    `${baseUrl}/api/database/rows/table/${tableId}/?user_field_names=true`,
    {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`
      },
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load Baserow rows (${response.status})`);
  }

  const payload = await response.json();
  const rows: RawShipmentRecord[] = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload)
      ? payload
      : [];

  return rows.map(normalizeRecord);
};
