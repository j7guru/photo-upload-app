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

type RawShipmentRecord = {
  id: number;
  Photo?: BaserowAttachment[];
  'Customer Name'?: string;
  'Inbound/Outbound'?: string;
  'Order Type'?: string;
  'Carrier Name'?: string;
  Invoiced?: boolean;
};

const normalizeRecord = (row: RawShipmentRecord): ShipmentRecord => ({
  id: row.id,
  customerName: row['Customer Name'] ?? 'Unknown',
  inboundOutbound: row['Inbound/Outbound'] ?? 'N/A',
  orderType: row['Order Type'] ?? 'N/A',
  carrierName: row['Carrier Name'] ?? 'N/A',
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
