import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

const ChatBox = ({ socket, chat, currentUser, messages, onSend }) => {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const show = (message) => setTyping(message);
    const hide = () => setTyping("");

    socket.on("showTyping", show);
    socket.on("hideTyping", hide);

    return () => {
      socket.off("showTyping", show);
      socket.off("hideTyping", hide);
    };
  }, [socket]);

  if (!chat) {
    return (
      <div className="grid h-full place-items-center p-8 text-center text-slate-400">
        <div>
          <p className="text-lg font-semibold">Select a conversation</p>
          <p className="mt-1 text-sm">
            Your real-time messages will appear here.
          </p>
        </div>
      </div>
    );
  }

  const receiver = chat.participants?.find(
    (user) => user._id?.toString() !== currentUser?._id?.toString(),
  );

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    socket?.emit("stopTyping", {
      chatId: chat._id,
      username: currentUser.username,
    });
  };

  const changeText = (value) => {
    setText(value);
    if (!socket) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: chat._id,
        username: currentUser.username,
      });
    } else {
      socket.emit("stopTyping", {
        chatId: chat._id,
        username: currentUser.username,
      });
    }
  };

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="font-bold">@{receiver?.username || "Chat"}</p>
        <p className="text-xs text-slate-400">
          {typing || "Online conversation"}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
        {messages
          .slice()
          .reverse()
          .map((message) => {
            const mine =
              message.sender?._id?.toString() === currentUser?._id?.toString();

            return (
              <div
                key={message._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    mine
                      ? "rounded-br-sm bg-pink-500 text-white"
                      : "rounded-bl-sm bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  <p>{message.content}</p>

                  <p
                    className={`mt-1 text-right text-xs font-semibold ${
                      mine ? "text-pink-100" : "text-slate-400"
                    }`}
                  >
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex gap-2 border-t border-slate-200 bg-white p-4"
      >
        <input
          value={text}
          onChange={(e) => changeText(e.target.value)}
          placeholder="Write a message..."
          className="min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-200"
        />
        <button className="rounded-xl bg-pink-500 px-4 text-white hover:bg-pink-600">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
