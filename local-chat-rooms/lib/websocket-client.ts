/**
 * WebSocket message types for chat communication
 */
export interface ChatMessage {
  id: string
  username: string
  text: string
  timestamp: Date
}

export interface WebSocketMessage {
  type: "message" | "user-joined" | "user-left" | "history"
  data: ChatMessage | ChatMessage[]
}

/**
 * Connect to a chat room via WebSocket
 * @param roomId - The ID of the chat room
 * @param username - The username of the user joining
 * @returns WebSocket connection
 */
export function createWebSocketConnection(roomId: string, username: string): WebSocket {
  // TODO: Implement WebSocket connection logic
  // Expected URL: ws://localhost:PORT/rooms/{roomId}?username={username}
  // Expected: Server sends chat history on connect
  // Expected: Server broadcasts new messages to all connected clients
  const wsUrl = `ws://localhost:3001/rooms/${roomId}?username=${encodeURIComponent(username)}`
  return new WebSocket(wsUrl)
}

/**
 * Send a chat message through WebSocket
 * @param ws - WebSocket connection
 * @param message - Message text
 * @param username - Username of sender
 */
export function sendChatMessage(ws: WebSocket, message: string, username: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "message",
        data: {
          text: message,
          username,
          timestamp: new Date(),
        },
      }),
    )
  }
}
