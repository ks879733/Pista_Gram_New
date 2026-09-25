const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../models/chat');
const Message = require('../models/messages');

router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({participants: userId})
  .populate("participants", "_id username").
  populate({
    path: "lastMessage",
    select: "sender content createdAt",
    populate: {
      path: "sender",
      select: "username"
    }
  }).sort({ updatedAt: -1 });

  res.json({chats});


});

router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  const { chatId } = req.params;

  let {page=1, limit=10} = req.query;
  page = parseInt(page)
  limit = parseInt(limit)

  const messages = await Message.find({ chatId }).populate("sender", "_id username").sort({ createdAt: -1 }).skip((page-1) * limit).limit(limit).lean();

  const hasPreviousMessage = messages.length === limit ? true : false

  res.json({messages, hasPreviousMessage, page, limit});
});

router.post("/createChat", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  const receiverId = req.body.receiverId;
  if(!receiverId) return res.status(400).json({message: "Receiver must require"});

  let chat = await Chat.findOne({participants: { $all: [userId, receiverId], $size: 2 }});

  if(!chat) {
    chat =new Chat({
      participants: [userId, receiverId]
    });
    await chat.save();
  }

  res.status(201).json(chat)
})

router.post("/sendMessages", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  const { content, chatId } = req.body;

  if(!content) return res.status(400).json({message: "Content must required "});

  const chat = await Chat.findById(chatId);
  if(!chat || !chat.participants.includes(userId)){
    return res.status(403).json({message: "Access denied"});
  }

  const newMessage = new Message({
    chatId: chat._id,
    sender: userId,
    content
  });

  await newMessage.save();
  chat.lastMessage = newMessage._id;
  await chat.save();
  const populateMessage = await Message.findById(newMessage._id).populate("sender", "_id username");

  res.status(201).json({ newMessage: populateMessage })
})

module.exports = router