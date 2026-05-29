/** Shared mark for favicon / PWA icons (ImageResponse JSX). */
export function PwaIconMark({ size }: { size: number }) {
  const radius = Math.round(size * 0.2);
  const fontSize = Math.round(size * 0.48);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0891b2 0%, #0284c7 45%, #7c3aed 100%)",
        borderRadius: radius,
      }}
    >
      <span
        style={{
          color: "#ffffff",
          fontSize,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1,
          marginTop: -Math.round(size * 0.02),
        }}
      >
        D
      </span>
    </div>
  );
}
