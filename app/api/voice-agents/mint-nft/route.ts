import { NextRequest, NextResponse } from "next/server";

/**
 * Voice listing registration for Monad — no Solana minting.
 * Client uploads metadata / IPFS first, then posts here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      creator,
      metadataUri,
      imageUri,
      category,
    } = body;

    if (!name || !creator) {
      return NextResponse.json(
        { error: "name and creator (0x address) required" },
        { status: 400 }
      );
    }

    const listingId = `monad-${Date.now()}-${String(creator).slice(2, 10)}`;

    return NextResponse.json({
      success: true,
      chain: "monad-testnet",
      listingId,
      name,
      description: description || "",
      price: price || 0.1,
      creator,
      metadataUri: metadataUri || null,
      imageUri: imageUri || null,
      category: category || "Community",
      message:
        "Listing registered. On-chain ERC-721 mint can be added later; marketplace purchases use native MON transfers.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
