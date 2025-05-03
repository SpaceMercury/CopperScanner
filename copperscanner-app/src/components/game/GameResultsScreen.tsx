import React from "react";

interface UserFlightInfo {
  id: string;
  name: string;
  flight: string; // You can expand this to an object if needed
  // Add more fields as needed
}

interface GameResultsScreenProps {
  users: UserFlightInfo[];
  onRunLLM: () => void;
  llmResult?: string; // Placeholder for LLM output
}

export const GameResultsScreen: React.FC<GameResultsScreenProps> = ({ users, onRunLLM, llmResult }) => {
  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <h1>Game Results</h1>
      <h2>Players & Flights</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {users.map((user) => (
          <li key={user.id} style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
            <strong>{user.name}</strong>
            <div>Flight: {user.flight}</div>
            {/* Add more user info here */}
          </li>
        ))}
      </ul>
      <button onClick={onRunLLM} style={{ marginTop: 24, padding: "10px 24px", fontSize: 16, borderRadius: 8, background: "#1976d2", color: "#fff", border: "none", cursor: "pointer" }}>
        Run LLM & Functions
      </button>
      {llmResult && (
        <div style={{ marginTop: 32, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h3>LLM Result</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{llmResult}</pre>
        </div>
      )}
    </div>
  );
};
