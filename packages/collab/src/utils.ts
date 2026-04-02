import { nanoid } from 'nanoid'

const ROOM_ID_LENGTH = 12
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/

export function generateRoomId(): string {
  return nanoid(ROOM_ID_LENGTH)
}

export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_PATTERN.test(roomId)
}
