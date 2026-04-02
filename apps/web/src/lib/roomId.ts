const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRoomId(): string {
  const array = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(array, (b) => CHARS[b % CHARS.length]).join('');
}
