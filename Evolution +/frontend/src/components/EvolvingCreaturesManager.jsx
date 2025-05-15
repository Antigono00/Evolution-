// src/components/EvolvingCreaturesManager.jsx
import React from 'react';
import { useEvolvingCreatures } from '../context/EvolvingCreaturesContext';
import EvolvingCreatureMinter from './EvolvingCreatureMinter';
import MyCreaturesPanel from './MyCreaturesPanel';

/**
 * Component to manage Evolving Creatures functionality
 * This centralizes all creature-related UI components and logic
 */
const EvolvingCreaturesManager = () => {
  // Use the Evolving Creatures context
  const {
    showCreatureMinter,
    setShowCreatureMinter,
    showMyCreaturesPanel,
    setShowMyCreaturesPanel
  } = useEvolvingCreatures();

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

