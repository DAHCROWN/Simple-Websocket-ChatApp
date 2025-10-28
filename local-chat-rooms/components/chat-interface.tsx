"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, LogOut } from "lucide-react";
import { io } from "socket.io-client";
import "dotenv/config";

interface Message {
	id: string;
	username: string;
	text: string;
	timestamp: Date;
}

interface ChatSession {
	room: {
		id: string;
		name: string;
	};
	username: string;
}

interface ChatInterfaceProps {
	session: ChatSession;
	onLeave: () => void;
}

export default function ChatInterface({
	session,
	onLeave,
}: ChatInterfaceProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const connectWebSocket = async () => {
			try {
				setLoading(true);
				// TODO: Implement WebSocket connection
				// Expected: Connect to ws://localhost:PORT/rooms/{roomId}
				// Expected: Send initial message with username
				// Expected: Listen for incoming messages
				// const ws = await connectToRoom(session.room.id, session.username);
				// wsRef.current = ws;

				//* My implementation
				const socket = io(`http://localhost:${process.env.WS_PORT}`);

				// socket.on("chat-message", (data) => {
				// 	appendMessage(`${data.name}: ${data.message}`);
				// });

				// socket.on("user-connected", (name) => {
				// 	appendMessage(`${name} connected`);
				// });

				// socket.on("user-disconnected", (name) => {
				// 	appendMessage(`${name} disconnected`);
				// });
			} catch (err) {
				setError("Failed to connect to chat room");
				console.error("Error connecting to room:", err);
			} finally {
				setLoading(false);
			}
		};

		connectWebSocket();

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, [session.room.id, session.username]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!inputValue.trim()) return;

		try {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				const message = {
					text: inputValue,
					username: session.username,
					timestamp: new Date(),
				};
				wsRef.current.send(JSON.stringify(message));
				setInputValue("");
			} else {
				setError("Not connected to chat room");
			}
		} catch (err) {
			setError("Failed to send message");
			console.error("Error sending message:", err);
		}
	};

	const handleLeave = async () => {
		try {
			if (wsRef.current) {
				wsRef.current.close();
			}
			await leaveChatRoom(session.room.id, session.username);
			onLeave();
		} catch (err) {
			console.error("Error leaving room:", err);
			onLeave();
		}
	};

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="border-b border-border bg-card px-6 py-4">
				<div className="flex items-center justify-between max-w-4xl mx-auto">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							{session.room.name}
						</h1>
						<p className="text-sm text-muted-foreground">
							Joined as {session.username}
						</p>
					</div>
					<Button
						onClick={handleLeave}
						variant="outline"
						size="sm"
						className="gap-2 bg-transparent"
					>
						<LogOut className="w-4 h-4" />
						Leave
					</Button>
				</div>
			</div>

			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto px-6 py-4">
				<div className="max-w-4xl mx-auto space-y-4">
					{loading && (
						<div className="text-center py-8">
							<p className="text-muted-foreground">Connecting to chat...</p>
						</div>
					)}

					{error && (
						<Card className="p-4 bg-destructive/10 border-destructive/20">
							<p className="text-destructive text-sm">{error}</p>
						</Card>
					)}

					{messages.length === 0 && !loading && (
						<div className="text-center py-12">
							<p className="text-muted-foreground">
								No messages yet. Start the conversation!
							</p>
						</div>
					)}

					{messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${
								message.username === session.username
									? "justify-end"
									: "justify-start"
							}`}
						>
							<div
								className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
									message.username === session.username
										? "bg-primary text-primary-foreground"
										: "bg-muted text-foreground"
								}`}
							>
								{message.username !== session.username && (
									<p className="text-xs font-semibold mb-1 opacity-75">
										{message.username}
									</p>
								)}
								<p className="break-words">{message.text}</p>
								<p className="text-xs mt-1 opacity-70">
									{new Date(message.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Message Input */}
			<div className="border-t border-border bg-card px-6 py-4">
				<form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
					<div className="flex gap-2">
						<Input
							type="text"
							placeholder="Type a message..."
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							disabled={loading || !wsRef.current}
							className="flex-1"
						/>
						<Button
							type="submit"
							disabled={loading || !inputValue.trim() || !wsRef.current}
							className="bg-primary hover:bg-primary/90 gap-2"
						>
							<Send className="w-4 h-4" />
							<span className="hidden sm:inline">Send</span>
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

async function connectToRoom(
	roomId: string,
	username: string
): Promise<WebSocket> {
	return new Promise((resolve, reject) => {
		try {
			const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			const wsUrl = `${protocol}//${
				window.location.host
			}/api/ws?roomId=${roomId}&username=${encodeURIComponent(username)}`;
			const ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				resolve(ws);
			};

			ws.onerror = () => {
				reject(new Error("WebSocket connection failed"));
			};
		} catch (error) {
			reject(error);
		}
	});
}

async function leaveChatRoom(roomId: string, username: string): Promise<void> {
	try {
		const response = await fetch(`/api/rooms/${roomId}/leave`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username }),
		});
		if (!response.ok) throw new Error("Failed to leave room");
	} catch (error) {
		console.error("Error leaving room:", error);
		throw error;
	}
}
