import { NextResponse } from 'next/server';
import { fetchShipmentRows } from '@/lib/baserow';

export async function GET() {
  try {
    const rows = await fetchShipmentRows();
    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Failed to fetch Baserow records', error);
    return NextResponse.json(
      { error: 'Unable to load records from Baserow.' },
      { status: 500 }
    );
  }
}
