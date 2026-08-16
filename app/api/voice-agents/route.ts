import { NextRequest, NextResponse } from "next/server";

export interface VoiceAgent {
  id: string;
  name: string;
  description: string;
  creator: string;
  prompt: string;
  price: number; // in MON
  category: string;
  voiceStyle: string;
  createdAt: string;
  sales: number;
  rating: number;
  celebrityName?: string;
  voiceId?: string;
  referenceId?: string;
  nftMintAddress?: string;
  image?: string;
}

// In-memory storage (in production, use a database)
let voiceAgents: VoiceAgent[] = [
  {
    id: "1",
    name: "Professional Assistant",
    description: "A professional and formal voice agent for business transactions",
    creator: "System",
    prompt: "You are a professional Solana transaction assistant. Be formal, clear, and concise. Always confirm details before executing transactions.",
    price: 0.1,
    category: "Business",
    voiceStyle: "Professional",
    createdAt: new Date().toISOString(),
    sales: 0,
    rating: 5.0,
  },
  {
    id: "2",
    name: "Friendly Helper",
    description: "A friendly and casual voice agent that makes transactions fun",
    creator: "System",
    prompt: "You are a friendly Solana assistant. Be warm, helpful, and use emojis. Make transactions feel easy and approachable.",
    price: 0.05,
    category: "Casual",
    voiceStyle: "Friendly",
    createdAt: new Date().toISOString(),
    sales: 0,
    rating: 4.8,
  },
  {
    id: "amitabh_bachchan",
    name: "Amitabh Bachchan (Big B)",
    description: "💎 PREMIUM: Advanced Neural baritone model of the legendary Amitabh Bachchan. Experience 100% authentic baritone logic.",
    creator: "Celebrity",
    prompt: "You are Amitabh Bachchan. Speak with his distinctive baritone voice and charismatic style.",
    price: 1.0,
    category: "Entertainment",
    voiceStyle: "Iconic",
    createdAt: new Date().toISOString(),
    sales: 0,
    rating: 5.0,
    celebrityName: "Amitabh Bachchan",
    voiceId: "amitabh_bachchan",
    referenceId: "812fce4e0c4e40e68fb5eb0f023c0b1a", // Example Fish Audio ID for Deep Baritone
    image: "https://via.placeholder.com/400?text=Amitabh+Bachchan",
  },
  {
    id: "donald_trump",
    name: "Donald Trump",
    description: "💎 PREMIUM: Iconic baritone and energetic style of Donald Trump. Powered by Fish Audio s1 model.",
    creator: "Celebrity",
    prompt: "You are Donald Trump. Speak with his unique energetic tone, emphasis on specific words, and charismatic style.",
    price: 1.0,
    category: "Entertainment",
    voiceStyle: "Iconic",
    createdAt: new Date().toISOString(),
    sales: 0,
    rating: 5.0,
    celebrityName: "Donald Trump",
    voiceId: "donald_trump",
    referenceId: "8ef4a238714b45718ce04243307c57a7", // Energetic Male reference ID from user
    image: "https://via.placeholder.com/400?text=Donald+Trump",
  },
];

// GET - List all voice agents
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let filtered = [...voiceAgents];

  if (category) {
    filtered = filtered.filter((agent) => agent.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower)
    );
  }

  const sort = searchParams.get("sort");
  if (sort) {
    filtered.sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }

  return NextResponse.json(filtered);
}

// POST - Create a new voice agent
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, description, prompt, price, category, voiceStyle, creator, nftMintAddress, voiceId, image } = data;

    if (!name || !description || !prompt || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newAgent: VoiceAgent = {
      id: voiceId || Date.now().toString(),
      name,
      description,
      creator: creator || "Anonymous",
      prompt,
      price: parseFloat(price),
      category: category || "General",
      voiceStyle: voiceStyle || "Neutral",
      createdAt: new Date().toISOString(),
      sales: 0,
      rating: 5.0,
      nftMintAddress,
      voiceId,
      image
    };

    voiceAgents.push(newAgent);

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create voice agent" },
      { status: 500 }
    );
  }
}

// PUT - Update voice agent (purchase, rating, etc.)
export async function PUT(req: NextRequest) {
  try {
    const { id, action, ...data } = await req.json();

    const agentIndex = voiceAgents.findIndex((a) => a.id === id);
    if (agentIndex === -1) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (action === "purchase") {
      voiceAgents[agentIndex].sales += 1;
    } else if (action === "rate") {
      // Simple rating update (in production, calculate average)
      if (data.rating) {
        voiceAgents[agentIndex].rating = data.rating;
      }
    } else {
      // Update agent details
      voiceAgents[agentIndex] = { ...voiceAgents[agentIndex], ...data };
    }

    return NextResponse.json(voiceAgents[agentIndex]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update voice agent" },
      { status: 500 }
    );
  }
}

