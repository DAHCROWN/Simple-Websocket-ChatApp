const { Server } = require("socket.io");
import "dotenv/config";
// import eiows from "eiows";

async function main() {
	try {
		console.log("Starting Websocket Server...");
		const io = new Server(process.env.WS_PORT, {
			cors: {
				origin: "http://localhost:3000",
				methods: ["GET", "POST"],
			},
		});
		console.log("Started Websocket Server !");

		io.on("connection", (socket) => {
			console.log("New Connection: ", socket.id);
			socket.on("new-user", (name: string, chatRoomId: number) => {
				console.log(
					`New User Joined. Name: ${name}, ChatRoomId: ${chatRoomId}`
				);
				const newUser: User = {
					socketId: socket.id,
					name: name,
					chatRoomId: chatRoomId,
				};
				users.push(newUser);
				socket.join(chatRoomId.toString());
				socket.to(chatRoomId.toString()).emit("user-connected", name);
			});

			socket.on("send-chat-message", (message: string) => {
				console.log(`New Message from ${socket.id}`);
				const _user = getUserDetails(socket.id);
				socket.to(_user.chatRoomId).emit("chat-message", {
					message: message,
					name: _user.name,
				});
			});

			socket.on("disconnect", () => {
				console.log(`User ${socket.id} disconnected`);
				const _user = getUserDetails(socket.id);

				socket.to(_user.chatRoomId).emit("user-disconnected", users[socket.id]);
				delete users[socket.id];
			});
		});
	} catch (error) {
		console.error("Error starting WS server", error);
	}
}

main();

type User = {
	chatRoomId: number;
	socketId: string;
	name: string;
};
const users: User[] = [];

function getUserDetails(socketId: string): {
	name: string;
	chatRoomId: number;
} {
	const user = users.filter((user) => user.socketId === socketId);
	if (user && user[0])
		return {
			name: user[0].name,
			chatRoomId: user[0].chatRoomId,
		};
	return {
		name: "unknown",
		chatRoomId: 1,
	};
}
