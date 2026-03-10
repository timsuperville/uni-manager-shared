import React from "react";

/** Thin horizontal menu separator. */
export default function MenuDivider() {
  return (
    <div
      role="separator"
      style={{
        height: "1px",
        background: "var(--glass-outline)",
        margin: "4px 8px",
      }}
    />
  );
}
