import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import type { WebSocket } from 'ws'

export interface RoomInfo {
  roomId: string
  ownerId: string | null
  isSharing: boolean
  createdAt: number
  connectedClients: number
}

export class Room {
  readonly roomId: string
  readonly doc: Y.Doc
  readonly awareness: awarenessProtocol.Awareness
  readonly conns: Map<WebSocket, Set<number>>
  ownerId: string | null = null
  isSharing: boolean = true
  readonly createdAt: number

  constructor(roomId: string) {
    this.roomId = roomId
    this.doc = new Y.Doc()
    this.awareness = new awarenessProtocol.Awareness(this.doc)
    this.conns = new Map()
    this.createdAt = Date.now()

    this.awareness.setLocalState(null)

    this.awareness.on('update', ({ added, updated, removed }: {
      added: number[]
      updated: number[]
      removed: number[]
    }) => {
      const changedClients = added.concat(updated, removed)
      const encoder = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        changedClients
      )
      const message = Buffer.from(encoder)
      this.conns.forEach((_, conn) => {
        if (conn.readyState === conn.OPEN) {
          conn.send(message)
        }
      })
    })
  }

  addConn(conn: WebSocket): void {
    this.conns.set(conn, new Set())
  }

  removeConn(conn: WebSocket): void {
    const controlledIds = this.conns.get(conn)
    if (controlledIds) {
      this.conns.delete(conn)
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        Array.from(controlledIds),
        null
      )
    }
  }

  get connectedClients(): number {
    return this.conns.size
  }

  getInfo(): RoomInfo {
    return {
      roomId: this.roomId,
      ownerId: this.ownerId,
      isSharing: this.isSharing,
      createdAt: this.createdAt,
      connectedClients: this.connectedClients,
    }
  }

  destroy(): void {
    this.awareness.destroy()
    this.doc.destroy()
  }
}
