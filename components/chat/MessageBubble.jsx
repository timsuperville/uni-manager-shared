import React from "react";

const MessageBubble = ({ message, isOwn }) => {
  return (
    <div
      className={`d-flex mb-3 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
    >
      <div
        className={`card border-0 shadow-sm ${isOwn ? "bg-primary text-white" : "bg-light"}`}
        style={{ maxWidth: "75%", borderRadius: "1rem" }}
      >
        <div className="card-body py-2 px-3">
          <p className="mb-0 small">{message.content}</p>
        </div>
        <div
          className={`card-footer border-0 py-1 px-3 ${isOwn ? "bg-primary text-white-50" : "bg-light text-muted"}`}
          style={{ borderRadius: "0 0 1rem 1rem" }}
        >
          <small style={{ fontSize: "0.7em" }}>
            {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
