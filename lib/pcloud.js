// lib/pcloud.js
export function apiBase() {
  return process.env.PCLOUD_API_URL || 'https://eapi.pcloud.com';
}

export async function getFileLinkByPath({ path, accessToken }) {
  const url = `${apiBase()}/getfilelink?path=${encodeURIComponent(path)}&access_token=${accessToken}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.result !== 0 || !j.hosts?.length || !j.path) throw new Error(`pCloud getfilelink failed: ${j.error || 'unknown'}`);
  // z.B. https://<host><path>
  return `https://${j.hosts[0]}${j.path}`;
}

export async function uploadFileBuffer({ folderId, filename, buffer, accessToken }) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('filename', buffer, filename);
  const url = `${apiBase()}/uploadfile?folderid=${folderId}&access_token=${accessToken}&nopartial=1&renameifexists=1`;
  const resp = await fetch(url, { method: 'POST', body: form });
  const data = await resp.json();
  if (data.result !== 0) throw new Error(`pCloud upload failed: ${data.error || 'unknown'}`);
  // returns file metadata array
  return data.metadata?.[0];
}

export async function deleteFileByPath({ path, accessToken }) {
  const url = `${apiBase()}/deletefile?path=${encodeURIComponent(path)}&access_token=${accessToken}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.result !== 0) throw new Error(`pCloud delete failed: ${j.error || 'unknown'}`);
  return true;
}
