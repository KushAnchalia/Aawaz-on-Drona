"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: "12px",
        marginBottom: "2rem",
      }}
    >
      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          textDecoration: "none",
          color: pathname === "/" ? "white" : "rgba(255,255,255,0.8)",
          backgroundColor: pathname === "/" ? "rgba(255,255,255,0.2)" : "transparent",
          fontWeight: pathname === "/" ? "bold" : "normal",
          transition: "all 0.2s",
        }}
      >
        🎤 Voice Agent
      </Link>
      <Link
        href="/transaction-workbench"
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          textDecoration: "none",
          color: pathname === "/transaction-workbench" ? "white" : "rgba(255,255,255,0.8)",
          backgroundColor: pathname === "/transaction-workbench" ? "rgba(255,255,255,0.2)" : "transparent",
          fontWeight: pathname === "/transaction-workbench" ? "bold" : "normal",
          transition: "all 0.2s",
        }}
      >
        🔧 Transaction Workbench
      </Link>
    </nav>
  );
}

