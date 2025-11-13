import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import type { AxiosError } from 'axios';
import { getBaserowConfig } from '@/lib/env';
import type { BaserowAttachment } from '@/lib/baserow';

export const config = {
  api: {
    bodyParser: false
  }
};

type UploadResponse = {
  rowId: number;
  photo: BaserowAttachment;
};

type FormidableFieldValue = string | string[] | undefined;
type FormidableFields = Record<string, FormidableFieldValue>;
type FormidableFile = {
  filepath: string;
  originalFilename?: string | null;
  newFilename: string;
  mimetype?: string | null;
  size?: number;
};
type FormidableFiles = Record<string, FormidableFile | FormidableFile[]>;

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: FormidableFields; files: FormidableFiles }> =>
  new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFileSize: 15 * 1024 * 1024,
      filter: ({ mimetype }: { mimetype?: string | null }) =>
        Boolean(mimetype?.includes('jpeg') || mimetype?.includes('png'))
    });

    form.parse(
      req,
      (
        err: Error | undefined,
        fields: FormidableFields,
        files: FormidableFiles
      ) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({ fields, files });
      }
    );
  });

const ensureFile = (file?: FormidableFile | FormidableFile[]): FormidableFile => {
  if (!file) {
    throw new Error('No file uploaded.');
  }
  if (Array.isArray(file)) {
    return file[0];
  }
  return file;
};

const uploadAttachment = async (file: FormidableFile): Promise<BaserowAttachment> => {
  const { token, baseUrl } = getBaserowConfig();
  const stream = fs.createReadStream(file.filepath);
  const formData = new FormData();
  formData.append('file', stream, file.originalFilename ?? file.newFilename);

  const response = await axios.post(`${baseUrl}/api/user-files/upload-file/`, formData, {
    headers: {
      Authorization: `Token ${token}`,
      ...formData.getHeaders()
    },
    maxBodyLength: Infinity
  });

  return response.data;
};

const updateRowPhoto = async (rowId: number, attachment: BaserowAttachment) => {
  const { token, baseUrl, tableId } = getBaserowConfig();

  await axios.patch(
    `${baseUrl}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
    {
      Photo: [attachment]
    },
    {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
};

const parseRecordId = (fields: FormidableFields): number => {
  const raw = fields.recordId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  if (!parsed) {
    throw new Error('Invalid record id.');
  }
  return parsed;
};

const isAxiosError = (error: unknown): error is AxiosError => !!(error as AxiosError)?.isAxiosError;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const rowId = parseRecordId(fields);
    const file = ensureFile(files.file as FormidableFile | FormidableFile[]);
    const attachment = await uploadAttachment(file);
    await updateRowPhoto(rowId, attachment);

    return res.status(200).json({ rowId, photo: attachment });
  } catch (error) {
    console.error('Upload failed', error);
    const message = isAxiosError(error)
      ? ((error.response?.data as { error?: string } | undefined)?.error ?? error.message)
      : error instanceof Error
        ? error.message
        : 'Unexpected error';
    return res.status(500).json({ error: message });
  }
}
