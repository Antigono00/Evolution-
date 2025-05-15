// src/components/GameCanvasRenderer.jsx
// Replace the entire component with this fixed version:
import React, { useEffect } from 'react';

const GameCanvasRenderer = ({
  canvasRef,
  player,
  currentRoom,
  machines,
  pets,
  particles,
  notifications,
  gridSize,
  assetsRef,
  showMovePreview,
  moveCursorPosition,
  positionSelected,
  movingMachine,
  selectedPetToMove,
  inPetMoveMode,
  moveTargetRoom,
  machineTypes
}) => {
  // Game loop to handle rendering
  useEffect(() => {
    if (!canvasRef.current) {
      console.error("Canvas reference is null!");
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.error("Could not get 2D context from canvas!");
      return;
    }
    console.log("GameCanvasRenderer running with assetsRef:", 
      assetsRef && assetsRef.current ? 
      Object.keys(assetsRef.current) : 
      "missing assets");
    
    // Drawing functions
    const drawBackground = () => {
      // Select the appropriate background based on the current room
      const bgImage = currentRoom === 1 
        ? assetsRef.current.backgroundImage 
        : assetsRef.current.background2Image;
      
      if (bgImage) {
        try {
          ctx.drawImage(
            bgImage,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          console.log("Background drawn successfully");
        } catch (error) {
          console.error('Error drawing background:', error);
          drawFallbackBackground();
        }
      } else {
        console.error("Background image not available!");
        drawFallbackBackground();
      }
    };

    const drawFallbackBackground = () => {
      console.log("Drawing fallback background");
      // Different fallback background colors for different rooms
      if (currentRoom === 1) {
        ctx.fillStyle = '#1a1a1a';
      } else {
        ctx.fillStyle = '#262626'; // Slightly lighter for room 2
      }
      
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      ctx.strokeStyle = currentRoom === 1 ? '#5555aa' : '#aa5555'; // Different color for room 2

      // Vertical grid lines
      for (let x = 0; x < canvasRef.current.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasRef.current.height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < canvasRef.current.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasRef.current.width, y);
        ctx.stroke();
      }
      
      // Add room number in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.font = 'bold 120px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ROOM ${currentRoom}`, canvasRef.current.width / 2, canvasRef.current.height / 2);
    };

    const drawPlayer = () => {
      if (!player) return;

      ctx.save();
      try {
        if (assetsRef.current.playerImage) {
          if (player.facingRight) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
              assetsRef.current.playerImage,
              0,
              0,
              player.width,
              player.height
            );
          } else {
            ctx.drawImage(
              assetsRef.current.playerImage,
              player.x,
              player.y,
              player.width,
              player.height
            );
          }
        } else {
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(player.x, player.y, player.width, player.height);

          ctx.fillStyle = '#fff';
          const eyeSize = 8;
          const eyeY = player.y + player.height / 3;

          if (player.facingRight) {
            ctx.fillRect(player.x + player.width - 25, eyeY, eyeSize, eyeSize);
            ctx.fillRect(player.x + player.width - 45, eyeY, eyeSize, eyeSize);
          } else {
            ctx.fillRect(player.x + 20, eyeY, eyeSize, eyeSize);
            ctx.fillRect(player.x + 40, eyeY, eyeSize, eyeSize);
          }
        }
      } catch (error) {
        console.error('Error drawing player:', error);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(player.x, player.y, player.width, player.height);
      }
      ctx.restore();
    };

    const drawMachines = () => {
      // Only draw machines in the current room
      const currentRoomMachines = machines.filter(m => (m.room || 1) === currentRoom);
      
      if (!currentRoomMachines || currentRoomMachines.length === 0) return;

      const machineSize = gridSize * 2;
      currentRoomMachines.forEach((m) => {
        // Skip the machine that's being moved if it's in this room
        if (movingMachine && m.id === movingMachine.id && currentRoom === movingMachine.room) return;
        
        // Try to get the appropriate image based on machine type
        let img = null;
        
        // Only use the image if it was loaded successfully
        if (m.type === 'catLair' && assetsRef.current.catsLairImage) {
          img = assetsRef.current.catsLairImage;
        } else if (m.type === 'reactor' && assetsRef.current.reactorImage) {
          img = assetsRef.current.reactorImage;
        } else if (m.type === 'amplifier' && assetsRef.current.amplifierImage) {
          img = assetsRef.current.amplifierImage;
        } else if (m.type === 'incubator' && assetsRef.current.incubatorImage) {
          img = assetsRef.current.incubatorImage;
        } else if (m.type === 'fomoHit' && assetsRef.current.fomoHitImage) {
          img = assetsRef.current.fomoHitImage;
        }

        try {
          // If we have an image, draw it, otherwise use fallback
          if (img) {
            ctx.drawImage(img, m.x, m.y, machineSize, machineSize);
          } else {
            // Fallback drawing for when image isn't available
            const machineInfo = machineTypes[m.type] || {baseColor: '#555'};
            const color = machineInfo.baseColor;
            ctx.fillStyle = color;
            ctx.fillRect(m.x, m.y, machineSize, machineSize);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Different text display for undefined vs known type
            const displayText = machineInfo.name || m.type || 'Machine';
            ctx.fillText(displayText, m.x + machineSize / 2, m.y + machineSize / 2);
            
            // Draw icon if available
            if (machineInfo.icon) {
              ctx.font = 'bold 24px Arial';
              ctx.fillText(machineInfo.icon, m.x + machineSize / 2, m.y + machineSize / 4);
            }
          }
        } catch (error) {
          console.error(`Error drawing machine ${m.type}:`, error);
          
          // Last resort fallback
          const color = machineTypes[m.type]?.baseColor || '#555';
          ctx.fillStyle = color;
          ctx.fillRect(m.x, m.y, machineSize, machineSize);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(m.type || 'Machine', m.x + machineSize / 2, m.y + machineSize / 2);
        }

        // Level label - IMPROVED with higher z-index/priority
        ctx.save();
        const labelText = `Lvl ${m.level}`;
        const labelWidth = 60;
        const labelHeight = 18;
        const labelX = m.x + machineSize / 2 - labelWidth / 2;
        const labelY = m.y - labelHeight - 2;

        // Draw with a semi-transparent black outline to make it visible against any background
        // First draw a slightly larger black background for better visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(labelX - 2, labelY - 2, labelWidth + 4, labelHeight + 4);

        // Then draw the actual colored label
        const labelColor = machineTypes[m.type]?.baseColor || '#45a049';
        ctx.fillStyle = labelColor;
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

        // Add a border for better visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

        // Draw text with shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
        ctx.restore();

        // Cooldown bar for catLair/reactor/incubator/fomoHit
        if (m.type !== 'amplifier') {
          const MACHINE_COOLDOWN_MS = 3600 * 1000; // Move this to props
          const elapsed = Date.now() - (m.lastActivated || 0);
          const cdProgress = Math.max(0, 1 - elapsed / MACHINE_COOLDOWN_MS);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(m.x, m.y + machineSize - 8, machineSize, 6);

          const gradient = ctx.createLinearGradient(
            m.x,
            m.y + machineSize - 8,
            m.x + machineSize * cdProgress,
            m.y + machineSize - 8
          );
          gradient.addColorStop(
            0,
            machineTypes[m.type]?.levelColors[m.level] || '#4CAF50'
          );
          gradient.addColorStop(1, '#fff');
          ctx.fillStyle = gradient;
          ctx.fillRect(m.x, m.y + machineSize - 8, machineSize * cdProgress, 6);
        }

        // If amplifier is offline => show OFFLINE
        if (m.type === 'amplifier' && m.isOffline) {
          ctx.save();
          const offText = 'OFFLINE';
          const offWidth = 60;
          const offHeight = 18;
          const offX = m.x + machineSize / 2 - offWidth / 2;
          const offY = m.y + machineSize + 2;
          ctx.fillStyle = '#c62828';
          ctx.fillRect(offX, offY, offWidth, offHeight);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(offText, offX + offWidth / 2, offY + offHeight / 2);
          ctx.restore();
        }

        // If incubator is offline => show CONNECT WALLET
        if (m.type === 'incubator' && m.isOffline) {
          ctx.save();
          const offText = 'CONNECT WALLET';
          const offWidth = 120;
          const offHeight = 18;
          const offX = m.x + machineSize / 2 - offWidth / 2;
          const offY = m.y + machineSize + 2;
          ctx.fillStyle = '#FF5722';
          ctx.fillRect(offX, offY, offWidth, offHeight);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(offText, offX + offWidth / 2, offY + offHeight / 2);
          ctx.restore();
        }
        
        // If FOMO HIT needs NFT minting => show MINT NFT
        if (m.type === 'fomoHit' && m.lastActivated === 0) {
          ctx.save();
          const mintText = 'MINT NFT';
          const mintWidth = 80;
          const mintHeight = 18;
          const mintX = m.x + machineSize / 2 - mintWidth / 2;
          const mintY = m.y + machineSize + 2;
          ctx.fillStyle = '#FF3D00';
          ctx.fillRect(mintX, mintY, mintWidth, mintHeight);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(mintText, mintX + mintWidth / 2, mintY + mintHeight / 2);
          ctx.restore();
        }
        
        // If FOMO HIT has provisional mint in progress => show MINTING...
        if (m.type === 'fomoHit' && m.provisionalMint === 1) {
          ctx.save();
          const mintingText = 'MINTING...';
          const mintingWidth = 90;
          const mintingHeight = 18;
          const mintingX = m.x + machineSize / 2 - mintingWidth / 2;
          const mintingY = m.y + machineSize + 2;
          ctx.fillStyle = '#FF9800';
          ctx.fillRect(mintingX, mintingY, mintingWidth, mintingHeight);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(mintingText, mintingX + mintingWidth / 2, mintingY + mintingHeight / 2);
          ctx.restore();
        }
      });
      
      // Draw the machine move preview if in move mode and in the target room
      if (showMovePreview && movingMachine && currentRoom === moveTargetRoom) {
        // Draw a preview of the machine at cursor position
        const { x, y } = moveCursorPosition;
        const machineInfo = machineTypes[movingMachine.type];
        
        // Draw a semi-transparent preview
        ctx.globalAlpha = 0.6;
        
        try {
          // Try to get the appropriate image based on machine type
          let img = null;
          
          if (movingMachine.type === 'catLair' && assetsRef.current.catsLairImage) {
            img = assetsRef.current.catsLairImage;
          } else if (movingMachine.type === 'reactor' && assetsRef.current.reactorImage) {
            img = assetsRef.current.reactorImage;
          } else if (movingMachine.type === 'amplifier' && assetsRef.current.amplifierImage) {
            img = assetsRef.current.amplifierImage;
          } else if (movingMachine.type === 'incubator' && assetsRef.current.incubatorImage) {
            img = assetsRef.current.incubatorImage;
          } else if (movingMachine.type === 'fomoHit' && assetsRef.current.fomoHitImage) {
            img = assetsRef.current.fomoHitImage;
          }

          // Draw the machine preview
          if (img) {
            ctx.drawImage(img, x, y, machineSize, machineSize);
          } else {
            // Fallback drawing
            ctx.fillStyle = machineInfo.baseColor || "#555";
            ctx.fillRect(x, y, machineSize, machineSize);
          }
          
          // Draw border around preview - make it more noticeable with animation
          const time = Date.now() % 2000 / 2000; // Value between 0 and 1
          const borderWidth = 3 + Math.sin(time * Math.PI * 2) * 2; // Width between 1 and 5
          
          // Use different styling for selected position
          if (positionSelected) {
            ctx.strokeStyle = "#00FF00"; // Green border for selected position
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(x, y, machineSize, machineSize);
            
            // Add a "position selected" indicator
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x, y + machineSize + 5, machineSize, 25);
            ctx.fillStyle = "#00FF00";
            ctx.font = "bold 12px Orbitron";
            ctx.textAlign = "center";
            ctx.fillText("POSITION SELECTED", x + machineSize/2, y + machineSize + 20);
          } else {
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(x, y, machineSize, machineSize);
            
            // Draw cost indicator
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(x, y - 30, 100, 25);
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 14px Orbitron";
            ctx.textAlign = "center";
            ctx.fillText("Cost: 50 TCorvax", x + 50, y - 12);
            
            // Add "Click to place" text
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x, y + machineSize + 5, machineSize, 25);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px Orbitron";
            ctx.textAlign = "center";
            ctx.fillText("CLICK TO PLACE", x + machineSize/2, y + machineSize + 20);
          }
          
        } catch (error) {
          console.error("Error drawing move preview:", error);
        }
        
        ctx.globalAlpha = 1.0; // Reset opacity
        
        // Draw grid overlay when in move mode to help with placement
        if ((showMovePreview) && !positionSelected) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.lineWidth = 0.5;
          
          // Vertical grid lines
          for (let ix = 0; ix < canvasRef.current.width; ix += gridSize) {
            ctx.beginPath();
            ctx.moveTo(ix, 0);
            ctx.lineTo(ix, canvasRef.current.height);
            ctx.stroke();
          }
          
          // Horizontal grid lines
          for (let iy = 0; iy < canvasRef.current.height; iy += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, iy);
            ctx.lineTo(canvasRef.current.width, iy);
            ctx.stroke();
          }
          
          ctx.restore();
        }
      }
      
      // If we're in move mode but in a different room than the machine came from, 
      // show an indicator that we're moving a machine
      if (showMovePreview && movingMachine && currentRoom !== movingMachine.room && currentRoom === moveTargetRoom) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 16px Orbitron";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `Moving ${machineTypes[movingMachine.type]?.name || 'Machine'} from Room ${movingMachine.room}`, 
          canvasRef.current.width / 2, 
          30
        );
        ctx.fillText(
          "Click anywhere to place it in this room", 
          canvasRef.current.width / 2, 
          60
        );
        ctx.restore();
      }
    };
    
    // Function to draw pets
    const drawPets = () => {
      // Get only pets in the current room
      const currentRoomPets = pets.filter(p => (p.room || 1) === currentRoom);
      
      if (!currentRoomPets || currentRoomPets.length === 0) return;

      const petSize = gridSize * 1.5; // Make pets slightly smaller than machines
      
      currentRoomPets.forEach((pet) => {
        // Skip the pet that's being moved
        if (selectedPetToMove && pet.id === selectedPetToMove) return;
        
        try {
          // Try to use the cat image
          if (pet.type === 'cat' && assetsRef.current.catImage) {
            ctx.drawImage(assetsRef.current.catImage, pet.x, pet.y, petSize, petSize);
          } else {
            // Fallback drawing if image isn't available
            ctx.fillStyle = '#FFD700'; // Gold color for pets
            ctx.fillRect(pet.x, pet.y, petSize, petSize);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Cat', pet.x + petSize / 2, pet.y + petSize / 2);
            
            // Draw a cute cat face emoji
            ctx.font = 'bold 24px Arial';
            ctx.fillText('🐱', pet.x + petSize / 2, pet.y + petSize / 4);
          }
          
          // Draw little sparkle effect around pets
          const time = Date.now() % 2000 / 2000; // Value between 0 and 1
          const sparkleSize = 2 + Math.sin(time * Math.PI * 2) * 1; // Size between 1 and 3
          
          ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * Math.PI * 2;
            const sparkleX = pet.x + petSize / 2 + Math.cos(angle) * (petSize / 2 + 5);
            const sparkleY = pet.y + petSize / 2 + Math.sin(angle) * (petSize / 2 + 5);
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } catch (error) {
          console.error(`Error drawing pet:`, error);
          
          // Last resort fallback
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(pet.x, pet.y, petSize, petSize);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Cat', pet.x + petSize / 2, pet.y + petSize / 2);
        }
      });
      
      // Draw pet move preview if in pet move mode
      if (showMovePreview && selectedPetToMove && inPetMoveMode) {
        const petToMove = pets.find(p => p.id === selectedPetToMove);
        if (petToMove) {
          // Draw a semi-transparent preview
          ctx.globalAlpha = 0.6;
          
          const { x, y } = moveCursorPosition;
          
          try {
            if (assetsRef.current.catImage) {
              ctx.drawImage(assetsRef.current.catImage, x, y, petSize, petSize);
            } else {
              // Fallback
              ctx.fillStyle = '#FFD700';
              ctx.fillRect(x, y, petSize, petSize);
              
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 14px Orbitron';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Cat', x + petSize / 2, y + petSize / 2);
            }
            
            // Draw a moving border
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 3 + Math.sin(Date.now() % 1000 / 1000 * Math.PI * 2) * 2;
            ctx.strokeRect(x, y, petSize, petSize);
          } catch (error) {
            console.error("Error drawing pet move preview:", error);
          }
          
          ctx.globalAlpha = 1.0; // Reset opacity
        }
      }
    };

    const drawParticlesAndNotifications = () => {
      // Draw particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw notifications
      notifications.forEach((n) => {
        ctx.globalAlpha = n.life;
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'center';
        const textWidth = ctx.measureText(n.text).width;
        const textHeight = 16;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(
          n.x - textWidth / 2 - 8,
          n.y - textHeight - 4,
          textWidth + 16,
          textHeight + 8
        );
        ctx.fillStyle = n.color;
        ctx.fillText(n.text, n.x, n.y);
        ctx.globalAlpha = 1;
      });
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw background
    drawBackground();
    
    // Draw machines
    drawMachines();
    
    // Draw pets
    drawPets();
    
    // Draw player (don't draw player in move mode)
    if (!showMovePreview) {
      drawPlayer();
    }
    
    // Draw particles and notifications
    drawParticlesAndNotifications();
  }, [
    player, 
    machines, 
    pets, 
    particles, 
    notifications, 
    currentRoom, 
    showMovePreview, 
    moveCursorPosition, 
    positionSelected, 
    selectedPetToMove,
    inPetMoveMode
  ]);

  return null; // This component doesn't render any UI directly
};

export default GameCanvasRenderer;
