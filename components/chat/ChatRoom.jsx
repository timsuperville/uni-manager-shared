import React, { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import useWebSocket from "../../../apps/admin/src/hooks/useWebSocket"; // Adjust path based on where this is used, simpler if we move hook to shared

const ChatRoom = ({ roomId, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const typingTimeoutRef = useRef(null);
  const [input, setInput] = useState("");
  const { isConnected, send, subscribe } = useWebSocket();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch history
    const fetchHistory = async () => {
      try {
        // Assuming useApi hook or global api service is available.
        // Using fetch for now to match project patterns or imported api service
        const response = await fetch(`/api/chat/history/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.ok) {
          const data = await response.json();
          // Merge history with existing messages (avoid duplicates if needed)
          setMessages((prev) => {
            const newIds = new Set(data.data.map((m) => m.id || m._id));
            const uniquePrev = prev.filter((m) => !newIds.has(m.id || m._id));
            return [...data.data, ...uniquePrev];
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to load chat history", err);
        }
      }
    };

    if (roomId) fetchHistory();

    // Subscribe to messages and presence
    const unsubscribe = subscribe("*", (data) => {
      // Handle Presence
      if (data.type === "presence") {
        if (data.action === "update") {
          setOnlineUsers((prev) => {
            const next = new Map(prev);
            if (data.data.status === "online") {
              next.set(data.data.userId, data.data.user);
            } else {
              next.delete(data.data.userId);
            }
            return next;
          });
        } else if (data.action === "list") {
          const userMap = new Map();
          data.data.users.forEach((u) => userMap.set(u.id, u));
          setOnlineUsers(userMap);
        }
      }
      // Handle Room Messages
      else if (data.roomId === roomId || !data.roomId) {
        if (data.action === "typing_start") {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.add(data.senderId);
            return next;
          });
        } else if (data.action === "typing_stop") {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.senderId);
            return next;
          });
        } else if (data.action === "send" || !data.action) {
          setMessages((prev) => [...prev, data]);
        }
      }
    });

    // Request initial online users list
    if (isConnected) {
      send({ type: "system", action: "online-users" });
    }

    return () => unsubscribe();
  }, [roomId, subscribe, isConnected, send]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = (e) => {
    setInput(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      send({
        type: "room",
        action: "typing_start",
        data: { roomId, senderId: user.id },
      });
    }

    typingTimeoutRef.current = setTimeout(() => {
      send({
        type: "room",
        action: "typing_stop",
        data: { roomId, senderId: user.id },
      });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear typing status explicitly
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      send({
        type: "room",
        action: "typing_stop",
        data: { roomId, senderId: user.id },
      });
      typingTimeoutRef.current = null;
    }

    const messageData = {
      type: "room",
      action: "send",
      data: {
        roomId,
        message: input,
        senderId: user.id,
      },
    };

    if (send(messageData)) {
      // Optimistically add message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: input,
          senderId: user.id,
          timestamp: new Date(),
          isOwn: true,
        },
      ]);
      setInput("");
    }
  };

  return (
    <div className="card shadow h-100 d-flex flex-column">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <i className="bi bi-chat-dots me-2"></i>
          Chat
        </h6>
        <div>
          <span
            className="badge bg-info me-2"
            title={Array.from(onlineUsers.values())
              .map((u) => u.name)
              .join("\n")}
          >
            {onlineUsers.size} Online
          </span>
          <span
            className={`badge ${isConnected ? "bg-success" : "bg-warning"} me-2`}
          >
            {isConnected ? "Live" : "Connect..."}
          </span>
          <button
            className="btn btn-sm btn-link text-white p-0"
            onClick={onClose}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <div
        className="card-body bg-light overflow-auto flex-grow-1"
        style={{ maxHeight: "400px" }}
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id || idx}
            message={msg}
            isOwn={msg.isOwn || msg.senderId === user.id}
          />
        ))}
        {typingUsers.size > 0 && (
          <div className="text-muted small fst-italic ms-3 mb-2">
            {Array.from(typingUsers)
              .filter((id) => id !== user.id)
              .join(", ")}{" "}
            is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="card-footer bg-white">
        <form onSubmit={handleSend} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={input}
            onChange={handleTyping}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isConnected}
          >
            <i className="bi bi-send"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
