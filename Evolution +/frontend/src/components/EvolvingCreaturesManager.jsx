// src/components/EvolvingCreaturesManager.jsx
import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';
import EvolvingCreatureMinter from './EvolvingCreatureMinter';
import MyCreaturesPanel from './MyCreaturesPanel';

/**
 * Component to manage Evolving Creatures functionality
 * This centralizes all creature-related UI components and logic
 */
const EvolvingCreaturesManager = () => {
  // Game context
  const {
    showCreatureMinter,
    setShowCreatureMinter,
    showMyCreaturesPanel,
    setShowMyCreaturesPanel
  } = useContext(GameContext);

  // Radix Connect context
  const {
    connected,
    accounts
  } = useRadixConnect();

  return (
    <>
      {/* Evolving Creatures Minter Modal */}
      {showCreatureMinter && (
        <EvolvingCreatureMinter
          onClose={() => setShowCreatureMinter(false)}
        />
      )}
      
      {/* My Creatures Panel */}
      {showMyCreaturesPanel && (
        <MyCreaturesPanel
          onClose={() => setShowMyCreaturesPanel(false)}
        />
      )}
    </>
  );
};

export default EvolvingCreaturesManager;
