"use client";
import CreatorDashboard from "../components/CreatorDashboard";
import Link from "next/link";
import { useWallet } from "../context/WalletContext";

export default function CreatorPage() {
    const { connected } = useWallet();
    void connected;
    return (
        <main className="min-h-screen bg-gray-50 text-black p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/" className="text-purple-600 hover:text-purple-800 font-bold">
                        ← Back to Marketplace
                    </Link>
                    <h1 className="text-3xl font-bold">Creator Studio</h1>
                </div>

                <CreatorDashboard />
            </div>
        </main>
    );
}
