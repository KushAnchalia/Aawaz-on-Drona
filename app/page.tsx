"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import AawazLogo from "./components/AawazLogo";

interface MasterRouterProps {
  initialCommand?: string;
  onBack?: () => void;
}

const WalletConnect = dynamic(() => import("./components/WalletConnect"), {
  ssr: false,
});

const MasterRouter = dynamic<MasterRouterProps>(() => import("./components/MasterRouter"), {
  ssr: false,
});

const LandingPage = dynamic(() => import("./components/LandingPage"), {
  ssr: false,
});

export default function Page() {
  const [showApp, setShowApp] = useState(false);
  const [initialCommand, setInitialCommand] = useState("");

  const handleExplore = (cmd?: string) => {
    if (cmd) setInitialCommand(cmd);
    setShowApp(true);
  };

  if (!showApp) {
    return <LandingPage onExplore={handleExplore} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "white", position: "relative", overflow: "hidden" }}>
      {/* Dynamic Background Mesh */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: "radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)",
        pointerEvents: "none"
      }} />

      {/* Main Content Area */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "20px 40px"
        }}>
          <div onClick={() => setShowApp(false)} style={{ cursor: "pointer", opacity: 0.8 }}>
            <AawazLogo size="small" />
          </div>
          <WalletConnect />
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <MasterRouter initialCommand={initialCommand} onBack={() => setShowApp(false)} />
        </div>
      </div>
    </div>
  );
}
