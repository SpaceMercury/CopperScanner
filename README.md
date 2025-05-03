**CopperScanner** is a collaborative trip planning web app built with Next.js, React, and Socket.IO. Users can create or join rooms, suggest travel destinations, chat, and vote in real time.

---

## Features

- **Create/Join Rooms:** Users can create a new planning room or join an existing one with a unique room ID.
- **Real-Time Communication:** All actions (chat, voting, destination suggestions) are synced instantly using Socket.IO.
- **Suggest Destinations:** Hosts can add new travel destinations for the group to consider.
- **Voting:** All users can vote for their favorite destinations.
- **Chat:** Built-in chat for group discussion.

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS (UI components)
- **Backend:** Next.js API routes (Socket.IO server)
- **Real-Time:** Socket.IO (WebSocket + polling fallback)
- **State Management:** Zustand

---

## How It Works

1. **Home Page:**
   - Enter your name.
   - Create a new room (generates a unique ID) or join an existing room by ID.

2. **Room Page:**
   - See the list of players in the room.
   - Hosts can add new destinations (name, country, price).
   - All users can vote for destinations (one vote per destination).
   - Chat with other users in real time.

3. **Real-Time Sync:**
   - All actions (join/leave, chat, voting, destination suggestions) are broadcast to all connected clients instantly.

---

## Development

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Setup

```bash
cd copperscanner-app
npm install
```

### Running Locally

```bash
npm run dev
```

- App runs at http://localhost:3000
- Open multiple tabs or browsers to test real-time features.

---

## Notes

- The Socket.IO server is implemented in a Next.js API route (`/api/socket`).
- All room and chat data is stored in-memory (not persistent).
- CORS and transport fallback are configured for local development.

---

## File Structure

- `/src/app` — Next.js App Router pages (UI)
- `/src/pages/api/socket.ts` — Socket.IO API route (server)
- `/src/server/socket.ts` — Socket.IO server logic
- `/src/lib/socket-client.ts` — Socket.IO client logic
- `/src/lib/state/game-store.ts` — Zustand state management

---

## Customization

- To persist rooms/messages, connect to a database and update the server logic.
- To deploy, ensure your hosting supports WebSockets (Vercel’s serverless functions do **not**).

---

## License

MIT
=======
