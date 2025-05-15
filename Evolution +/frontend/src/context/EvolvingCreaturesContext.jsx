// src/context/EvolvingCreaturesContext.jsx
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useRadixConnect } from './RadixConnectContext';

// Create the context
export const EvolvingCreaturesContext = createContext();

// Hook to use the context
export const useEvolvingCreatures = () => {
  const context = useContext(EvolvingCreaturesContext);
  if (!context) {
    throw new Error('useEvolvingCreatures must be used within an EvolvingCreaturesProvider');
  }
  return context;
};

export const EvolvingCreaturesProvider = ({ children, addNotification }) => {
  // Radix context
  const { connected, accounts, rdt } = useRadixConnect();
  
  // Creature NFTs states
  const [creatureNfts, setCreatureNfts] = useState([]);
  const [toolNfts, setToolNfts] = useState([]);
  const [spellNfts, setSpellNfts] = useState([]);

  // Creature UI states
  const [showCreatureMinter, setShowCreatureMinter] = useState(false);
  const [showMyCreaturesPanel, setShowMyCreaturesPanel] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [creatureStatsData, setCreatureStatsData] = useState({
    allocatedPoints: {
      energy: 0,
      strength: 0,
      magic: 0,
      stamina: 0, 
      speed: 0
    },
    totalAllocated: 0,
    maxAllocatable: 2
  });

  // Fetch creature NFTs
  const loadCreatureNfts = useCallback(async () => {
    try {
      const resp = await axios.get('/api/getCreatureNfts');
      if (resp.data.creatures) {
        setCreatureNfts(resp.data.creatures);
      }
      if (resp.data.tools) {
        setToolNfts(resp.data.tools);
      }
      if (resp.data.spells) {
        setSpellNfts(resp.data.spells);
      }
    } catch (error) {
      console.error('Error loading creature NFTs:', error);
    }
  }, []);

  // Function to fetch user's creatures from the blockchain
  const fetchUserCreatures = useCallback(async () => {
    if (!connected || !accounts || accounts.length === 0) {
      return [];
    }
    
    try {
      // Try to get from our backend
      const response = await axios.get('/api/getUserCreatures');
      if (response.data && response.data.creatures) {
        setCreatureNfts(response.data.creatures);
        return response.data.creatures;
      }
      
      // If backend doesn't provide this, we'll use existing creatures
      return creatureNfts;
    } catch (error) {
      console.error('Error fetching user creatures:', error);
      return [];
    }
  }, [connected, accounts, creatureNfts]);

  // Function to handle stat allocation during upgrade
  const handleStatAllocation = useCallback((stat, value) => {
    setCreatureStatsData(prev => {
      // Calculate new total after this change
      const currentValue = prev.allocatedPoints[stat];
      const delta = value - currentValue;
      const newTotal = prev.totalAllocated + delta;
      
      // Enforce max allocatable points
      if (newTotal > prev.maxAllocatable) {
        return prev; // Don't allow exceeding max
      }
      
      // Update the stat
      return {
        ...prev,
        allocatedPoints: {
          ...prev.allocatedPoints,
          [stat]: value
        },
        totalAllocated: newTotal
      };
    });
  }, []);

  // Reset stat allocation
  const resetStatAllocation = useCallback(() => {
    setCreatureStatsData({
      allocatedPoints: {
        energy: 0,
        strength: 0,
        magic: 0,
        stamina: 0,
        speed: 0
      },
      totalAllocated: 0,
      maxAllocatable: 2
    });
  }, []);

  // Handle NFT minting with Radix
  const initiateMintTransaction = useCallback(async (manifest, machineId) => {
    if (!connected || !accounts || accounts.length === 0) {
      addNotification("Connect Radix wallet and share account!", 400, 300, "#FF3D00");
      return null;
    }

    try {
      console.log("Initiating mint transaction with manifest:", manifest);
      
      // Make sure the RadixDappToolkit is ready
      if (!rdt) {
        console.error("Radix Dapp Toolkit not initialized");
        return null;
      }
      
      // Send the transaction to the wallet
      const result = await rdt.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });
      
      if (result.isErr()) {
        console.error("Transaction error:", result.error);
        addNotification("Transaction failed", 400, 300, "#FF3D00");
        return null;
      }
      
      const intentHash = result.value.transactionIntentHash;
      console.log("Transaction sent with intent hash:", intentHash);
      
      // Add tracking notification
      addNotification("NFT minting transaction sent!", 400, 300, "#FF3D00");
      
      return intentHash;
    } catch (error) {
      console.error("Error in mint transaction:", error);
      addNotification("Transaction error: " + error.message, 400, 300, "#FF3D00");
      return null;
    }
  }, [connected, accounts, rdt, addNotification]);

  // Poll transaction status
  const pollTransactionStatus = useCallback(async (intentHash, machineId) => {
    if (!intentHash) return;
    
    try {
      const response = await fetch('/api/checkMintStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intentHash,
          machineId
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Transaction status:", data);
      
      const transactionStatus = data.transactionStatus;
      
      if (transactionStatus.status === "CommittedSuccess") {
        addNotification("NFT minted successfully!", 400, 300, "#4CAF50");
        await loadCreatureNfts(); // Refresh the NFT data
        return true;
      } else if (transactionStatus.status === "Failed" || transactionStatus.status === "Rejected") {
        addNotification("Mint failed: " + (transactionStatus.error_message || "Unknown error"), 400, 300, "#FF3D00");
        return true;
      }
      
      // Still pending
      return false;
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return false;
    }
  }, [addNotification, loadCreatureNfts]);

  // Function to upgrade creature stats
  const upgradeCreatureStats = useCallback(async (creature, statPoints) => {
    if (!connected || !accounts || accounts.length === 0) {
      addNotification("Connect Radix wallet and share account!", 400, 300, "#FF3D00");
      return null;
    }
    
    try {
      // Create the transaction manifest for upgrading stats
      const response = await fetch('/api/getUpgradeStatsManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          creatureId: creature.id,
          energy: statPoints.energy || 0,
          strength: statPoints.strength || 0,
          magic: statPoints.magic || 0,
          stamina: statPoints.stamina || 0,
          speed: statPoints.speed || 0
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.manifest) {
        throw new Error("Server didn't return upgrade manifest");
      }
      
      // Send the transaction to the wallet
      const hash = await initiateMintTransaction(data.manifest, 'creatureUpgrade');
      
      if (hash) {
        // Start polling for status
        const isComplete = await pollTransactionStatus(hash, 'creatureUpgrade');
        if (isComplete) {
          addNotification("Stats upgraded successfully!", 400, 300, "#4CAF50");
          await loadCreatureNfts(); // Refresh the NFT data
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error upgrading stats:", error);
      addNotification("Upgrade error: " + error.message, 400, 300, "#FF3D00");
      return false;
    }
  }, [connected, accounts, addNotification, initiateMintTransaction, pollTransactionStatus, loadCreatureNfts]);

  // Function to evolve a creature to next form
  const evolveCreature = useCallback(async (creature) => {
    if (!connected || !accounts || accounts.length === 0) {
      addNotification("Connect Radix wallet and share account!", 400, 300, "#FF3D00");
      return null;
    }
    
    try {
      // Create the transaction manifest for evolution
      const response = await fetch('/api/getEvolveManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          creatureId: creature.id
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.manifest) {
        throw new Error("Server didn't return evolution manifest");
      }
      
      // Send the transaction to the wallet
      const hash = await initiateMintTransaction(data.manifest, 'creatureEvolve');
      
      if (hash) {
        // Start polling for status
        const isComplete = await pollTransactionStatus(hash, 'creatureEvolve');
        if (isComplete) {
          addNotification("Creature evolved successfully!", 400, 300, "#4CAF50");
          await loadCreatureNfts(); // Refresh the NFT data
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error evolving creature:", error);
      addNotification("Evolution error: " + error.message, 400, 300, "#FF3D00");
      return false;
    }
  }, [connected, accounts, addNotification, initiateMintTransaction, pollTransactionStatus, loadCreatureNfts]);

  // Format resource for display
  const formatResource = useCallback((val) => {
    if (!val && val !== 0) return "0.0";
    return val.toFixed(1);
  }, []);

  return (
    <EvolvingCreaturesContext.Provider
      value={{
        // NFT states
        creatureNfts,
        toolNfts,
        spellNfts,
        loadCreatureNfts,
        
        // UI states
        showCreatureMinter,
        setShowCreatureMinter,
        showMyCreaturesPanel,
        setShowMyCreaturesPanel,
        selectedCreature,
        setSelectedCreature,
        
        // Stats and upgrades
        creatureStatsData,
        handleStatAllocation,
        resetStatAllocation,
        
        // Creature functions
        fetchUserCreatures,
        upgradeCreatureStats,
        evolveCreature,
        
        // Transaction handling
        initiateMintTransaction,
        pollTransactionStatus,
        
        // Utilities
        formatResource
      }}
    >
      {children}
    </EvolvingCreaturesContext.Provider>
  );
};
