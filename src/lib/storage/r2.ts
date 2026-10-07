import { AwsClient } from "aws4fetch";

// Cloudflare R2 speaks the S3 protocol; aws4fetch signs plain fetch requests for it.
let client: AwsClient | undefined;

function getClient() {
  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error("The R2 access keys are not defined");
  client ??= new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  return client;
}

// `key` is the object's path inside the bucket, e.g. "avatars/abc.jpg".
function objectUrl(key: string) {
  const { R2_ENDPOINT, R2_BUCKET } = process.env;
  if (!R2_ENDPOINT || !R2_BUCKET) throw new Error("R2_ENDPOINT or R2_BUCKET is not defined");
  return `${R2_ENDPOINT.replace(/\/$/, "")}/${R2_BUCKET}/${key}`;
}

export async function r2Fetch(key: string, init?: RequestInit) {
  const signed = await getClient().sign(objectUrl(key), init);
  // Sent as an address with separate headers and body, not as the signed Request itself: Next.js
  // wraps fetch on the server, and a Request's body goes through it as a stream of unknown length,
  // which R2 refuses for larger uploads (411 Length Required).
  return fetch(signed.url, {
    method: signed.method,
    headers: signed.headers,
    body: init?.body,
    cache: "no-store",
  });
}
