import { NextApiRequest } from 'next';
import { NextApiResponseServerIO, initSocketServer } from '@/server/socket'; // Use updated type

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the handler uses the correct types
export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  console.log(`[API Handler] Received request: ${req.method} ${req.url}`); // Log entry

  // Ensure the server object exists
  if (!res.socket || !res.socket.server) {
      console.error('[API Handler] ERROR: Socket or Server object not found on response.');
      res.status(500).json({ error: 'Socket server setup error' });
      return;
  }

  // Check if the server is already initialized on the response object's socket server
  if (!res.socket.server.io) {
    console.log('[API Handler] Socket server not found, initializing...');
    try {
        // Initialize the socket server and attach it
        initSocketServer(req, res);
        console.log('[API Handler] Socket server initialization invoked.');
    } catch (error) {
        console.error('[API Handler] CRITICAL: Error during initSocketServer:', error);
        res.status(500).json({ error: 'Failed to initialize socket server' });
        return; // Don't proceed if init fails
    }
  } else {
    console.log('[API Handler] Socket server already running.');
  }

  console.log('[API Handler] Ending HTTP response.'); // Log before ending
  // End the response for the HTTP request; Socket.IO handles the ongoing connection
  res.end();
}