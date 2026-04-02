import { Room } from './room.js'
import type { RoomInfo } from './room.js'

class RoomManager {
  private rooms: Map<string, Room> = new Map()

  getOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId)
    if (!room) {
      room = new Room(roomId)
      this.rooms.set(roomId, room)
      console.log(`[room] created: ${roomId}`)
    }
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  getRoomInfo(roomId: string): RoomInfo | null {
    const room = this.rooms.get(roomId)
    return room ? room.getInfo() : null
  }

  setOwner(roomId: string, ownerId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.ownerId = ownerId
    }
  }

  stopSharing(roomId: string, ownerId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.ownerId !== ownerId) {
      return false
    }
    room.isSharing = false
    console.log(`[room] sharing stopped: ${roomId}`)
    // Close all non-owner connections
    room.conns.forEach((_, conn) => {
      conn.close(4001, 'Session ended by owner')
    })
    this.destroyRoom(roomId)
    return true
  }

  removeClientFromRoom(roomId: string, conn: import('ws').WebSocket): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.removeConn(conn)
    console.log(`[room] client left: ${roomId} (${room.connectedClients} remaining)`)

    if (room.connectedClients === 0 && !room.isSharing) {
      this.destroyRoom(roomId)
    }
  }

  private destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return
    room.destroy()
    this.rooms.delete(roomId)
    console.log(`[room] destroyed: ${roomId}`)
  }

  listRooms(): RoomInfo[] {
    return Array.from(this.rooms.values()).map((r) => r.getInfo())
  }
}

export const roomManager = new RoomManager()
