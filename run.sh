#!/bin/bash

# Solana Voice Agent - Quick Run Script

echo "🚀 Solana Voice Agent - Setup & Run"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local file not found!"
    echo ""
    echo "Creating .env.local file..."
    echo "Please add your OpenAI API key:"
    echo ""
    read -p "Enter your OpenAI API key: " api_key
    echo "OPENAI_API_KEY=$api_key" > .env.local
    echo "✅ .env.local created"
    echo ""
else
    echo "✅ .env.local file exists"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🎯 Starting development server..."
echo "📍 Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dev server
npm run dev

