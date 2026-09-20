"use client";
import { useState, useEffect } from "react";

interface SmartContractCreatorProps {
    onSpeak?: (text: string) => void;
    onStopSpeech?: () => void;
    initialCommand?: string;
}

export default function SmartContractCreator({ onSpeak, onStopSpeech, initialCommand }: SmartContractCreatorProps) {
    const [description, setDescription] = useState("");
    const [output, setOutput] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
    const [securityAnalysis, setSecurityAnalysis] = useState<any>(null);
    const [analyzingSecurity, setAnalyzingSecurity] = useState(false);
    const [activeTab, setActiveTab] = useState<"code" | "security">("code");
    
    // Audit mode states
    const [auditMode, setAuditMode] = useState(false);
    const [auditCode, setAuditCode] = useState("");
    const [auditResult, setAuditResult] = useState<any>(null);
    const [auditingCode, setAuditingCode] = useState(false);

    const handleCreate = async (customDesc?: string) => {
        const targetDesc = customDesc || description;
        if (!targetDesc.trim()) return;
        setLoading(true);
        setError(null);
        setSecurityAnalysis(null);
        onSpeak?.("Generating your smart contract. Please wait a moment.");
        try {
            const res = await fetch("/api/contract/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: targetDesc }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setOutput(data.code);
            onSpeak?.("Smart contract generation complete! I've created the Anchor boilerplate for you. Running security analysis...");
            
            await analyzeSecurity(data.code);
            setActiveTab("security");
        } catch (e: any) {
            setError(e.message);
            onSpeak?.("Error creating contract: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const analyzeSecurity = async (code?: string) => {
        const targetCode = code || output;
        if (!targetCode) return;
        
        setAnalyzingSecurity(true);
        try {
            const res = await fetch("/api/contract/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: targetCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSecurityAnalysis(data);
            
            const issueCount = data.vulnerabilities?.length || 0;
            if (issueCount === 0) {
                onSpeak?.("Security analysis complete! No critical vulnerabilities detected.");
            } else {
                onSpeak?.(`Security analysis found ${issueCount} potential ${issueCount === 1 ? 'issue' : 'issues'}.`);
            }
        } catch (e: any) {
            console.error("Security analysis error:", e);
        } finally {
            setAnalyzingSecurity(false);
        }
    };

    const handleAuditContract = async () => {
        if (!auditCode.trim()) return;
        setAuditingCode(true);
        setAuditResult(null);
        onSpeak?.("Auditing your smart contract for vulnerabilities...");
        try {
            const res = await fetch("/api/contract/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: auditCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAuditResult(data);
            
            const issueCount = data.vulnerabilities?.length || 0;
            const score = issueCount === 0 ? 100 : Math.max(0, 100 - (issueCount * 20));
            onSpeak?.(`Audit complete! Security score: ${score}%. Found ${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}.`);
        } catch (e: any) {
            onSpeak?.("Error auditing contract: " + e.message);
        } finally {
            setAuditingCode(false);
        }
    };

    useEffect(() => {
        if (initialCommand && !hasProcessedInitial) {
            setDescription(initialCommand);
            setHasProcessedInitial(true);
            handleCreate(initialCommand);
        }
    }, [initialCommand, hasProcessedInitial]);

    return (
        <div>
            {/* Mode Toggle */}
            <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
                <button
                    onClick={() => { onStopSpeech?.(); setAuditMode(false); }}
                    style={{
                        padding: "12px 30px",
                        background: !auditMode ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" : "rgba(55, 65, 81, 0.3)",
                        color: "white",
                        border: !auditMode ? "2px solid #4b5563" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "900",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: !auditMode ? "0 8px 16px rgba(0, 0, 0, 0.3)" : "none"
                    }}
                >
                    ⚡ Generate Contract
                </button>
                <button
                    onClick={() => { onStopSpeech?.(); setAuditMode(true); }}
                    style={{
                        padding: "12px 30px",
                        background: auditMode ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" : "rgba(220, 38, 38, 0.2)",
                        color: "white",
                        border: auditMode ? "2px solid #ef4444" : "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "900",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: auditMode ? "0 8px 16px rgba(220, 38, 38, 0.3)" : "none"
                    }}
                >
                    🔍 Audit Existing Contract
                </button>
            </div>

            {!auditMode ? (
                <>
            <p style={{ color: "#94a3b8", marginBottom: "25px", fontSize: "1.1rem" }}>
                Convert your ideas into production-ready Anchor programs. Describe what you want to build.
            </p>

            <div style={{ marginBottom: "20px" }}>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Create a crowdfunding contract where users can donate MON and the owner can withdraw..."
                    style={{
                        width: "100%",
                        height: "150px",
                        padding: "20px",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "white",
                        fontSize: "1.1rem",
                        marginBottom: "15px",
                        resize: "vertical",
                        outline: "none",
                        fontFamily: "'Outfit', sans-serif"
                    }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => { onStopSpeech?.(); handleCreate(); }}
                        disabled={loading || !description.trim()}
                        style={{
                            padding: "14px 40px",
                            background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "14px",
                            fontSize: "1.1rem",
                            fontWeight: "900",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.4)"
                        }}
                    >
                        {loading ? "Generating..." : "Generate Smart Contract"}
                    </button>
                    <button
                        onClick={() => alert("Voice input requires browser permissions. Type 'crowdfunding' for a demo.")}
                        style={{
                            padding: "14px 25px",
                            backgroundColor: "rgba(236, 72, 153, 0.15)",
                            color: "#f472b6",
                            border: "1px solid rgba(236, 72, 153, 0.3)",
                            borderRadius: "14px",
                            cursor: "pointer",
                            fontWeight: "800"
                        }}
                    >
                        🎤 Voice Input
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: "15px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px" }}>
                    ❌ {error}
                </div>
            )}

            {output && (
                <div style={{ animation: "fadeIn 0.5s ease", marginTop: "30px" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                        <button
                            onClick={() => { onStopSpeech?.(); setActiveTab("code"); }}
                            style={{
                                padding: "15px 30px",
                                background: activeTab === "code" ? "rgba(255,255,255,0.1)" : "transparent",
                                color: activeTab === "code" ? "white" : "#94a3b8",
                                border: "none",
                                borderBottom: activeTab === "code" ? "3px solid white" : "3px solid transparent",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                fontWeight: "900",
                                transition: "all 0.3s",
                                marginBottom: "-2px"
                            }}
                        >
                            🚀 Generated Code
                        </button>
                        <button
                            onClick={() => { onStopSpeech?.(); setActiveTab("security"); }}
                            style={{
                                padding: "15px 30px",
                                background: activeTab === "security" ? "rgba(255,255,255,0.1)" : "transparent",
                                color: activeTab === "security" ? "white" : "#94a3b8",
                                border: "none",
                                borderBottom: activeTab === "security" ? "3px solid white" : "3px solid transparent",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                fontWeight: "900",
                                transition: "all 0.3s",
                                marginBottom: "-2px",
                                position: "relative"
                            }}
                        >
                            🛡️ Security Analysis
                            {analyzingSecurity && (
                                <span style={{
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                    width: "10px",
                                    height: "10px",
                                    background: "#3b82f6",
                                    borderRadius: "50%",
                                    animation: "pulse 2s infinite"
                                }} />
                            )}
                            {securityAnalysis && !analyzingSecurity && (
                                <span style={{
                                    marginLeft: "8px",
                                    padding: "2px 8px",
                                    background: securityAnalysis.vulnerabilities?.length === 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                    color: securityAnalysis.vulnerabilities?.length === 0 ? "#10b981" : "#f59e0b",
                                    borderRadius: "10px",
                                    fontSize: "0.75rem",
                                    fontWeight: "800"
                                }}>
                                    {securityAnalysis.vulnerabilities?.length === 0 ? "✓" : securityAnalysis.vulnerabilities?.length}
                                </span>
                            )}
                        </button>
                    </div>
            
                    {activeTab === "code" && (
                        <div>
                            <h3 style={{ marginBottom: "15px", color: "white", fontWeight: "900", fontSize: "1.5rem" }}>🚀 Generated Rust Code (Anchor)</h3>
                            <div style={{
                                background: "#1e293b",
                                color: "#e2e8f0",
                                padding: "20px",
                                borderRadius: "12px",
                                overflowX: "auto",
                                fontFamily: "monospace",
                                position: "relative"
                            }}>
                                <button
                                    onClick={() => { onStopSpeech?.(); navigator.clipboard.writeText(output); alert("Copied!"); }}
                                    style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        padding: "5px 10px",
                                        background: "rgba(255,255,255,0.1)",
                                        color: "white",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    Copy Code
                                </button>
                                <pre style={{ margin: 0 }}>{output}</pre>
                            </div>
                            <div style={{ marginTop: "20px", padding: "20px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "16px", color: "#d1fae5", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: "600" }}>
                                <strong>✅ Ready to Deploy!</strong> Save this as <code style={{ color: "#34d399" }}>lib.rs</code> in your Anchor project.
                            </div>
                        </div>
                    )}
                    
                    {activeTab === "security" && (
                        <div style={{ animation: "fadeIn 0.3s ease" }}>
                            {analyzingSecurity ? (
                                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                                    <div style={{ fontSize: "4rem", marginBottom: "20px", animation: "spin 2s linear infinite" }}>🛡️</div>
                                    <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: "900", marginBottom: "10px" }}>Analyzing Security...</h3>
                                    <p>Running vulnerability checks and best practice analysis</p>
                                </div>
                            ) : securityAnalysis ? (
                                <div>
                                    <div style={{
                                        padding: "40px",
                                        background: securityAnalysis.vulnerabilities?.length === 0 
                                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)" 
                                            : "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)",
                                        borderRadius: "25px",
                                        border: securityAnalysis.vulnerabilities?.length === 0
                                            ? "2px solid rgba(16, 185, 129, 0.4)"
                                            : "2px solid rgba(245, 158, 11, 0.4)",
                                        marginBottom: "30px",
                                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                                        textAlign: "center"
                                    }}>
                                        <div style={{ fontSize: "5rem", marginBottom: "20px" }}>
                                            {securityAnalysis.vulnerabilities?.length === 0 ? "🛡️" : "⚠️"}
                                        </div>
                                        <h2 style={{ fontSize: "3rem", fontWeight: "900", color: "white", marginBottom: "15px", letterSpacing: "-1px" }}>
                                            {securityAnalysis.vulnerabilities?.length === 0 ? "Contract Secure" : `${securityAnalysis.vulnerabilities?.length} ${securityAnalysis.vulnerabilities?.length === 1 ? 'Issue' : 'Issues'} Detected`}
                                        </h2>
                                        <p style={{ color: "#cbd5e1", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                                            {securityAnalysis.summary || "Comprehensive security analysis completed"}
                                        </p>
                                        
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px", marginTop: "30px" }}>
                                            <div style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "15px" }}>
                                                <div style={{ fontSize: "2rem", fontWeight: "900", color: "white" }}>{securityAnalysis.vulnerabilities?.length || 0}</div>
                                                <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "5px" }}>Vulnerabilities</div>
                                            </div>
                                            <div style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "15px" }}>
                                                <div style={{ fontSize: "2rem", fontWeight: "900", color: "white" }}>{securityAnalysis.recommendations?.length || 0}</div>
                                                <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "5px" }}>Recommendations</div>
                                            </div>
                                            <div style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "15px" }}>
                                                <div style={{ fontSize: "2rem", fontWeight: "900", color: securityAnalysis.vulnerabilities?.length === 0 ? "#10b981" : "#f59e0b" }}>
                                                    {securityAnalysis.vulnerabilities?.length === 0 ? "100%" : `${Math.max(0, 100 - (securityAnalysis.vulnerabilities?.length * 20))}%`}
                                                </div>
                                                <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "5px" }}>Security Score</div>
                                            </div>
                                        </div>
                                    </div>

                                    {securityAnalysis.vulnerabilities && securityAnalysis.vulnerabilities.length > 0 && (
                                        <div>
                                            <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: "900", marginBottom: "20px" }}>
                                                🔴 Security Issues
                                            </h3>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
                                                {securityAnalysis.vulnerabilities.map((vuln: any, idx: number) => (
                                                    <div key={idx} style={{
                                                        padding: "20px",
                                                        background: "rgba(239, 68, 68, 0.1)",
                                                        borderRadius: "15px",
                                                        border: "1px solid rgba(239, 68, 68, 0.3)"
                                                    }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                                                            <h4 style={{ color: "#fca5a5", margin: 0, fontWeight: "800", fontSize: "1.1rem" }}>
                                                                {vuln.type || "Security Issue"}
                                                            </h4>
                                                            <span style={{
                                                                padding: "4px 12px",
                                                                background: vuln.severity === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                                                color: vuln.severity === "high" ? "#fca5a5" : "#fbbf24",
                                                                borderRadius: "10px",
                                                                fontSize: "0.85rem",
                                                                fontWeight: "800",
                                                                textTransform: "uppercase"
                                                            }}>
                                                                {vuln.severity || "medium"}
                                                            </span>
                                                        </div>
                                                        <p style={{ color: "#94a3b8", margin: "10px 0", lineHeight: "1.6" }}>
                                                            {vuln.description}
                                                        </p>
                                                        {vuln.recommendation && (
                                                            <div style={{ marginTop: "10px", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                                                                <strong style={{ color: "#34d399", fontSize: "0.9rem" }}>✔️ Fix:</strong>
                                                                <span style={{ color: "#a7f3d0", marginLeft: "8px", fontSize: "0.9rem" }}>{vuln.recommendation}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {securityAnalysis.recommendations && securityAnalysis.recommendations.length > 0 && (
                                        <div>
                                            <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: "900", marginBottom: "20px" }}>
                                                💡 Best Practices & Recommendations
                                            </h3>
                                            <div style={{ padding: "25px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "20px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                                                <ul style={{ color: "#cbd5e1", margin: 0, paddingLeft: "25px", lineHeight: "2", fontSize: "1.05rem" }}>
                                                    {securityAnalysis.recommendations.map((rec: string, idx: number) => (
                                                        <li key={idx}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                                    <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🛡️</div>
                                    <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: "900", marginBottom: "10px" }}>No Analysis Available</h3>
                                    <p>Generate a contract first to see security analysis</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            </>
            ) : (
                <div>
                    <p style={{ color: "#94a3b8", marginBottom: "25px", fontSize: "1.1rem" }}>
                        🔍 <strong>Audit Your Smart Contract</strong> - Paste your existing Solidity contract code to detect vulnerabilities and get a security score.
                    </p>
                    
                    <div style={{ marginBottom: "20px" }}>
                        <textarea
                            value={auditCode}
                            onChange={(e) => setAuditCode(e.target.value)}
                            placeholder="Paste your Solidity smart contract code here (EVM)..."
                            style={{
                                width: "100%",
                                height: "300px",
                                padding: "20px",
                                borderRadius: "20px",
                                border: "2px solid rgba(239, 68, 68, 0.3)",
                                background: "rgba(15, 23, 42, 0.6)",
                                color: "white",
                                fontSize: "1rem",
                                marginBottom: "15px",
                                resize: "vertical",
                                outline: "none",
                                fontFamily: "monospace"
                            }}
                        />
                        <button
                            onClick={() => { onStopSpeech?.(); handleAuditContract(); }}
                            disabled={auditingCode || !auditCode.trim()}
                            style={{
                                padding: "14px 40px",
                                background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "14px",
                                fontSize: "1.1rem",
                                fontWeight: "900",
                                cursor: auditingCode ? "not-allowed" : "pointer",
                                opacity: auditingCode ? 0.7 : 1,
                                boxShadow: "0 10px 20px rgba(220, 38, 38, 0.4)"
                            }}
                        >
                            {auditingCode ? "🔍 Auditing..." : "🛡️ Audit Contract"}
                        </button>
                    </div>

                    {auditResult && (
                        <div style={{ animation: "fadeIn 0.5s ease", marginTop: "30px" }}>
                            <div style={{
                                padding: "40px",
                                background: auditResult.vulnerabilities?.length === 0 
                                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)" 
                                    : "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)",
                                borderRadius: "25px",
                                border: auditResult.vulnerabilities?.length === 0
                                    ? "2px solid rgba(16, 185, 129, 0.4)"
                                    : "2px solid rgba(245, 158, 11, 0.4)",
                                marginBottom: "30px",
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                                textAlign: "center"
                            }}>
                                <div style={{ fontSize: "5rem", marginBottom: "20px" }}>
                                    {auditResult.vulnerabilities?.length === 0 ? "🛡️" : "⚠️"}
                                </div>
                                <h2 style={{ fontSize: "3rem", fontWeight: "900", color: "white", marginBottom: "15px", letterSpacing: "-1px" }}>
                                    Security Score: {auditResult.vulnerabilities?.length === 0 ? "100%" : `${Math.max(0, 100 - (auditResult.vulnerabilities?.length * 20))}%`}
                                </h2>
                                <p style={{ color: "#cbd5e1", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                                    {auditResult.vulnerabilities?.length === 0 ? "No critical vulnerabilities detected" : `Found ${auditResult.vulnerabilities?.length} security ${auditResult.vulnerabilities?.length === 1 ? 'issue' : 'issues'}`}
                                </p>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px", marginTop: "30px" }}>
                                    <div style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "15px" }}>
                                        <div style={{ fontSize: "2rem", fontWeight: "900", color: "white" }}>{auditResult.vulnerabilities?.length || 0}</div>
                                        <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "5px" }}>Vulnerabilities</div>
                                    </div>
                                    <div style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "15px" }}>
                                        <div style={{ fontSize: "2rem", fontWeight: "900", color: "white" }}>{auditResult.recommendations?.length || 0}</div>
                                        <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "5px" }}>Recommendations</div>
                                    </div>
                                    <div style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "15px" }}>
                                        <div style={{ fontSize: "2rem", fontWeight: "900", color: auditResult.vulnerabilities?.length === 0 ? "#10b981" : "#f59e0b" }}>
                                            {auditResult.vulnerabilities?.length === 0 ? "✅" : "⚠️"}
                                        </div>
                                        <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "5px" }}>Status</div>
                                    </div>
                                </div>
                            </div>

                            {auditResult.vulnerabilities && auditResult.vulnerabilities.length > 0 && (
                                <div>
                                    <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: "900", marginBottom: "20px" }}>
                                        🔴 Security Issues
                                    </h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
                                        {auditResult.vulnerabilities.map((vuln: any, idx: number) => (
                                            <div key={idx} style={{
                                                padding: "20px",
                                                background: "rgba(239, 68, 68, 0.1)",
                                                borderRadius: "15px",
                                                border: "1px solid rgba(239, 68, 68, 0.3)"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                                                    <h4 style={{ color: "#fca5a5", margin: 0, fontWeight: "800", fontSize: "1.1rem" }}>
                                                        {vuln.type || "Security Issue"}
                                                    </h4>
                                                    <span style={{
                                                        padding: "4px 12px",
                                                        background: vuln.severity === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                                        color: vuln.severity === "high" ? "#fca5a5" : "#fbbf24",
                                                        borderRadius: "10px",
                                                        fontSize: "0.85rem",
                                                        fontWeight: "800",
                                                        textTransform: "uppercase"
                                                    }}>
                                                        {vuln.severity || "medium"}
                                                    </span>
                                                </div>
                                                <p style={{ color: "#94a3b8", margin: "10px 0", lineHeight: "1.6" }}>
                                                    {vuln.description}
                                                </p>
                                                {vuln.recommendation && (
                                                    <div style={{ marginTop: "10px", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                                                        <strong style={{ color: "#34d399", fontSize: "0.9rem" }}>✔️ Fix:</strong>
                                                        <span style={{ color: "#a7f3d0", marginLeft: "8px", fontSize: "0.9rem" }}>{vuln.recommendation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                                <div>
                                    <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: "900", marginBottom: "20px" }}>
                                        💡 Best Practices & Recommendations
                                    </h3>
                                    <div style={{ padding: "25px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "20px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                                        <ul style={{ color: "#cbd5e1", margin: 0, paddingLeft: "25px", lineHeight: "2", fontSize: "1.05rem" }}>
                                            {auditResult.recommendations.map((rec: string, idx: number) => (
                                                <li key={idx}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
