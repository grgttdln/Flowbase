import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { roomManager } from './room-manager.js'
import { handleConnection } from './ws-handler.js'
import { isValidRoomId } from './utils.js'

const PORT = parseInt(process.env.PORT || '4444', 10)
const HOST = process.env.HOST || '0.0.0.0'

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ status: 'ok', rooms: roomManager.listRooms().length }))
    return
  }

  if (req.url === '/rooms') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify(roomManager.listRooms()))
    return
  }

  // GET /rooms/:roomId — room info or 404
  const roomIdMatch = req.url?.match(/^\/rooms\/([A-Za-z0-9_-]{12})$/)
  if (roomIdMatch && req.method === 'GET') {
    const info = roomManager.getRoomInfo(roomIdMatch[1])
    if (info) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end(JSON.stringify(info))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end(JSON.stringify({ error: 'Room not found' }))
    }
    return
  }

  // DELETE /rooms/:roomId — close room
  if (roomIdMatch && req.method === 'DELETE') {
    const closed = roomManager.closeRoom(roomIdMatch[1])
    res.writeHead(closed ? 200 : 404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ closed }))
    return
  }

  // Handle CORS preflight for DELETE
  if (roomIdMatch && req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Flowbase Collaboration Server')
})

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  // Extract room ID from URL: /rooms/{roomId}
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts.length !== 2 || parts[0] !== 'rooms') {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
    socket.destroy()
    return
  }

  const roomId = parts[1]

  if (!isValidRoomId(roomId)) {
    socket.write('HTTP/1.1 400 Invalid Room ID\r\n\r\n')
    socket.destroy()
    return
  }

  // Check if room exists and sharing is stopped
  const existingRoom = roomManager.getRoom(roomId)
  if (existingRoom && !existingRoom.isSharing) {
    socket.write('HTTP/1.1 410 Session Ended\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, roomId)
  })
})

wss.on('connection', (conn: any, _req: any, roomId: string) => {
  const room = roomManager.getOrCreateRoom(roomId)
  console.log(`[ws] client connected to room: ${roomId} (${room.connectedClients + 1} clients)`)

  handleConnection(conn, room)

  conn.on('close', () => {
    roomManager.removeClientFromRoom(roomId, conn)
  })

  conn.on('error', (err: any) => {
    console.error(`[ws] connection error in room ${roomId}:`, err)
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[collab] server running at ws://${HOST}:${PORT}`)
  console.log(`[collab] health check: http://${HOST}:${PORT}/health`)
})
