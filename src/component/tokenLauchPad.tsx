"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js"
import { useState } from "react"
import {
  TYPE_SIZE,
  LENGTH_SIZE,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  createInitializeInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  ExtensionType,
} from "@solana/spl-token"
import React from "react"

export function TokenLaunchpad() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [tokenName, setTokenName] = useState<string>("")
  const [TokenSymbol, setTokenSymbol] = useState<string>("")
  const [TokenImage, setTokenImage] = useState<string>("")
  const [initialSupply, SetInitialSupply] = useState<string | undefined>("")

  // Placeholder for pack function, replace with actual implementation
  const pack = (metadata: any) => {
    // This is a placeholder, replace with your actual pack function logic
    return JSON.stringify(metadata)
  }

  async function createToken() {
    const mintKeypair = Keypair.generate()
    const metadata = {
      mint: mintKeypair.publicKey,
      name: tokenName,
      symbol: TokenSymbol,
      uri: TokenImage,
      additionalMeatadata: [],
    }
    const mintLen = getMintLen([ExtensionType.MetadataPointer])
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen)

    if (!wallet.publicKey) {
      throw new Error("Wallet is not connected")
    }

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintKeypair.publicKey,
        metadata: mintKeypair.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      }),
    )
    transaction.feePayer = wallet.publicKey
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    transaction.partialSign(mintKeypair)

    await wallet.sendTransaction(transaction, connection)
    console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`)
    const assciatedToken = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    )

    const transaction2 = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        assciatedToken,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
      ),
    )
    await wallet.sendTransaction(transaction2, connection)
    const transaction3 = new Transaction().add(
      createMintToInstruction(
        mintKeypair.publicKey,
        assciatedToken,
        wallet.publicKey,
        10000000,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    )
    await wallet.sendTransaction(transaction3, connection)
    console.log("Minted")
  }
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex justify-center items-center p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 backdrop-blur-sm bg-opacity-90">
        <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
          Solana Token Launchpad
        </h1>

        <div className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Token Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-purple-500 focus:bg-white focus:ring-0 text-sm transition duration-300 ease-in-out"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Token Symbol"
              value={TokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-purple-500 focus:bg-white focus:ring-0 text-sm transition duration-300 ease-in-out"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Token Image URL"
              value={TokenImage}
              onChange={(e) => setTokenImage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-purple-500 focus:bg-white focus:ring-0 text-sm transition duration-300 ease-in-out"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Initial Supply"
              value={initialSupply}
              onChange={(e) => SetInitialSupply(e.target.value || undefined)}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-purple-500 focus:bg-white focus:ring-0 text-sm transition duration-300 ease-in-out"
            />
          </div>

          <button
            onClick={createToken}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-1 focus:outline-none"
          >
            Create Token
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Create your own SPL Token-2022 with metadata</p>
        </div>
      </div>
    </div>
  )
}

