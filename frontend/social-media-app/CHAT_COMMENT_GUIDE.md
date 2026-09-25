# PistaGram Chat + Comments Guide

## Chat flow

The Messages page uses the existing backend APIs:

1. `GET /api/user` -> current logged-in user.
2. `GET /api/user/following` -> people the current user follows.
3. `GET /api/chats` -> old conversations.
4. `POST /api/chats/createChat` -> creates a chat only when it does not already exist.
5. `GET /api/chats/:chatId/messages` -> loads old messages.
6. Socket.IO `joinRoom` -> joins the selected chat room.
7. Socket.IO `sendMessage` -> saves the message through the existing socket handler.
8. Socket.IO `getMessage` -> updates an open conversation immediately.
9. Socket.IO `newChatMessage` -> tells a user that a new message arrived even when that conversation was not selected.

The sidebar first shows people the user follows. Existing old chats are also kept in the list.

## Comment flow

The post comment UI uses the existing APIs:

- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments/:commentId/replies`

The frontend reloads the comment list after adding a comment or reply, so the displayed data comes from MongoDB instead of fake local data.

## Beginner-friendly code

The main logic is intentionally kept in:

- `src/pages/Message.jsx`
- `src/components/ChatBox.jsx`
- `src/components/Comment.jsx`

No Redux or complicated state management is used.

## One backend bug fixed

The post `GET /following` and `GET /followers` routes are GET requests, so their optional `cursor` is read from `req.query`, not `req.body`.

The comments GET response also populates reply authors so reply usernames can be displayed.
