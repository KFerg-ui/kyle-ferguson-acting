import { useState, useRef, useCallback } from "react";

const GOLD = "#c9a227";

export default function DropZone({ onFileSelect, isLoading, loadingMsg }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]);
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => {
        if (!isLoading && inputRef.current) {
          inputRef.current.value = ""; // Reset before opening so re-uploading same file works
          inputRef.current.click();
        }
      }}
      style={{
        border: `2px dashed ${dragOver ? GOLD : "#444"}`,
        borderRadius: 8,
        padding: "40px 20px",
        textAlign: "center",
        cursor: isLoading ? "default" : "pointer",
        background: dragOver ? "rgba(201,162,39,0.05)" : "transparent",
        transition: "all 0.3s ease",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
      />
      {isLoading ? (
        <div>
          <div
            style={{
              fontSize: 36,
              marginBottom: 14,
              animation: "pulse 1.4s ease infinite",
            }}
          >
            📜
          </div>
          <p style={{ color: GOLD, fontSize: 15, fontWeight: 700 }}>
            {loadingMsg || "Parsing..."}
          </p>
          <p style={{ color: "#777", fontSize: 12, marginTop: 6 }}>
            This may take a moment
          </p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🎭</div>
          <p
            style={{
              color: "#eee",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Drop your script here
          </p>
          <p style={{ color: "#888", fontSize: 13 }}>PDF, DOCX, or TXT</p>
        </div>
      )}
    </div>
  );
}
