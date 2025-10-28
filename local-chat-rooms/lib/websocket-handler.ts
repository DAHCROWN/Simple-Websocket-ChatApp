import { roomManager } from "./room-manager"

interface WebSocketMessage {
  type: "join" | "message" | "leave"
  username?: string
  text?: string
  roomId?: string
}

interface WebSocketClient {
  send: (data: string) => void
  close: () => void
}

const roomConnections: Map<string, Set<WebSocketClient>> = new Map()

export function handleWebSocketConnection(ws: WebSocketClient, roomId: string, username: string) {
  // Add client to room
  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Set())
  }
  roomConnections.get(roomId)!.add(ws)

  // Add user to room
  roomManager.addUser(roomId, username)

  // Send existing messages to new client
  const messages = roomManager.getMessages(roomId)
  ws.send(
    JSON.stringify({
      type: "history",
      messages: messages,
    }),
  )

  // Notify others that user joined
  broadcastToRoom(roomId, {
    type: "user-joined",
    username,
    users: roomManager.getUsers(roomId),
  })

  // Handle incoming messages
  const messageHandler = (data: string) => {
    try {
      const message = JSON.parse(data) as WebSocketMessage

      if (message.type === "message" && message.text) {
        const savedMessage = roomManager.addMessage(roomId, username, message.text)
        if (savedMessage) {
          broadcastToRoom(roomId, {
            type: "message",
            id: savedMessage.id,
            username: savedMessage.username,
            text: savedMessage.text,
            timestamp: savedMessage.timestamp,
          })
        }
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error)
    }
  }

  const closeHandler = () => {
    // Remove client from room
    const clients = roomConnections.get(roomId)
    if (clients) {
      clients.delete(ws)
      if (clients.size === 0) {
        roomConnections.delete(roomId)
      }
    }

    // Remove user from room
    roomManager.removeUser(roomId, username)

    // Notify others that user left
    broadcastToRoom(roomId, {
      type: "user-left",
      username,
      users: roomManager.getUsers(roomId),
    })
  }

  // Attach handlers (implementation depends on WebSocket library)
  ;(ws as any).on?.("message", messageHandler)
  ;(ws as any).on?.("close", closeHandler)
}

export function broadcastToRoom(roomId: string, data: any) {
  const clients = roomConnections.get(roomId)
  if (!clients) return

  const message = JSON.stringify(data)
  clients.forEach((client) => {
    try {
      client.send(message)
    } catch (error) {
      console.error("Error broadcasting to client:", error)
    }
  })
}
