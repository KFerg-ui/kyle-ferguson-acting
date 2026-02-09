const BTN_SECONDARY = {
  padding: "9px 18px",
  borderRadius: 5,
  border: "1px solid #444",
  background: "transparent",
  color: "#aaa",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  textTransform: "uppercase",
};

export default function CharacterStep({ characters, formatInfo, onSelect }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎭</div>
        <p
          style={{
            fontSize: 16,
            color: "#eee",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Who are you playing?
        </p>
        <p style={{ fontSize: 12, color: "#888" }}>
          {characters.length} characters detected
          {formatInfo && <span> · {formatInfo}</span>}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        {characters.map((char) => (
          <button
            key={char}
            onClick={() => onSelect(char)}
            style={BTN_SECONDARY}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
