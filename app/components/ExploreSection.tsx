"use client";
import React from 'react';

const ExploreCard = ({ title, description, icon, link, index }: { title: string, description: string, icon: string, link: string, index: number }) => (
    <div style={{
        background: "rgba(15, 23, 42, 0.6)",
        borderRadius: "25px",
        padding: "30px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        textDecoration: "none",
        color: "inherit",
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
    }}
        onClick={() => window.open(link, "_blank")}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-10px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 25px 60px rgba(0, 0, 0, 0.5)";
            e.currentTarget.style.borderColor = "rgba(100, 100, 100, 0.4)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        }}
    >
        {/* Icon Background Glow */}
        <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "150px",
            height: "150px",
            background: "radial-gradient(circle, rgba(100, 100, 100, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none"
        }} />
        
        {/* Icon Container */}
        <div style={{
            fontSize: "3.5rem",
            marginBottom: "10px",
            position: "relative",
            zIndex: 1
        }}>{icon}</div>
        
        {/* Title */}
        <h3 style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: "900",
            color: "white",
            letterSpacing: "-0.5px",
            position: "relative",
            zIndex: 1
        }}>{title}</h3>
        
        {/* Description */}
        <p style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            position: "relative",
            zIndex: 1,
            minHeight: "45px"
        }}>{description}</p>
        
        {/* External Link Indicator */}
        <div style={{
            marginTop: "auto",
            paddingTop: "15px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#64748b",
            fontSize: "0.85rem",
            fontWeight: "700",
            position: "relative",
            zIndex: 1
        }}>
            <span>Visit Site</span>
            <span style={{ fontSize: "1.2rem" }}>↗</span>
        </div>
    </div>
);

export default function ExploreSection() {
    const ecosystemApps = [
        {
            title: "Hyperliquid",
            description: "Decentralized perpetual exchange with high performance.",
            icon: "💧",
            link: "https://hyperliquid.xyz/"
        },
        {
            title: "Jito Staking",
            description: "Liquid staking with MEV rewards.",
            icon: "🥩",
            link: "https://www.jito.network/"
        },
        {
            title: "Tensor",
            description: "Pro NFT marketplace.",
            icon: "🖼️",
            link: "https://www.tensor.trade/"
        },
        {
            title: "Jupiter",
            description: "The best swap aggregator.",
            icon: "🪐",
            link: "https://jup.ag/"
        },
        {
            title: "Solana Beach",
            description: "Explore the Monad blockchain statistics.",
            icon: "🏖️",
            link: "https://testnet.monadvision.com"
        },
        {
            title: "DeFi Llama",
            description: "Track TVL and stats across chains.",
            icon: "🦙",
            link: "https://defillama.com/chain/Monad"
        }
    ];

    return (
        <div style={{ padding: "0" }}>
            {/* Header Section */}
            <div style={{
                marginBottom: "40px",
                padding: "30px",
                background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(50, 50, 50, 0.3) 100%)",
                borderRadius: "25px",
                border: "2px solid rgba(100, 100, 100, 0.3)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "2.5rem" }}>🚀</span>
                    <h2 style={{
                        fontSize: "2.2rem",
                        margin: 0,
                        color: "white",
                        fontWeight: "900",
                        letterSpacing: "-1px"
                    }}>
                        Explore Monad Ecosystem
                    </h2>
                </div>
                <p style={{
                    color: "#94a3b8",
                    fontSize: "1rem",
                    margin: "10px 0 0 0",
                    lineHeight: "1.6"
                }}>
                    Discover the best DeFi protocols, NFT marketplaces, and tools built on Monad
                </p>
            </div>

            {/* Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "25px"
            }}>
                {ecosystemApps.map((app, index) => (
                    <ExploreCard
                        key={app.title}
                        title={app.title}
                        description={app.description}
                        icon={app.icon}
                        link={app.link}
                        index={index}
                    />
                ))}
            </div>

            <style jsx global>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
