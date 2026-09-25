import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Check,
  Loader2,
  MessageCircle,
  Search,
  UserPlus,
} from "lucide-react";
import MainLayout from "../components/MainLayout";
import ChatBox from "../components/ChatBox";
import api from "../lib/api";

const SOCKET_URL = "https://pista-gram-new-1.onrender.com";

/*
  Messages page flow:

  1. Get the logged-in user.
  2. Get everyone the user follows.
  3. Get already-created chats.
  4. Show followed users even when a chat has not been created yet.
  5. When a user is selected, create/get the chat using the existing
     POST /api/chats/createChat API.
  6. Join the chat's Socket.IO room.
  7. Load old messages from the existing messages API.
  8. Listen for getMessage so new messages arrive without refreshing.
*/

const Message = () => {
  const [me, setMe] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Connect to Socket.IO once.
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("errorInSendMessage", (message) => {
      setError(message || "Message could not be sent.");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load current user, following list and existing chats.
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [meResponse, followingResponse, chatResponse] =
          await Promise.all([
            api.get("/user"),
            api.get("/user/following"),
            api.get("/chats"),
          ]);

        setMe(meResponse.data);

        const following = followingResponse.data.following || [];
        const existingChats = chatResponse.data.chats || [];

        setFollowingUsers(following);
        setChats(existingChats);
      } catch (err) {
        console.error("Messages load error:", err);
        setError(
          err.response?.data?.message || "Unable to load messages."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
    Existing chats may contain people that are no longer in the following
    list. Keep those chats too, because a previous conversation should
    remain available.
  */
  const conversations = useMemo(() => {
    const result = [];
    const usedUserIds = new Set();

    // First show users we currently follow.
    followingUsers.forEach((user) => {
      const existingChat = chats.find((chat) =>
        chat.participants?.some(
          (participant) =>
            participant._id?.toString() === user._id?.toString()
        )
      );

      result.push({
        user,
        chat: existingChat || null,
      });

      usedUserIds.add(user._id.toString());
    });

    // Then show old chats whose other participant is not currently followed.
    chats.forEach((chat) => {
      const other = chat.participants?.find(
        (participant) =>
          participant._id?.toString() !== me?._id?.toString()
      );

      if (other && !usedUserIds.has(other._id.toString())) {
        result.push({
          user: other,
          chat,
        });
      }
    });

    return result;
  }, [followingUsers, chats, me]);

  const filteredConversations = conversations.filter(({ user }) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return (
      user.username?.toLowerCase().includes(value) ||
      user.profileName?.toLowerCase().includes(value)
    );
  });

  // Register this browser with the backend's private user room.
  // The backend uses this room to notify us about a message in a chat
  // that we have not opened yet.
  useEffect(() => {
    if (!socket || !me) return;

    socket.emit("registerUser", me._id);
  }, [socket, me]);

  /*
    Join all existing chat rooms as soon as the socket is connected.
    This is important: if another user sends a message while this page
    is open, we can receive it even when that chat is not selected.
  */
  useEffect(() => {
    if (!socket || !chats.length) return;

    chats.forEach((chat) => {
      socket.emit("joinRoom", chat._id);
    });
  }, [socket, chats]);

  /*
    Listen globally for new messages.
    "getMessage" is used for an open chat room.
    "newChatMessage" is used when the user has not opened that room yet.
  */
  useEffect(() => {
    if (!socket) return;

    const addMessageToOpenChat = (message) => {
      if (!message?.chatId) return;

      setMessages((oldMessages) => {
        if (
          selected &&
          message.chatId.toString() === selected._id.toString()
        ) {
          if (oldMessages.some((item) => item._id === message._id)) {
            return oldMessages;
          }

          return [message, ...oldMessages];
        }

        return oldMessages;
      });
    };

    const receiveMessage = (message) => {
      addMessageToOpenChat(message);

      // Update the sidebar preview.
      setChats((oldChats) =>
        oldChats.map((chat) =>
          chat._id.toString() === message.chatId.toString()
            ? {
                ...chat,
                lastMessage: message,
                updatedAt: message.createdAt,
              }
            : chat
        )
      );
    };

    const receiveNewChatMessage = async (message) => {
      addMessageToOpenChat(message);

      // The receiver may not have had this chat in the sidebar yet.
      // Reloading /chats uses the existing backend API and gives us the
      // correct participants and lastMessage.
      try {
        const response = await api.get("/chats");
        setChats(response.data.chats || []);
      } catch (err) {
        console.error("Unable to refresh chats:", err);
      }
    };

    socket.on("getMessage", receiveMessage);
    socket.on("newChatMessage", receiveNewChatMessage);

    return () => {
      socket.off("getMessage", receiveMessage);
      socket.off("newChatMessage", receiveNewChatMessage);
    };
  }, [socket, selected]);

  /*
    Select a person.

    If the chat already exists -> use it.
    If not -> call the backend's createChat API.
  */
  const openConversation = async (person) => {
    try {
      setChatLoading(true);
      setError("");

      let chat = chats.find((item) =>
        item.participants?.some(
          (participant) =>
            participant._id?.toString() === person._id?.toString()
        )
      );

      if (!chat) {
        const response = await api.post("/chats/createChat", {
          receiverId: person._id,
        });

        chat = response.data;

        // createChat returns the chat without populated participants.
        chat.participants = [me, person];

        setChats((oldChats) => [chat, ...oldChats]);
      }

      // Make sure this socket joins the correct room.
      socket?.emit("joinRoom", chat._id);

      setSelected(chat);

      const response = await api.get(
        `/chats/${chat._id}/messages?page=1&limit=50`
      );

      setMessages(response.data.messages || []);
    } catch (err) {
      console.error("Open chat error:", err);
      setError(
        err.response?.data?.message || "Unable to open conversation."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = (content) => {
    if (!socket || !selected || !me) return;

    setError("");

    socket.emit("sendMessage", {
      userId: me._id,
      content,
      chatId: selected._id,
    });
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid min-h-[680px] md:grid-cols-[330px_1fr]">
            {/* Conversation list */}
            <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-50 text-pink-500">
                    <MessageCircle />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black">Messages</h1>
                    <p className="text-sm text-slate-400">
                      Chat with people you follow
                    </p>
                  </div>
                </div>

                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-xl bg-slate-100 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              </div>

              <div className="max-h-[570px] overflow-y-auto p-3">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </div>
                ) : filteredConversations.length ? (
                  filteredConversations.map(({ user, chat }) => {
                    const isSelected =
                      selected &&
                      chat &&
                      selected._id?.toString() === chat._id?.toString();

                    return (
                      <button
                        key={user._id}
                        onClick={() => openConversation(user)}
                        disabled={chatLoading}
                        className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                          isSelected
                            ? "bg-pink-50 ring-1 ring-pink-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-purple-500 font-bold text-white">
                          {(user.username || "U")[0].toUpperCase()}
                          {chat && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900">
                            @{user.username}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {chat?.lastMessage?.content ||
                              "Start a conversation"}
                          </p>
                        </div>

                        {!chat && (
                          <UserPlus className="h-4 w-4 shrink-0 text-pink-500" />
                        )}

                        {chat?.lastMessage && (
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-600">
                      No people to message
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Follow someone from Explore first.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* Chat */}
            <section className="min-w-0">
              {error && (
                <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {chatLoading ? (
                <div className="grid h-[620px] place-items-center text-slate-400">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-500" />
                    <p className="mt-3">Opening conversation...</p>
                  </div>
                </div>
              ) : (
                <ChatBox
                  socket={socket}
                  chat={selected}
                  currentUser={me}
                  messages={messages}
                  onSend={sendMessage}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Message;
