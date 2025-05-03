import { io, Socket } from 'socket.io-client';

// This maintains a singleton instance of the socket connection
let socket: Socket | null = null;
let socketInitialized = false;

// Initialize the socket server by calling the API endpoint
export const initializeSocket = async (): Promise<void> => {
  if (socketInitialized) return;
  
  try {
    await fetch('/api/socket');
    socketInitialized = true;
    console.log('Socket server initialized');
  } catch (error) {
    console.error('Failed to initialize socket server:', error);
  }
};

export const getSocketInstance = (): Socket => {
  if (!socket) {
    // Ensure this runs only on the client
    if (typeof window !== "undefined") {
      console.log("[Socket Client] Initializing new instance...");
      socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "",
        {
          path: "/api/socket",
          transports: ["websocket"], // Force websocket only for Render compatibility
          withCredentials: true,
        }
      );

      // Log basic connection events for debugging
      socket.on("connect", () => {
        console.log(`[Socket Client] Connected successfully. ID: ${socket?.id}`);
      });
      socket.on("disconnect", (reason) => {
        console.warn(`[Socket Client] Disconnected. Reason: ${reason}`);
        // If the disconnection was not initiated by the client, try to reconnect manually or alert user
        if (reason === "io server disconnect") {
          // The server explicitly disconnected the socket
          console.error("[Socket Client] Disconnected by server.");
          // Optionally, attempt reconnection after a delay
          // socket.connect();
        } else if (reason === "transport close") {
          console.warn("[Socket Client] Connection lost (transport close). Reconnection might be attempted based on config.");
        }
        // Handle other reasons: "io client disconnect", "ping timeout", "transport error"
      });
      socket.on("connect_error", (err) => {
        // This logs errors during the *connection attempt*
        console.error("[Socket Client] Connection Error!");
        console.error(`  Message: ${err.message}`);
        // err.cause might provide more context in some cases
        if (err.cause) {
          console.error(`  Cause: ${err.cause}`);
        }
        // The 'context' might be available depending on the error type
        // console.error(`  Context: ${err.context}`);
        // alert("Failed to connect to the server. Please check your connection and try again."); // Optional user feedback
      });

      console.log("[Socket Client] Instance created, awaiting manual connection.");
    } else {
      // This should not happen in the browser context where this is called
      console.error("[Socket Client] ERROR: Attempted to initialize socket client on the server side!");
      // Throw an error to make it clear if this path is ever hit
      throw new Error("Cannot initialize socket client outside of a browser environment.");
    }
  } else {
    // console.log("[Socket Client] Returning existing instance."); // Can be noisy, uncomment if needed
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketInitialized = false;
  }
};