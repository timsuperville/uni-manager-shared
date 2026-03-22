import React, { useRef, useState, useEffect } from "react";
import { Button } from "./Button";

export interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
}

export function SignaturePad({ value, onChange, required }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Initialize canvas correctly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a fixed size for the drawing buffer, scale via CSS
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 150;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "var(--text-primary, #ffffff)";

    // If there's an existing signature (from profile/form data), draw it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setIsEmpty(false);

    // Save state
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange("");
  };

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${isEmpty && required ? "var(--color-error-base, #f87171)" : "rgba(255,255,255,0.15)"}`,
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-[150px] touch-none cursor-crosshair"
          style={{ display: "block" }}
        />
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span
              style={{ color: "var(--text-muted)" }}
              className="text-sm select-none"
            >
              Draw your signature here
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-1">
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
        >
          Clear Signature
        </button>
      </div>
    </div>
  );
}
