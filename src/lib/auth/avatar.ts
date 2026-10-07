// Avatars are stored in the bucket as avatars/<file>, and users.avatar keeps just the file name.
// The bucket is private, so the browser gets them through /api/avatars/<file>.

// Every upload gets a new random name, so a URL never changes what it shows and can be cached for good.
export const AVATAR_FILE_PATTERN = /^[A-Za-z0-9_-]{20,}\.jpg$/;

export const avatarKey = (file: string) => `avatars/${file}`;

export const avatarUrl = (file: string | null | undefined) => (file ? `/api/avatars/${file}` : null);
