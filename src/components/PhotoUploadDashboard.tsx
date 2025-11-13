'use client';

import { useCallback, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import axios from 'axios';
import type { ShipmentRecord, BaserowAttachment } from '@/lib/baserow';

type StatusState =
  | { type: 'idle'; message?: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

type Props = {
  initialRecords: ShipmentRecord[];
};

type RecordsResponse = {
  rows: ShipmentRecord[];
};

const pickPhotoUrl = (photo?: BaserowAttachment[]) =>
  photo?.[0]?.thumbnails?.small?.url ?? photo?.[0]?.url ?? null;

const fieldHeading = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

const cellStyle = 'text-sm text-slate-900';

export default function PhotoUploadDashboard({ initialRecords }: Props) {
  const [records, setRecords] = useState<ShipmentRecord[]>(initialRecords);
  const [selectedId, setSelectedId] = useState<number | null>(initialRecords[0]?.id ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    pickPhotoUrl(initialRecords[0]?.photo)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId]
  );

  const refreshRecords = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/records');
      if (!response.ok) {
        throw new Error('Failed to refresh records.');
      }
      const data: RecordsResponse = await response.json();
      setRecords(data.rows);
      if (data.rows.length && !data.rows.some((row) => row.id === selectedId)) {
        const fallback = data.rows[0];
        setSelectedId(fallback.id);
        setPreviewUrl(pickPhotoUrl(fallback.photo));
      }
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: 'Unable to refresh records. Please try again.'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    setFile(nextFile ?? null);
    if (nextFile) {
      setStatus({ type: 'idle' });
      setPreviewUrl(URL.createObjectURL(nextFile));
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !selectedId) {
      setStatus({
        type: 'error',
        message: 'Select a record and choose a JPG/PNG image before uploading.'
      });
      return;
    }

    const formData = new FormData();
    formData.append('recordId', String(selectedId));
    formData.append('file', file);

    try {
      setIsUploading(true);
      setProgress(0);
      setStatus({ type: 'idle' });

      const response = await axios.post<UploadResponse>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      setStatus({
        type: 'success',
        message: 'Photo uploaded successfully.'
      });

      setPreviewUrl(response.data.photo?.thumbnails?.small?.url ?? response.data.photo?.url ?? null);
      setFile(null);
      await refreshRecords();
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message:
          axios.isAxiosError(error) && typeof error.response?.data?.error === 'string'
            ? error.response.data.error
            : 'Upload failed. Please try again.'
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const rows = records ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
      <section className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Baserow Records</h2>
            <p className="text-sm text-slate-500">Select a row to attach a new photo.</p>
          </div>
          <button
            onClick={refreshRecords}
            disabled={isRefreshing}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">
                  <span className={fieldHeading}>Customer Name</span>
                </th>
                <th className="px-4 py-3">
                  <span className={fieldHeading}>Inbound/Outbound</span>
                </th>
                <th className="px-4 py-3">
                  <span className={fieldHeading}>Order Type</span>
                </th>
                <th className="px-4 py-3">
                  <span className={fieldHeading}>Carrier Name</span>
                </th>
                <th className="px-4 py-3">
                  <span className={fieldHeading}>Invoiced</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const isSelected = row.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    className={isSelected ? 'bg-sky-50/80' : 'bg-white hover:bg-slate-50'}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="record"
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedId(row.id);
                          setPreviewUrl(pickPhotoUrl(row.photo));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className={cellStyle}>{row.customerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cellStyle}>{row.inboundOutbound}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cellStyle}>{row.orderType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cellStyle}>{row.carrierName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.invoiced
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {row.invoiced ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                    No records found for this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upload Photo</h2>
        <p className="text-sm text-slate-500">
          Upload a JPG or PNG. The file will be sent directly to Baserow and linked to the selected
          record.
        </p>

        <form onSubmit={handleUpload} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="file"
              className="text-sm font-medium text-slate-700"
            >
              Choose Photo
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="mt-2 block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-slate-400"
            />
          </div>

          {file && (
            <p className="text-xs text-slate-500">
              Selected file: <span className="font-medium text-slate-700">{file.name}</span>
            </p>
          )}

          {isUploading && (
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-sky-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status.type !== 'idle' && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? 'Uploading…' : 'Upload Photo'}
          </button>
        </form>

        {previewUrl && (
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700">Preview</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src={previewUrl}
                alt="Uploaded preview"
                width={320}
                height={180}
                className="h-48 w-full object-cover"
                unoptimized={previewUrl.startsWith('blob:')}
              />
            </div>
          </div>
        )}

        {selectedRecord && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Selected record:</span>{' '}
              {selectedRecord.customerName} (#{selectedRecord.id})
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

type UploadResponse = {
  rowId: number;
  photo: BaserowAttachment;
};
