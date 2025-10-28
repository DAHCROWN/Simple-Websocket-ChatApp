"use client";

import { useState } from "react";
import RoomDiscovery from "@/components/room-discovery";
import JoinRoom from "@/components/join-room";
import ChatInterface from "@/components/chat-interface";

type AppState = "discovery" | "join" | "chat";

interface Room {
	id: string;
	name: string;
}

interface ChatSession {
	room: Room;
	username: string;
}

export default function Home() {
	const [state, setState] = useState<AppState>("discovery");
	const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
	const [chatSession, setChatSession] = useState<ChatSession | null>(null);

	const handleRoomSelect = (room: Room) => {
		setSelectedRoom(room);
		setState("join");
	};

	const handleJoinRoom = (username: string) => {
		if (selectedRoom) {
			setChatSession({
				room: selectedRoom,
				username,
			});
			setState("chat");
		}
	};

	const handleLeaveChat = () => {
		setChatSession(null);
		setSelectedRoom(null);
		setState("discovery");
	};

	return (
		<main className="h-screen bg-background">
			{state === "discovery" && (
				<RoomDiscovery onRoomSelect={handleRoomSelect} />
			)}
			{state === "join" && selectedRoom && (
				<JoinRoom room={selectedRoom} onJoin={handleJoinRoom} />
			)}
			{state === "chat" && chatSession && (
				<ChatInterface session={chatSession} onLeave={handleLeaveChat} />
			)}
		</main>
	);
}
