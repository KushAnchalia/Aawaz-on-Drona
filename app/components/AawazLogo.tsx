"use client";

export default function AawazLogo({ size = "large", onClick }: { size?: "small" | "large", onClick?: () => void }) {
    const isLarge = size === "large";

    return (
        <div
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: onClick ? "pointer" : "default"
            }}
        >
            <div style={{
                fontSize: isLarge ? "4.5rem" : "2.5rem",
                animation: "floatPulse 3s infinite ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 10px 15px rgba(99, 102, 241, 0.3))",
                lineHeight: 1
            }}>
                <style jsx>{`
                    @keyframes floatPulse {
                        0% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-10px) scale(1.1); }
                        100% { transform: translateY(0) scale(1); }
                    }
                `}</style>
                🎙️
            </div>
            <div style={{
                fontSize: isLarge ? "3.5rem" : "2rem",
                fontWeight: "900",
                background: "linear-gradient(90deg, #ffffff 0%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-2px",
                fontFamily: "'Outfit', sans-serif"
            }}>
                Aawaz
            </div>
        </div>
    );
}
