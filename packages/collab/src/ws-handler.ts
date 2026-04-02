import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { WebSocket } from 'ws'
import type { Room } from './room.js'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

export function handleConnection(conn: WebSocket, room: Room): void {
  room.addConn(conn)

  // Send initial sync step 1
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeSyncStep1(encoder, room.doc)
  conn.send(encoding.toUint8Array(encoder))

  // Send current awareness states
  const awarenessStates = room.awareness.getStates()
  if (awarenessStates.size > 0) {
    const awarenessEncoder = awarenessProtocol.encodeAwarenessUpdate(
      room.awareness,
      Array.from(awarenessStates.keys())
    )
    conn.send(Buffer.from(awarenessEncoder))
  }

  conn.on('message', (data: ArrayBuffer) => {
    try {
      const message = new Uint8Array(data)
      const decoder = decoding.createDecoder(message)
      const messageType = decoding.readVarUint(decoder)

      switch (messageType) {
        case MESSAGE_SYNC: {
          const responseEncoder = encoding.createEncoder()
          encoding.writeVarUint(responseEncoder, MESSAGE_SYNC)
          syncProtocol.readSyncMessage(decoder, responseEncoder, room.doc, conn)
          if (encoding.length(responseEncoder) > 1) {
            conn.send(encoding.toUint8Array(responseEncoder))
          }
          break
        }
        case MESSAGE_AWARENESS: {
          const update = decoding.readVarUint8Array(decoder)
          awarenessProtocol.applyAwarenessUpdate(room.awareness, update, conn)
          break
        }
      }
    } catch (err) {
      console.error(`[ws] message error in room ${room.roomId}:`, err)
    }
  })

  // Broadcast doc updates to all other connections
  const updateHandler = (update: Uint8Array, origin: unknown) => {
    if (origin === conn) return
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    if (conn.readyState === conn.OPEN) {
      conn.send(encoding.toUint8Array(encoder))
    }
  }
  room.doc.on('update', updateHandler)

  conn.on('close', () => {
    room.doc.off('update', updateHandler)
  })
}
