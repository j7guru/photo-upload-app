import PhotoUploadDashboard from '@/components/PhotoUploadDashboard';
import { fetchShipmentRows, type ShipmentRecord } from '@/lib/baserow';

export default async function HomePage() {
  let records: ShipmentRecord[] = [];

  try {
    records = await fetchShipmentRows();
  } catch (error) {
    console.error('Unable to load initial records', error);
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Photo Upload App
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Update Your Baserow Records</h1>
        <p className="mt-2 text-base text-slate-600">
          Choose a record, upload a photo, and we&apos;ll handle the Baserow update for you.
        </p>
      </div>
      <PhotoUploadDashboard initialRecords={records} />
    </main>
  );
}
