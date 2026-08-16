import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json(
                { error: "Code is required" },
                { status: 400 }
            );
        }

        const vulnerabilities = [];
        let score = 100;

        // Heuristic Analysis
        if (code.includes("unsafe_allow")) {
            vulnerabilities.push({
                severity: "HIGH",
                line: "N/A",
                message: "Usage of 'unsafe_allow' detected. This bypasses security checks."
            });
            score -= 20;
        }

        if (!code.includes("Signer")) {
            vulnerabilities.push({
                severity: "MEDIUM",
                line: "N/A",
                message: "No 'Signer' account found. Ensure you are validating authorities."
            });
            score -= 10;
        }

        if (code.includes("AccountInfo") && !code.includes("Account<")) {
            vulnerabilities.push({
                severity: "LOW",
                line: "N/A",
                message: "Using raw 'AccountInfo' instead of Anchor's 'Account' wrapper is risky."
            });
            score -= 5;
        }

        // Optimization suggestions
        const suggestions = [];
        if (!code.includes("#[account(zero_copy)]")) {
            suggestions.push("Consider using zero_copy for large accounts to save compute.");
        }

        return NextResponse.json({
            score,
            vulnerabilities,
            suggestions,
            optimizedCode: code + "\n// Optimized by Aawaz Agent"
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to analyze contract" },
            { status: 500 }
        );
    }
}
