const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

function isCloudinaryDeliveryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com") && url.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

export function buildCloudinaryDownloadUrl(url: string, fileName?: string): string {
  if (!url || !isCloudinaryDeliveryUrl(url)) {
    return url;
  }

  const [baseUrl, queryString] = url.split("?", 2);
  const uploadIndex = baseUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) {
    return url;
  }

  const beforeUpload = baseUrl.slice(0, uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length);
  const afterUpload = baseUrl.slice(uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length);
  const attachmentFlag = fileName && fileName.trim()
    ? `fl_attachment:${encodeURIComponent(fileName.trim())}`
    : "fl_attachment";

  const downloadUrl = `${beforeUpload}${attachmentFlag}/${afterUpload}`;
  return queryString ? `${downloadUrl}?${queryString}` : downloadUrl;
}
