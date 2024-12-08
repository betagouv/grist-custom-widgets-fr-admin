export const uploadAttachment = async (blob: Blob, filename: string) => {
  const tokenInfo = await grist.docApi.getAccessToken({ readOnly: false });
  const gristUrl = `${tokenInfo.baseUrl}/attachments?auth=${tokenInfo.token}`;

  const formData = new FormData();
  formData.set("upload", blob, filename);

  const gristResponse = await fetch(gristUrl, {
    method: "POST",
    body: formData,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const response = await gristResponse.json();
  return response[0];
};

export const downloadAttachment = async (
  attachmentId: number,
): Promise<ArrayBuffer> => {
  const tokenInfo = await grist.docApi.getAccessToken({ readOnly: true });
  const downloadUrl = `${tokenInfo.baseUrl}/attachments/${attachmentId}/download?auth=${tokenInfo.token}`;

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download attachment: ${response.statusText}`);
  }

  return await response.arrayBuffer();
};
