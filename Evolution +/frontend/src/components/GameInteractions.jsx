// src/components/GameInteractions.jsx
import React, { useContext, useCallback } from 'react';
import { GameContext } from '../context/GameContext';

/**
 * Component responsible for handling game interactions
 * Separates interaction logic from rendering and state management
 */
const GameInteractions = () => {
  const {
    player,
    activateMachine,
    machineTypes,
    INTERACTION_RANGE,
    machines,
    currentRoom,
    pets,
    setSelectedPet,
    setShowPetInteractionMenu,
    setSelectedMachineToMove,
    setInMoveMode,
    setSelectedPetToMove,
    setInPetMoveMode,
    handleCatLairActivation,
    showCreatureMinter,
    setShowCreatureMinter,
    showMyCreaturesPanel,
    setShowMyCreaturesPanel,
    addNotification
  } = useContext(GameContext);

  // Helper functions
  const distance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const getPlayerCenter = () => {
    return {
      px: player.x + player.width / 2,
      py: player.y + player.height / 2
    };
  };

  const getMachineCenter = (m) => {
    const gridSize = 64; // This should be a prop or from context
    const half = gridSize;
    return {
      mx: m.x + half,
      my: m.y + half
    };
  };
  
  const getPetCenter = (p) => {
    const gridSize = 64; // This should be a prop or from context
    const petSize = gridSize * 1.5;
    return {
      px: p.x + petSize / 2,
      py: p.y + petSize / 2
    };
  };

  const isPlayerInRangeOf = (entity, isEntity = 'machine') => {
    const { px, py } = getPlayerCenter();
    
    if (isEntity === 'machine') {
      const { mx, my } = getMachineCenter(entity);
      return distance(px, py, mx, my) <= INTERACTION_RANGE;
    } else {
      const petCenter = getPetCenter(entity);
      return distance(px, py, petCenter.px, petCenter.py) <= INTERACTION_RANGE;
    }
  };

  const getMachinesInCurrentRoom = useCallback(() => {
    return machines.filter(machine => (machine.room || 1) === currentRoom);
  }, [machines, currentRoom]);

  const getPetsInCurrentRoom = useCallback(() => {
    return pets.filter(pet => (pet.room || 1) === currentRoom);
  }, [pets, currentRoom]);

  const findClosestMachineInRange = () => {
    const { px, py } = getPlayerCenter();
    let bestMachine = null;
    let bestDist = Infinity;

    // Only consider machines in the current room
    const currentRoomMachines = getMachinesInCurrentRoom();
    
    currentRoomMachines.forEach((m) => {
      const { mx, my } = getMachineCenter(m);
      const dist = distance(px, py, mx, my);
      if (dist < bestDist && dist <= INTERACTION_RANGE) {
        bestDist = dist;
        bestMachine = m;
      }
    });

    return bestMachine;
  };
  
  const findClosestPetInRange = () => {
    const { px, py } = getPlayerCenter();
    let bestPet = null;
    let bestDist = Infinity;

    // Only consider pets in the current room
    const currentRoomPets = getPetsInCurrentRoom();
    
    currentRoomPets.forEach((p) => {
      const petCenter = getPetCenter(p);
      const dist = distance(px, py, petCenter.px, petCenter.py);
      if (dist < bestDist && dist <= INTERACTION_RANGE) {
        bestDist = dist;
        bestPet = p;
      }
    });

    return bestPet;
  };

  // Handle incubator interaction
  const handleIncubatorInteraction = (machine) => {
    console.log('handleIncubatorInteraction called for machine:', machine);
    
    if (!machine || machine.type !== 'incubator') {
      console.error('Invalid machine passed to handleIncubatorInteraction:', machine);
      return;
    }
    
    // The actual implementation will be in the GameCanvas component
    // This method just provides a standardized way to handle the interaction
    return {
      type: 'incubator',
      machineId: machine.id
    };
  };
  
  // Handle FOMO HIT interaction
  const handleFomoHitInteraction = (machine) => {
    console.log('handleFomoHitInteraction called for machine:', machine);
    
    if (!machine || machine.type !== 'fomoHit') {
      console.error('Invalid machine passed to handleFomoHitInteraction:', machine);
      return;
    }
    
    // For FOMO HIT, if it's first activation (lastActivated === 0) AND 
    // not already in the minting process (provisionalMint !== 1), show minter
    if (machine.lastActivated === 0 && machine.provisionalMint !== 1) {
      return {
        type: 'fomoHit',
        machineId: machine.id,
        action: 'mint'
      };
    } else {
      // For subsequent activations or if minting is in progress,
      // just activate normally to collect TCorvax
      activateMachine(machine);
      return {
        type: 'fomoHit',
        machineId: machine.id,
        action: 'activate'
      };
    }
  };
  
  // Handle activation for Cat's Lair with pet logic
  const handleActivation = (machine) => {
    // Special handling for Cat's Lair - check if we should show pet prompt
    if (machine.type === 'catLair') {
      const showingPetPrompt = handleCatLairActivation(machine);
      if (showingPetPrompt) {
        return {
          type: 'catLair',
          machineId: machine.id,
          action: 'showPetPrompt'
        };
      }
    }
    
    // Normal machine activation
    activateMachine(machine);
    return {
      type: machine.type,
      machineId: machine.id,
      action: 'activate'
    };
  };

  const handlePetInteraction = (pet) => {
    setSelectedPet(pet);
    setShowPetInteractionMenu(true);
    return {
      type: 'pet',
      petId: pet.id,
      action: 'showInteractionMenu'
    };
  };

  const handleCreatureMinting = () => {
    setShowCreatureMinter(true);
    return {
      type: 'creature',
      action: 'showMinter'
    };
  };

  const handleViewCreatures = () => {
    setShowMyCreaturesPanel(true);
    return {
      type: 'creature',
      action: 'showMyCreatures'
    };
  };

  const handleMoveMachineStart = (machine) => {
    setSelectedMachineToMove(machine.id);
    setInMoveMode(true);
    return {
      type: 'machine',
      machineId: machine.id,
      action: 'startMove'
    };
  };

  const handleMovePetStart = (pet) => {
    setSelectedPetToMove(pet.id);
    setInPetMoveMode(true);
    return {
      type: 'pet',
      petId: pet.id,
      action: 'startMove'
    };
  };

  // Expose all useful interaction handlers in a single object
  return {
    distance,
    getPlayerCenter,
    getMachineCenter,
    getPetCenter,
    isPlayerInRangeOf,
    getMachinesInCurrentRoom,
    getPetsInCurrentRoom,
    findClosestMachineInRange,
    findClosestPetInRange,
    handleIncubatorInteraction,
    handleFomoHitInteraction,
    handleActivation,
    handlePetInteraction,
    handleCreatureMinting,
    handleViewCreatures,
    handleMoveMachineStart,
    handleMovePetStart
  };
};

export default GameInteractions;
