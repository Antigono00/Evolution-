// src/context/RootProvider.jsx
import React from 'react';
import { GameProvider } from './GameContext';
import { EvolvingCreaturesProvider } from './EvolvingCreaturesContext';
import { RadixConnectProvider } from './RadixConnectContext';

// The same dApp address you had before
const dAppDefinitionAddress =
  'account_rdx129994zq674n4mturvkqz7cz9t7gmtn5sjspxv7py2ahqnpdvxjsqum';

const RootProvider = ({ children }) => {
  return (
    <RadixConnectProvider dAppDefinitionAddress={dAppDefinitionAddress}>
      <GameProvider>
        {(gameContext) => (
          <EvolvingCreaturesProvider addNotification={gameContext.addNotification}>
            {children}
          </EvolvingCreaturesProvider>
        )}
      </GameProvider>
    </RadixConnectProvider>
  );
};

export default RootProvider;
