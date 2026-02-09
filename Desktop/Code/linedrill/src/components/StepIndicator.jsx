const GOLD = "#c9a227";

const STEPS = [
  { key: "upload", label: "Script" },
  { key: "character", label: "Character" },
  { key: "tag", label: "Scenes" },
  { key: "view", label: "View" },
];

export default function StepIndicator({ current }) {
  const ci = STEPS.findIndex((s) => s.key === current);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 4,
        marginTop: 14,
      }}
    >
      {STEPS.map((s, i) => (
        <div
          key={s.key}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: i <= ci ? GOLD : "#444",
              transition: "background 0.3s",
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: i <= ci ? GOLD : "#666",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <span style={{ color: "#333", margin: "0 2px" }}>·</span>
          )}
        </div>
      ))}
    </div>
  );
}
