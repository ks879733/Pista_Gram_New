const express = require('express');
const mongoose = require('mongoose');
require("dotenv").config();
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const userRouter = require('./router/user');
const postRouter = require('./router/post');
const chatsRouter = require('./router/chat');
const cookieParser = require('cookie-parser');

const Chat = require("./models/chat");
const Message = require("./models/messages");

const app = express();
const server = http.createServer(app);

// Socket.IO: only the CORS configuration is changed here.
// The existing socket event names and message logic are kept unchanged.
const io = new Server(server, {
  cors: {
    origin: "https://pista-gram-new-1.onrender.com",
    methods: ["GET", "POST"],
    credentials: true
  }
});

mongoose.connect(process.env.MONGO_DB_URI)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Database connection failed", err));

app.use(cors({
  origin: "https://pista-gram-new-1.onrender.com",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use("/api/user", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/chats", chatsRouter);

io.on("connection", (socket) => {
  console.log("A user connected");

  // Each connected frontend also joins a private user room.
  // This lets a user receive a new-chat/message notification even when
  // they have not opened that conversation yet.
  socket.on("registerUser", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId.toString()}`);
    console.log(`User ${socket.id} registered as ${userId}`);
  });

  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined room ${chatId}`);
  });

  socket.on("typing", ({ chatId, username }) => {
    socket.to(chatId).emit("showTyping", `${username} is typing...`);
  });

  socket.on("stopTyping", ({ chatId, username }) => {
    socket.to(chatId).emit("hideTyping", username);
  });

  socket.on("sendMessage", async ({ userId, content, chatId }) => {
    try {
      if (!content || !content.trim()) {
        socket.emit("errorInSendMessage", "Content must required ");
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(userId)) {
        socket.emit("errorInSendMessage", "Access Denied");
        return;
      }

      const newMessage = new Message({
        chatId: chat._id,
        sender: userId,
        content
      });

      await newMessage.save();
      chat.lastMessage = newMessage._id;
      await chat.save();

      const populateMessage = await Message.findById(newMessage._id)
        .populate("sender", "_id username");

      // Send the message to everyone currently inside the chat room.
      io.to(chatId).emit("getMessage", populateMessage);

      // Also notify every participant through their private user room.
      // This covers the case where the recipient is on the Messages page
      // but has not opened this conversation yet.
      chat.participants.forEach((participantId) => {
        io.to(`user:${participantId.toString()}`).emit(
          "newChatMessage",
          populateMessage
        );
      });
    } catch (error) {
      console.error(error);
      socket.emit("errorInSendMessage", "Message send failed");
    }
  });
});

server.listen(5000, () => {
  console.log("Server is running on :5000");
});
