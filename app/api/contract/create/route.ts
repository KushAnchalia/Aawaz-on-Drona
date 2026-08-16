import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const lower = description.toLowerCase();
    let contractName = "MonadAgentContract";
    let body = "";

    if (lower.includes("crowdfunding")) {
      contractName = "CrowdfundingCampaign";
      body = `
    address public admin;
    uint256 public goal;
    uint256 public amountRaised;
    mapping(address => uint256) public donations;

    constructor(uint256 _goal) {
        admin = msg.sender;
        goal = _goal;
    }

    function donate() external payable {
        require(msg.value > 0, "Must send MON");
        donations[msg.sender] += msg.value;
        amountRaised += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == admin, "Unauthorized");
        require(amount <= address(this).balance, "Insufficient");
        (bool ok, ) = payable(admin).call{value: amount}("");
        require(ok, "Transfer failed");
    }`;
    } else if (lower.includes("token") || lower.includes("erc20")) {
      contractName = "SimpleToken";
      body = `
    string public name = "AawazToken";
    string public symbol = "AAZ";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }`;
    } else {
      body = `
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function ping() external view returns (string memory) {
        return "Aawaz on Monad Testnet";
    }

    receive() external payable {}`;
    }

    const code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ${contractName}
/// @notice Generated for Monad Testnet (EVM) — deploy with Foundry/Hardhat
/// @dev Native token is MON (18 decimals). Chain ID: 10143
contract ${contractName} {
${body}
}
`;

    return NextResponse.json({
      success: true,
      code: code.trim(),
      chain: "monad-testnet",
      language: "solidity",
      explanation:
        "Generated Solidity contract for Monad Testnet. Deploy with Foundry/Hardhat using RPC https://testnet-rpc.monad.xyz (chainId 10143).",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate contract" },
      { status: 500 }
    );
  }
}
