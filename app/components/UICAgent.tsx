"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { cameraService } from "../services/CameraService";
import { gestureRecognizer } from "../services/GestureRecognizer";
import { intentParser, SignIntent } from "../services/IntentParser";
import { getExplorerTxUrl, getWalletBalance } from "../lib/monad";

interface UICAgentProps {
  onSpeak?: (text: string) => void;
  onStopSpeech?: () => void;
  onAction?: (agent: string, command: string) => void;
}

export default function UICAgent({ onSpeak, onStopSpeech }: UICAgentProps) {
  const { address, connected, sendMon, network } = useWallet();
  const [status, setStatus] = useState<
    "IDLE" | "TRACKING" | "ANALYZING" | "CONFIRMING" | "EXECUTING" | "SUCCESS"
  >("IDLE");
  const [currentGesture, setCurrentGesture] = useState<SignIntent | null>(null);
  const [detectedIntent, setDetectedIntent] = useState<SignIntent | null>(null);
  const [txStatus, setTxStatus] = useState<string>("");
  const [landmarkCount, setLandmarkCount] = useState<number>(0);
  const [trackingInfo, setTrackingInfo] = useState<string>("Not Initialized");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      setTrackingInfo(gestureRecognizer.trackingStatus);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const startAgent = async () => {
    onStopSpeech?.();
    try {
      await gestureRecognizer.init();
      if (videoRef.current) {
        await cameraService.startCamera(videoRef.current);
        setStatus("TRACKING");
        startTrackingLoop();
      }
    } catch (err) {
      console.error(err);
      onSpeak?.("I couldn't start the camera. Please check permissions.");
    }
  };

  const startTrackingLoop = () => {
    gestureRecognizer.onResults((results: any) => {
      const count = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
      setLandmarkCount(count);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          gestureRecognizer.drawLandmarks(ctx, results);

          const intent = intentParser.parseLandmarks(results);
          if (intent.intent !== "UNKNOWN") {
            setCurrentGesture(intent);
            if (intent.confidence > 0.85 && status === "TRACKING") {
              if (intent.intent === "TRANSFER_MON" || intent.intent === "TRANSFER_SOL") {
                handleDetectedIntent({
                  ...intent,
                  intent: "TRANSFER_MON",
                });
              }
            }
          } else {
            setCurrentGesture(null);
          }
        }
      }
    });

    const loop = async () => {
      if (videoRef.current && status === "TRACKING") {
        await gestureRecognizer.send(videoRef.current);
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
  };

  const stopAgent = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    cameraService.stopCamera();
    setStatus("IDLE");
    setDetectedIntent(null);
    setTxStatus("");
  };

  const handleDetectedIntent = (intent: SignIntent) => {
    setDetectedIntent(intent);
    setStatus("CONFIRMING");
    onSpeak?.(
      `I detected a sign to ${intent.intent.replace("_", " ")}. Make a closed fist to confirm or open palm to cancel.`
    );
  };

  useEffect(() => {
    if (status === "CONFIRMING" && currentGesture) {
      if (currentGesture.intent === "CONFIRM") {
        executeTransaction();
      } else if (
        currentGesture.intent === "CANCEL" ||
        currentGesture.intent === "TRANSFER_MON" ||
        currentGesture.intent === "TRANSFER_SOL"
      ) {
        setStatus("TRACKING");
        setDetectedIntent(null);
        onSpeak?.("Action cancelled. Back to tracking.");
      }
    }
  }, [currentGesture, status]);

  const executeTransaction = async () => {
    if (!connected || !address || !detectedIntent) {
      onSpeak?.("Please connect MetaMask first.");
      return;
    }

    setStatus("EXECUTING");
    setTxStatus("Preparing MON transfer...");

    try {
      if (detectedIntent.intent === "GET_BALANCE") {
        const bal = await getWalletBalance(address, network);
        setTxStatus(`Balance: ${bal.toFixed(4)} MON`);
        setStatus("SUCCESS");
        onSpeak?.(`Your balance is ${bal.toFixed(4)} MON`);
        setTimeout(() => stopAgent(), 5000);
        return;
      }

      // Demo transfer: send to self (safe for Blitz demos)
      const amount = detectedIntent.amount || 0.01;
      setTxStatus("Confirm in MetaMask...");
      const hash = await sendMon(address, amount);
      setTxStatus(`Success! ${hash.slice(0, 10)}... — ${getExplorerTxUrl(hash, network)}`);
      setStatus("SUCCESS");
      onSpeak?.("Transaction executed successfully through sign language!");
      setTimeout(() => stopAgent(), 5000);
    } catch (err: any) {
      console.error(err);
      setTxStatus(`Error: ${err.message}`);
      setStatus("TRACKING");
      onSpeak?.(`Transaction failed: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        padding: "2.5rem",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        borderRadius: "40px",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(40px)",
        color: "white",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h3 style={{ fontSize: "2.2rem", fontWeight: "950", margin: "0 0 10px 0" }}>
          🤟 Sign Master AI
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", fontWeight: "500" }}>
          Non-verbal Monad Testnet interaction via MetaMask
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: "2rem" }}>
        <div
          style={{
            width: "100%",
            height: "400px",
            background: "#020617",
            borderRadius: "30px",
            overflow: "hidden",
            border: "1px solid rgba(131, 110, 249, 0.3)",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />

          {status === "IDLE" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(2,6,23,0.8)",
              }}
            >
              <button
                onClick={startAgent}
                style={{
                  padding: "15px 40px",
                  borderRadius: "20px",
                  background: "#836EF9",
                  border: "none",
                  color: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                📹 Initialize Camera
              </button>
            </div>
          )}
        </div>

        {status !== "IDLE" && (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.6)",
                padding: "10px 15px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ color: "#a78bfa", fontWeight: "900" }}>INTENT: </span>
              <span style={{ fontWeight: "700" }}>{currentGesture?.intent || "SCANNING..."}</span>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>STATUS: {trackingInfo}</div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>HANDS: {landmarkCount}</div>
            </div>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                padding: "10px 15px",
                borderRadius: "12px",
                fontSize: "0.8rem",
                fontWeight: "900",
              }}
            >
              ● LIVE TRACKING
            </div>
          </div>
        )}
      </div>

      {status === "CONFIRMING" && detectedIntent && (
        <div
          style={{
            background: "rgba(131, 110, 249, 0.1)",
            padding: "2rem",
            borderRadius: "30px",
            border: "1px solid rgba(131, 110, 249, 0.3)",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#a78bfa" }}>GESTURE DETECTED</h4>
          <div style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "20px" }}>
            {detectedIntent.intent === "TRANSFER_MON" || detectedIntent.intent === "TRANSFER_SOL"
              ? `Transfer ${detectedIntent.amount} MON`
              : detectedIntent.intent}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <div
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid #10b981",
              }}
            >
              ✊ <span style={{ fontWeight: "800", color: "#10b981" }}>FIST TO CONFIRM</span>
            </div>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid #ef4444",
              }}
            >
              ✋ <span style={{ fontWeight: "800", color: "#ef4444" }}>PALM TO CANCEL</span>
            </div>
          </div>
        </div>
      )}

      {(status === "EXECUTING" || status === "SUCCESS") && (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            padding: "2rem",
            borderRadius: "30px",
            border: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
            wordBreak: "break-all",
          }}
        >
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "800",
              color: status === "SUCCESS" ? "#10b981" : "#a78bfa",
            }}
          >
            {txStatus}
          </div>
          {status === "SUCCESS" && (
            <button
              onClick={stopAgent}
              style={{
                marginTop: "20px",
                padding: "10px 25px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                cursor: "pointer",
              }}
            >
              Close Session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
