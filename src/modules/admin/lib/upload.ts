export type CloudinarySignedParams = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey?: string | null;
  cloudName?: string | null;
};

export async function uploadToCloudinary(
  file: File,
  signed: CloudinarySignedParams,
): Promise<string> {
  if (!signed.cloudName || !signed.apiKey) {
    throw new Error("Cloudinary not configured");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", signed.apiKey);
  fd.append("timestamp", String(signed.timestamp));
  fd.append("folder", signed.folder);
  fd.append("signature", signed.signature);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Upload failed");
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}
