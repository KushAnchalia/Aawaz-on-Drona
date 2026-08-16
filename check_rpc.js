const { Connection } = require('@solana/web3.js');

async function checkConnection() {
  const url = "https://api.devnet.solana.com";
  console.log(`Connecting to ${url}...`);
  const connection = new Connection(url, 'confirmed');
  try {
    const version = await connection.getVersion();
    console.log("Connection successful:", version);
    
    // Check balance of a known devnet address (or random) just to ensure call works
    // Using a random public key for test: "7vid8GV2..." as user provided (simulated)
    // Actually I don't have the full key. I'll just check the version for now.
    
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

checkConnection();
