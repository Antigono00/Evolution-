// src/components/GameCanvas.jsx - Refactored version
import { useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';
import IncubatorWidget from './IncubatorWidget';
import FomoHitMinter from './FomoHitMinter';
import RoomNavigation from './RoomNavigation';
import PetBuyPrompt from './PetBuyPrompt';
import PetInteractionMenu from './PetInteractionMenu';
// Import the new components we created
import GameCanvasRenderer from './GameCanvasRenderer';
import GameInteractions from './GameInteractions';
import EvolvingCreaturesManager from './EvolvingCreaturesManager';

const GameCanvas = () => {
  // Refs
  const canvasRef = useRef(null);
  const gameContainerRef = useRef(null);
  const requestRef = useRef(null);
  const assetsRef = useRef({
    backgroundImage: null,
    background2Image: null,
    playerImage: null,
    catsLairImage: null,
    reactorImage: null,
    amplifierImage: null,
    incubatorImage: null,
    fomoHitImage: null,
    catImage: null,
    loaded: false
  });

  // Get context from GameContext
  const {
    isLoggedIn,
    machines,
    machineTypes,
    particles,
    notifications,
    gridSize,
    activateMachine,
    moveMachine,
    saveLayout,
    MACHINE_COOLDOWN_MS,
    INTERACTION_RANGE,
    addNotification,
    tcorvax,
    player,
    setPlayer,
    // Room navigation states
    currentRoom,
    setCurrentRoom,
    roomsUnlocked,
    getMachinesInCurrentRoom,
    // Machine movement states
    selectedMachineToMove,
    setSelectedMachineToMove,
    inMoveMode,
    setInMoveMode,
    // Pet states and functions
    pets,
    getPetsInCurrentRoom,
    buyPet,
    movePet,
    selectedPetToMove,
    setSelectedPetToMove,
    inPetMoveMode,
    setInPetMoveMode,
    getPetAtPosition,
    handleCatLairActivation,
  } = useContext(GameContext);

  // Get Radix connection state
  const {
    connected: isRadixConnected,
    accounts: radixAccounts,
    updateAccountSharing
  } = useRadixConnect();

  // Initialize the GameInteractions
  const interactions = GameInteractions();

  // State
  const [keys, setKeys] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [targetX, setTargetX] = useState(player.x);
  const [targetY, setTargetY] = useState(player.y);
  const [autoTargetMachine, setAutoTargetMachine] = useState(null);
  const [autoPetTarget, setAutoPetTarget] = useState(null);

  // Widget states
  const [showIncubatorWidget, setShowIncubatorWidget] = useState(false);
  const [selectedIncubator, setSelectedIncubator] = useState(null);
  const [showFomoHitMinter, setShowFomoHitMinter] = useState(false);
  const [selectedFomoHit, setSelectedFomoHit] = useState(null);
  const [showPetBuyPrompt, setShowPetBuyPrompt] = useState(false);
  const [selectedCatLair, setSelectedCatLair] = useState(null);
  const [showPetInteractionMenu, setShowPetInteractionMenu] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // Machine movement state
  const [movingMachine, setMovingMachine] = useState(null);
  const [moveTargetRoom, setMoveTargetRoom] = useState(currentRoom);
  const [moveCursorPosition, setMoveCursorPosition] = useState({ x: 0, y: 0 });
  const [showMovePreview, setShowMovePreview] = useState(false);
  const [moveConfirmationOpen, setMoveConfirmationOpen] = useState(false);
  const [moveInstructionsVisible, setMoveInstructionsVisible] = useState(false);
  const [positionSelected, setPositionSelected] = useState(false);

  // Load assets on mount
  useEffect(() => {
    const imageSources = {
      backgroundImage: '/assets/Background.png',
      background2Image: '/assets/Background2.png',
      playerImage: '/assets/Player.png',
      catsLairImage: '/assets/CatsLair.png',
      reactorImage: '/assets/Reactor.png',
      amplifierImage: '/assets/Amplifier.png',
      incubatorImage: '/assets/Incubator.png',
      fomoHitImage: '/assets/FomoHit.png',
      catImage: '/assets/Cat.png'
    };

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          console.log(`Successfully loaded image: ${src}`);
          resolve(img);
        };
        img.onerror = (err) => {
          console.error(`Failed to load image: ${src}, using fallback`, err);
          resolve(null);
        };
      });
    };

    const loadAssets = async () => {
      try {
        console.log('Starting to load assets...');

        const loadedImages = {};
        for (const [key, src] of Object.entries(imageSources)) {
          console.log(`Loading ${key} from ${src}...`);
          loadedImages[key] = await loadImage(src);
        }

        assetsRef.current = {
          ...loadedImages,
          loaded: true
        };

        console.log('All assets loaded successfully:', assetsRef.current);
      } catch (error) {
        console.error('Error loading game assets:', error);
      }
    };

    loadAssets();
  }, []);

  // Center player when switching rooms
  useEffect(() => {
    // Reset player position when changing rooms
    const newPlayerX = 400 - player.width / 2;
    const newPlayerY = 300 - player.height / 2;
    
    setPlayer({
      ...player,
      x: newPlayerX,
      y: newPlayerY,
      velocityX: 0,
      velocityY: 0
    });
    
    // Reset auto-targeting and targets as well
    setAutoTargetMachine(null);
    setAutoPetTarget(null);
    setTargetX(newPlayerX);
    setTargetY(newPlayerY);
    
    // Update the move target room when rooms are switched during move mode
    if (inMoveMode && movingMachine) {
      console.log(`Setting move target room to ${currentRoom}`);
      setMoveTargetRoom(currentRoom);
    }
  }, [currentRoom, setPlayer, player.width, player.height, inMoveMode, movingMachine]);

  // Listen for machine move requests from MoveMachines component
  useEffect(() => {
    // When a machine is selected for movement
    if (selectedMachineToMove && inMoveMode) {
      const machineToMove = machines.find(m => m.id === selectedMachineToMove);
      
      if (machineToMove && !movingMachine) {
        console.log('Starting machine move mode for:', machineToMove);
        setMovingMachine(machineToMove);
        setMoveTargetRoom(currentRoom);  // Set initial target room to current room
        setShowMovePreview(true);
        setMoveCursorPosition({
          x: machineToMove.x,
          y: machineToMove.y
        });
        setMoveInstructionsVisible(true);
        // Reset position selected state
        setPositionSelected(false);
        
        // Hide instructions after a delay
        const timer = setTimeout(() => {
          setMoveInstructionsVisible(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else if (!inMoveMode && movingMachine) {
      // Clear move mode if it's been canceled
      setMovingMachine(null);
      setShowMovePreview(false);
      setMoveConfirmationOpen(false);
      setPositionSelected(false); // Reset position selected state
    }
  }, [machines, selectedMachineToMove, inMoveMode, movingMachine, currentRoom]);

  // Handle pet movement mode
  useEffect(() => {
    // When a pet is selected for movement
    if (selectedPetToMove && inPetMoveMode) {
      const petToMove = pets.find(p => p.id === selectedPetToMove);
      
      if (petToMove) {
        console.log('Starting pet move mode for:', petToMove);
        setShowMovePreview(true);
        setMoveCursorPosition({
          x: petToMove.x,
          y: petToMove.y
        });
        setMoveInstructionsVisible(true);
        setPositionSelected(false);
        
        // Hide instructions after a delay
        const timer = setTimeout(() => {
          setMoveInstructionsVisible(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else if (!inPetMoveMode && selectedPetToMove) {
      // Clear move mode if it's been canceled
      setSelectedPetToMove(null);
      setShowMovePreview(false);
      setPositionSelected(false);
    }
  }, [pets, selectedPetToMove, inPetMoveMode]);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      );
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys((prev) => ({ ...prev, [e.key]: true }));

      // Space bar to activate nearest machine or confirm move
      if (e.key === ' ') {
        // If in pet move mode and position selected, confirm the move
        if (selectedPetToMove && inPetMoveMode && positionSelected) {
          handlePetMoveConfirm();
          e.preventDefault();
          return;
        }
        
        // If in machine move mode and position not selected, select the current position
        if (movingMachine && showMovePreview && !positionSelected) {
          setPositionSelected(true);
          setMoveConfirmationOpen(true);
          e.preventDefault();
          return;
        }
        
        // If position is already selected for machine move, toggle the confirmation dialog
        if (movingMachine && showMovePreview && positionSelected) {
          setMoveConfirmationOpen(!moveConfirmationOpen);
          e.preventDefault();
          return;
        }
        
        // Otherwise activate nearest machine or pet
        const nearestMachine = interactions.findClosestMachineInRange();
        if (nearestMachine) {
          if (nearestMachine.type === 'incubator') {
            handleIncubatorInteraction(nearestMachine);
          } else if (nearestMachine.type === 'fomoHit') {
            handleFomoHitInteraction(nearestMachine);
          } else if (nearestMachine.type === 'catLair') {
            handleActivation(nearestMachine);
          } else {
            activateMachine(nearestMachine);
          }
        } else {
          // Check if there's a pet nearby
          const nearestPet = interactions.findClosestPetInRange();
          if (nearestPet) {
            setSelectedPet(nearestPet);
            setShowPetInteractionMenu(true);
          }
        }
        e.preventDefault();
      }
      
      // Escape key to cancel move mode
      if (e.key === 'Escape') {
        if (positionSelected) {
          // If a position is selected, just cancel the position selection
          setPositionSelected(false);
          setMoveConfirmationOpen(false);
          e.preventDefault();
        } else if (movingMachine || inMoveMode) {
          // Cancel machine move mode
          handleMoveCancel();
          e.preventDefault();
        } else if (selectedPetToMove || inPetMoveMode) {
          // Cancel pet move mode
          setSelectedPetToMove(null);
          setInPetMoveMode(false);
          setShowMovePreview(false);
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player, machines, pets, activateMachine, movingMachine, selectedPetToMove, showMovePreview, inMoveMode, inPetMoveMode, positionSelected, moveConfirmationOpen]);

  // Canvas click/tap handlers for BOTH mobile and desktop
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleCanvasTap = (e) => {
      e.preventDefault();

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      let tapX, tapY;
      if (e.touches && e.touches.length > 0) {
        tapX = (e.touches[0].clientX - rect.left) * scaleX;
        tapY = (e.touches[0].clientY - rect.top) * scaleY;
        console.log(`Touch detected at (${tapX}, ${tapY})`);
      } else {
        tapX = (e.clientX - rect.left) * scaleX;
        tapY = (e.clientY - rect.top) * scaleY;
        console.log(`Click detected at (${tapX}, ${tapY})`);
      }
      
      handleCanvasClick(tapX, tapY);
    };

    // Use passive: false to ensure we can prevent default behavior
    canvasRef.current.addEventListener('touchstart', handleCanvasTap, { passive: false });
    canvasRef.current.addEventListener('mousedown', handleCanvasTap);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchstart', handleCanvasTap);
        canvasRef.current.removeEventListener('mousedown', handleCanvasTap);
      }
    };
  }, [canvasRef, machines, pets, player, gridSize, movingMachine, selectedPetToMove, showMovePreview, inMoveMode, inPetMoveMode, positionSelected]);

  // Add mouse move handler for showing move preview (only for desktop)
  useEffect(() => {
    if (!showMovePreview || !canvasRef.current) return;
    
    const handleMouseMove = (e) => {
      // Only update position if a position hasn't been selected yet
      if (positionSelected) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      
      const moveX = (e.clientX - rect.left) * scaleX;
      const moveY = (e.clientY - rect.top) * scaleY;
      
      // Snap to grid
      const snappedX = Math.floor(moveX / gridSize) * gridSize;
      const snappedY = Math.floor(moveY / gridSize) * gridSize;
      
      // Enforce boundaries based on what's being moved (machine or pet)
      const entitySize = movingMachine ? gridSize * 2 : gridSize * 1.5; // Pets are smaller than machines
      const maxX = 800 - entitySize;
      const maxY = 600 - entitySize;
      
      let boundedX = snappedX;
      let boundedY = snappedY;
      
      if (boundedX < 0) boundedX = 0;
      if (boundedX > maxX) boundedX = maxX;
      if (boundedY < 0) boundedY = 0;
      if (boundedY > maxY) boundedY = maxY;
      
      setMoveCursorPosition({ x: boundedX, y: boundedY });
    };
    
    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [showMovePreview, canvasRef, gridSize, positionSelected, movingMachine]);

  // Handle incubator interaction
  const handleIncubatorInteraction = (machine) => {
    console.log('handleIncubatorInteraction called for machine:', machine);
    
    if (!machine || machine.type !== 'incubator') {
      console.error('Invalid machine passed to handleIncubatorInteraction:', machine);
      return;
    }
    
    console.log('Radix connection status:', isRadixConnected);
    console.log('Radix accounts:', radixAccounts);

    // Open the IncubatorWidget regardless of connection status -
    // the widget will handle connection requirements internally
    setSelectedIncubator(machine);
    setShowIncubatorWidget(true);
  };
  
  // Handle FOMO HIT interaction
  const handleFomoHitInteraction = (machine) => {
    console.log('handleFomoHitInteraction called for machine:', machine);
    
    if (!machine || machine.type !== 'fomoHit') {
      console.error('Invalid machine passed to handleFomoHitInteraction:', machine);
      return;
    }
    
    console.log('Radix connection status:', isRadixConnected);
    console.log('Radix accounts:', radixAccounts);

    // For FOMO HIT, if it's first activation (lastActivated === 0) AND 
    // not already in the minting process (provisionalMint !== 1), show minter
    if (machine.lastActivated === 0 && machine.provisionalMint !== 1) {
      setSelectedFomoHit(machine);
      setShowFomoHitMinter(true);
    } else {
      // For subsequent activations or if minting is in progress,
      // just activate normally to collect TCorvax
      activateMachine(machine);
    }
  };
  
  // Handle activation for Cat's Lair with pet logic
  const handleActivation = (machine) => {
    // Special handling for Cat's Lair - check if we should show pet prompt
    if (machine.type === 'catLair') {
      const showingPetPrompt = handleCatLairActivation(machine);
      if (showingPetPrompt) {
        setSelectedCatLair(machine);
        setShowPetBuyPrompt(true);
        return; // Don't proceed with normal activation
      }
    }
    
    // Normal machine activation
    activateMachine(machine);
  };

  const autoWalkToMachine = (machine) => {
    // Don't auto walk if in move mode
    if (inMoveMode || inPetMoveMode || showMovePreview) return;
    
    const { px, py } = interactions.getPlayerCenter();
    const { mx, my } = interactions.getMachineCenter(machine);
    const distVal = interactions.distance(px, py, mx, my);

    if (distVal <= INTERACTION_RANGE) {
      if (machine.type === 'incubator') {
        handleIncubatorInteraction(machine);
      } else if (machine.type === 'fomoHit') {
        handleFomoHitInteraction(machine);
      } else if (machine.type === 'catLair') {
        handleActivation(machine);
      } else {
        activateMachine(machine);
      }
    } else {
      const offset = gridSize;
      setTargetX(mx - offset);
      setTargetY(my - offset);
      setAutoTargetMachine(machine);
    }
  };
  
  const autoWalkToPet = (pet) => {
    // Don't auto walk if in move mode
    if (inMoveMode || inPetMoveMode || showMovePreview) return;
    
    const { px, py } = interactions.getPlayerCenter();
    const petCenter = interactions.getPetCenter(pet);
    const distVal = interactions.distance(px, py, petCenter.px, petCenter.py);

    if (distVal <= INTERACTION_RANGE) {
      // We're already in range, show the pet interaction menu
      setSelectedPet(pet);
      setShowPetInteractionMenu(true);
    } else {
      // Walk to the pet first
      const offset = gridSize;
      setTargetX(petCenter.px - offset);
      setTargetY(petCenter.py - offset);
      setAutoPetTarget(pet);
    }
  };

  // Machine movement confirmation/cancellation
  const handleMoveConfirm = async () => {
    if (!movingMachine) return;
    
    console.log(`Confirming move of machine ${movingMachine.id} to (${moveCursorPosition.x}, ${moveCursorPosition.y}) in room ${moveTargetRoom}`);
    
    const success = await moveMachine(
      movingMachine.id, 
      moveCursorPosition.x, 
      moveCursorPosition.y,
      moveTargetRoom  // Important: use the target room, not current room
    );
    
    if (success) {
      addNotification("Machine moved!", moveCursorPosition.x, moveCursorPosition.y, "#4CAF50");
    }
    
    // Reset move mode
    setMovingMachine(null);
    setShowMovePreview(false);
    setMoveConfirmationOpen(false);
    setSelectedMachineToMove(null);
    setInMoveMode(false);
    setPositionSelected(false); // Reset position selected state
  };

  const handleMoveCancel = () => {
    // Cancel the move
    setMovingMachine(null);
    setShowMovePreview(false);
    setMoveConfirmationOpen(false);
    setSelectedMachineToMove(null);
    setInMoveMode(false);
    setPositionSelected(false); // Reset position selected state
  };
  
  // Handle pet move confirmation
  const handlePetMoveConfirm = async () => {
    if (!selectedPetToMove) return;
    
    console.log(`Confirming move of pet ${selectedPetToMove} to (${moveCursorPosition.x}, ${moveCursorPosition.y}) in room ${currentRoom}`);
    
    // Find the pet we're moving
    const petToMove = pets.find(p => p.id === selectedPetToMove);
    if (!petToMove) {
      console.error("Cannot find pet with ID:", selectedPetToMove);
      setSelectedPetToMove(null);
      setInPetMoveMode(false);
      setShowMovePreview(false);
      setPositionSelected(false);
      return;
    }
    
    // Only call movePet once with the final position
    const success = await movePet(
      selectedPetToMove, 
      moveCursorPosition.x, 
      moveCursorPosition.y,
      currentRoom
    );
    
    if (success) {
      console.log("Pet move successful");
    } else {
      console.error("Pet move failed");
    }
    
    // Reset move mode
    setShowMovePreview(false);
    setSelectedPetToMove(null);
    setInPetMoveMode(false);
    setPositionSelected(false);
  };

  // Handle pet cancellation
  const handlePetMoveCancel = () => {
    // Cancel the move
    setShowMovePreview(false);
    setSelectedPetToMove(null);
    setInPetMoveMode(false);
    setPositionSelected(false);
  };

  // Handle canvas click or tap (combined for both mobile and desktop)
  const handleCanvasClick = (x, y) => {
    console.log(`Processing click/tap at (${x}, ${y}), current room: ${currentRoom}, move mode: ${inMoveMode || inPetMoveMode}`);
    
    // Handle machine move mode
    if (inMoveMode && movingMachine && showMovePreview) {
      // If position already selected, first reset it before selecting a new position
      if (positionSelected) {
        setPositionSelected(false);
        setMoveConfirmationOpen(false);
      }
      
      // Snap to grid
      const snapToGridX = Math.floor(x / gridSize) * gridSize;
      const snapToGridY = Math.floor(y / gridSize) * gridSize;
      
      console.log(`Snapped position to grid: (${snapToGridX}, ${snapToGridY})`);
      
      setMoveCursorPosition({ x: snapToGridX, y: snapToGridY });
      
      // Check for collisions
      const machineSize = gridSize * 2;
      
      // Enforce boundaries
      const maxX = 800 - machineSize;
      const maxY = 600 - machineSize;
      
      let boundedX = snapToGridX;
      let boundedY = snapToGridY;
      
      if (boundedX < 0) boundedX = 0;
      if (boundedX > maxX) boundedX = maxX;
      if (boundedY < 0) boundedY = 0;
      if (boundedY > maxY) boundedY = maxY;
      
      // Check for collisions with other machines IN CURRENT ROOM
      let hasCollision = false;
      
      getMachinesInCurrentRoom().forEach(m => {
        if (m.id !== movingMachine?.id) {
          const dx = Math.abs(m.x - boundedX);
          const dy = Math.abs(m.y - boundedY);
          if (dx < machineSize && dy < machineSize) {
            hasCollision = true;
          }
        }
      });
      
      if (!hasCollision) {
        // Set position as selected and open confirmation
        setPositionSelected(true);
        setMoveConfirmationOpen(true);
        console.log(`Position selected at (${boundedX}, ${boundedY}) in room ${currentRoom}`);
      } else {
        addNotification("Cannot place here - collision with another machine", boundedX, boundedY, "#ff4444");
      }
      
      return;
    }
    
    // Handle pet move mode
    if (inPetMoveMode && selectedPetToMove && showMovePreview) {
      // If position already selected, first reset it
      if (positionSelected) {
        setPositionSelected(false);
      }
      
      // Snap to grid
      const snapToGridX = Math.floor(x / gridSize) * gridSize;
      const snapToGridY = Math.floor(y / gridSize) * gridSize;
      
      console.log(`Snapped position to grid: (${snapToGridX}, ${snapToGridY})`);
      
      setMoveCursorPosition({ x: snapToGridX, y: snapToGridY });
      
      // Check for collisions
      const petSize = gridSize * 1.5;
      
      // Enforce boundaries
      const maxX = 800 - petSize;
      const maxY = 600 - petSize;
      
      let boundedX = snapToGridX;
      let boundedY = snapToGridY;
      
      if (boundedX < 0) boundedX = 0;
      if (boundedX > maxX) boundedX = maxX;
      if (boundedY < 0) boundedY = 0;
      if (boundedY > maxY) boundedY = maxY;
      
      // Update cursor position with bounded values
      setMoveCursorPosition({ x: boundedX, y: boundedY });
      
      // Set position as selected
      setPositionSelected(true);
      
      // Note: We'll wait for user to confirm the move rather than doing it immediately
      
      return;
    }

    // Check if clicked on machine or pet
    const getMachineOrPetAtPosition = (x, y) => {
      // First check if there's a machine at this position
      const currentRoomMachines = getMachinesInCurrentRoom();
      const machineSize = gridSize * 2;
      
      const machine = currentRoomMachines.find((m) => {
        return (
          x >= m.x &&
          x < m.x + machineSize &&
          y >= m.y &&
          y < m.y + machineSize
        );
      });
      
      if (machine) return { type: 'machine', entity: machine };
      
      // If not, check if there's a pet at this position
      const pet = getPetAtPosition(x, y);
      if (pet) return { type: 'pet', entity: pet };
      
      return null;
    };

    const clickedEntity = getMachineOrPetAtPosition(x, y);

    if (clickedEntity) {
      if (clickedEntity.type === 'machine') {
        // Handle machine click
        autoWalkToMachine(clickedEntity.entity);
      } else if (clickedEntity.type === 'pet') {
        // Handle pet click
        autoWalkToPet(clickedEntity.entity);
      }
    } else {
      const playerSize = gridSize * 2;
      setTargetX(x - playerSize / 2);
      setTargetY(y - playerSize / 2);
      setAutoTargetMachine(null);
      setAutoPetTarget(null);
    }
  };

  // Move player based on keyboard/touch input
  const movePlayer = () => {
    // Skip movement if in move mode
    if (showMovePreview) return;
    
    let newPlayer = { ...player };

    // Keyboard movement
    if (keys.ArrowUp) newPlayer.velocityY -= newPlayer.acceleration;
    if (keys.ArrowDown) newPlayer.velocityY += newPlayer.acceleration;
    if (keys.ArrowLeft) {
      newPlayer.velocityX -= newPlayer.acceleration;
      newPlayer.facingRight = false;
    }
    if (keys.ArrowRight) {
      newPlayer.velocityX += newPlayer.acceleration;
      newPlayer.facingRight = true;
    }

    // Mobile auto-walk
    if (
      !keys.ArrowUp &&
      !keys.ArrowDown &&
      !keys.ArrowLeft &&
      !keys.ArrowRight &&
      isMobile
    ) {
      const dx = targetX - newPlayer.x;
      const dy = targetY - newPlayer.y;
      const distVal = interactions.distance(newPlayer.x, newPlayer.y, targetX, targetY);

      if (distVal > 1) {
        const step = Math.min(newPlayer.maxSpeed, distVal);
        newPlayer.x += (dx / distVal) * step;
        newPlayer.y += (dy / distVal) * step;

        // Update facing direction based on movement
        if (dx !== 0) {
          newPlayer.facingRight = dx > 0;
        }
      } else if (autoTargetMachine) {
        if (interactions.isPlayerInRangeOf(autoTargetMachine, 'machine')) {
          if (autoTargetMachine.type === 'incubator') {
            handleIncubatorInteraction(autoTargetMachine);
          } else if (autoTargetMachine.type === 'fomoHit') {
            handleFomoHitInteraction(autoTargetMachine);
          } else if (autoTargetMachine.type === 'catLair') {
            handleActivation(autoTargetMachine);
          } else {
            activateMachine(autoTargetMachine);
          }
        }
        setAutoTargetMachine(null);
      } else if (autoPetTarget) {
        // Check if we've reached the pet
        if (interactions.isPlayerInRangeOf(autoPetTarget, 'pet')) {
          setSelectedPet(autoPetTarget);
          setShowPetInteractionMenu(true);
        }
        setAutoPetTarget(null);
      }
    } else {
      // Clamp speed
      newPlayer.velocityX = Math.max(
        -newPlayer.maxSpeed,
        Math.min(newPlayer.maxSpeed, newPlayer.velocityX)
      );
      newPlayer.velocityY = Math.max(
        -newPlayer.maxSpeed,
        Math.min(newPlayer.maxSpeed, newPlayer.velocityY)
      );

      // Apply friction
      newPlayer.velocityX *= newPlayer.friction;
      newPlayer.velocityY *= newPlayer.friction;

      // Update position with bounds checking
      newPlayer.x = Math.max(
        0,
        Math.min(800 - newPlayer.width, newPlayer.x + newPlayer.velocityX)
      );
      newPlayer.y = Math.max(
        0,
        Math.min(600 - newPlayer.height, newPlayer.y + newPlayer.velocityY)
      );
    }

    setPlayer(newPlayer);
  };

  // Game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    const gameLoop = () => {
      if (!canvasRef.current) {
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Use the GameCanvasRenderer to render the game
      // This is done by directly manipulating the canvas context
      // rather than using React's rendering system
      
      // The renderer component doesn't actually render itself in the DOM
      // It just draws to the canvas context we provide
      const renderer = (
        <GameCanvasRenderer
          canvasRef={canvasRef}
          player={player}
          currentRoom={currentRoom}
          machines={machines}
          pets={pets}
          particles={particles}
          notifications={notifications}
          gridSize={gridSize}
          assetsRef={assetsRef}
          showMovePreview={showMovePreview}
          moveCursorPosition={moveCursorPosition}
          positionSelected={positionSelected}
          movingMachine={movingMachine}
          selectedPetToMove={selectedPetToMove}
          inPetMoveMode={inPetMoveMode}
          moveTargetRoom={moveTargetRoom}
          machineTypes={machineTypes}
        />
      );

      // Move player (skip in move mode)
      if (!showMovePreview) {
        movePlayer();
      }

      // Request next frame
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [
    player,
    machines,
    pets,
    particles,
    notifications,
    keys,
    targetX,
    targetY,
    autoTargetMachine,
    autoPetTarget,
    isLoggedIn,
    isRadixConnected,
    currentRoom,
    showMovePreview,
    moveCursorPosition,
    positionSelected,
    selectedPetToMove,
    inPetMoveMode
  ]);

  return (
    <div ref={gameContainerRef} className="game-container-wrapper" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width={800}
        height={600}
        style={{
          borderRadius: '0 10px 10px 0',
          boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)',
          transition: 'box-shadow 0.3s ease',
          display: isLoggedIn ? 'block' : 'none',
          cursor: showMovePreview ? (positionSelected ? 'default' : 'move') : 'default'
        }}
      />

      {/* Move instructions overlay */}
      {moveInstructionsVisible && showMovePreview && !positionSelected && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 215, 0, 0.9)',
          color: 'black',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 1000,
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          animation: 'fadeInOut 5s forwards',
          pointerEvents: 'none' // Allow clicks to pass through
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Click or tap where you want to place the {inPetMoveMode ? 'pet' : 'machine'}!</h3>
          <p style={{ margin: '0' }}>
            Press <strong>ESC</strong> key to cancel the move.
          </p>
          
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; }
              10% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Room Navigation Component */}
      {isLoggedIn && <RoomNavigation />}

      {/* Move confirmation dialog */}
      {moveConfirmationOpen && (
        <div style={{
          position: 'absolute',
          ...(isMobile 
            ? {
                // Mobile positioning: below the canvas
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '5px',
                zIndex: 990,
                maxWidth: '300px',
                padding: '10px',
                fontSize: '14px'
              } 
            : {
                // Desktop positioning: centered on screen
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                maxWidth: '400px',
                padding: '15px',
                fontSize: '16px'
              }
          ),
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          width: isMobile ? '85%' : '90%',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#FFD700',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            Confirm Machine Move
          </h3>
          
          <p style={{ margin: isMobile ? '5px 0' : '8px 0' }}>
            Move {machineTypes[movingMachine?.type]?.name || 'Machine'} {currentRoom !== movingMachine?.room ? `from Room ${movingMachine?.room} to Room ${currentRoom}` : 'to this location'}?
          </p>
          
          <p style={{ 
            fontWeight: 'bold', 
            color: '#FF5722',
            margin: isMobile ? '5px 0' : '8px 0'
          }}>
            Cost: 50 TCorvax
          </p>
          
          <p style={{ margin: isMobile ? '5px 0' : '8px 0' }}>
            Current TCorvax: {tcorvax.toFixed(1)}
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: isMobile ? '10px' : '15px'
          }}>
            <button
              onClick={handleMoveCancel}
              style={{ 
                backgroundColor: '#333', 
                flex: 1, 
                marginRight: '10px',
                padding: isMobile ? '8px 5px' : '12px 10px',
                fontSize: isMobile ? '13px' : '15px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleMoveConfirm}
              style={{ 
                backgroundColor: tcorvax >= 50 ? '#4CAF50' : '#999', 
                flex: 1,
                opacity: tcorvax >= 50 ? 1 : 0.7,
                padding: isMobile ? '8px 5px' : '12px 10px',
                fontSize: isMobile ? '13px' : '15px'
              }}
              disabled={tcorvax < 50}
            >
              {tcorvax >= 50 ? 'Confirm' : 'Not enough'}
            </button>
          </div>
        </div>
      )}

      {/* Pet Move Confirmation */}
      {inPetMoveMode && selectedPetToMove && positionSelected && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '90%' : '50%',
          left: '50%',
          transform: isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          width: isMobile ? '85%' : '90%',
          maxWidth: isMobile ? '300px' : '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>
            Confirm Pet Move
          </h3>
          
          <p style={{ margin: '5px 0' }}>
            Move your cat to this location?
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '15px'
          }}>
            <button
              onClick={() => {
                setPositionSelected(false);
              }}
              style={{ 
                backgroundColor: '#333', 
                flex: 1, 
                marginRight: '10px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePetMoveConfirm}
              style={{ 
                backgroundColor: '#4CAF50', 
                flex: 1
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Incubator Widget (Defi Plaza Staking) */}
      {showIncubatorWidget && selectedIncubator && (
        <IncubatorWidget
          machineId={selectedIncubator.id}
          onClose={() => setShowIncubatorWidget(false)}
        />
      )}
      
      {/* FOMO HIT NFT Minter */}
      {showFomoHitMinter && selectedFomoHit && (
        <FomoHitMinter
          machineId={selectedFomoHit.id}
          onClose={() => setShowFomoHitMinter(false)}
        />
      )}
      
      {/* Pet Buy Prompt */}
      {showPetBuyPrompt && selectedCatLair && (
        <PetBuyPrompt
          onClose={() => setShowPetBuyPrompt(false)}
          catLair={selectedCatLair}
        />
      )}
      
      {/* Pet Interaction Menu */}
      {showPetInteractionMenu && selectedPet && (
        <PetInteractionMenu
          pet={selectedPet}
          onClose={() => setShowPetInteractionMenu(false)}
        />
      )}

      {/* Evolving Creatures Manager - handles all evolving creatures UI */}
      <EvolvingCreaturesManager />
    </div>
  );
};

export default GameCanvas;
