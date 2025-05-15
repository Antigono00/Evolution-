// src/components/MyCreaturesPanel.jsx
import React, { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';
import CreatureDetails from './CreatureDetails';
import UpgradeStatsModal from './UpgradeStatsModal';

const MyCreaturesPanel = ({ onClose }) => {
  // Game context
  const {
    creatureNfts,
    fetchUserCreatures,
    selectedCreature,
    setSelectedCreature,
    isMobile,
    addNotification,
    upgradeCreatureStats,
    evolveCreature
  } = useContext(GameContext);

  // Radix Connect context
  const {
    connected,
    accounts,
    updateAccountSharing
  } = useRadixConnect();

  // Component states
  const [creatures, setCreatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);

  // Check connection status
  useEffect(() => {
    if (!connected) {
      setConnectionStatus('disconnected');
    } else if (!accounts || accounts.length === 0) {
      setConnectionStatus('connected-no-accounts');
    } else {
      setConnectionStatus('ready');
    }
  }, [connected, accounts]);

  // Fetch creatures when panel opens
  useEffect(() => {
    const loadCreatures = async () => {
      setIsLoading(true);
      try {
        const userCreatures = await fetchUserCreatures();
        setCreatures(userCreatures || []);
      } catch (error) {
        console.error('Error loading creatures:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (connectionStatus === 'ready') {
      loadCreatures();
    }
  }, [fetchUserCreatures, connectionStatus]);

  // Handle creature selection
  const handleSelectCreature = (creature) => {
    setSelectedCreature(creature);
  };

  // Handle stats upgrade
  const handleUpgrade = () => {
    if (!selectedCreature) return;
    
    // Check if the creature can be upgraded (has not reached max upgrades for current form)
    const evolutionProgress = selectedCreature.evolution_progress;
    
    if (!evolutionProgress || evolutionProgress.stat_upgrades_completed >= 3) {
      addNotification("Max upgrades reached for current form!", 400, 300, "#FF9800");
      return;
    }
    
    // Open upgrade modal
    setShowUpgradeModal(true);
  };

  // Handle evolution
  const handleEvolve = async () => {
    if (!selectedCreature) return;
    
    // Check if the creature can evolve (has completed all 3 stat upgrades)
    const evolutionProgress = selectedCreature.evolution_progress;
    
    if (!evolutionProgress || evolutionProgress.stat_upgrades_completed < 3) {
      addNotification("Complete 3 stat upgrades before evolving!", 400, 300, "#FF9800");
      return;
    }
    
    // Confirm evolution
    const confirmEvolve = window.confirm(`Evolve your ${selectedCreature.species_name} to the next form?`);
    if (!confirmEvolve) return;
    
    setIsEvolving(true);
    try {
      const success = await evolveCreature(selectedCreature);
      if (success) {
        // Refresh creatures list
        const updatedCreatures = await fetchUserCreatures();
        setCreatures(updatedCreatures || []);
        
        // Try to select the evolved creature again
        const evolvedCreature = updatedCreatures.find(c => c.id === selectedCreature.id);
        if (evolvedCreature) {
          setSelectedCreature(evolvedCreature);
        }
      }
    } finally {
      setIsEvolving(false);
    }
  };

  const handleFinishUpgrade = async (statPoints) => {
    if (!selectedCreature) return;
    
    setIsUpgrading(true);
    setShowUpgradeModal(false);
    
    try {
      const success = await upgradeCreatureStats(selectedCreature, statPoints);
      if (success) {
        // Refresh creatures list
        const updatedCreatures = await fetchUserCreatures();
        setCreatures(updatedCreatures || []);
        
        // Try to select the same creature again to see updated stats
        const updatedCreature = updatedCreatures.find(c => c.id === selectedCreature.id);
        if (updatedCreature) {
          setSelectedCreature(updatedCreature);
        }
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  // Render creature list item
  const renderCreatureItem = (creature) => {
    const isSelected = selectedCreature && selectedCreature.id === creature.id;
    
    return (
      <div 
        key={creature.id}
        className={`creature-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelectCreature(creature)}
        style={{
          padding: '10px',
          margin: '5px 0',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          border: isSelected ? '2px solid #2196F3' : '2px solid transparent'
        }}
      >
        <div style={{ position: 'relative', marginRight: '10px' }}>
          <img 
            src={creature.image_url || creature.key_image_url} 
            alt={creature.species_name} 
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '5px',
              objectFit: 'contain'
            }}
          />
          {creature.rarity && (
            <div style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              backgroundColor: creature.rarity === 'Legendary' ? '#FFD700' : 
                              creature.rarity === 'Epic' ? '#9C27B0' : 
                              creature.rarity === 'Rare' ? '#2196F3' : '#78909C',
              color: 'white',
              fontSize: '10px',
              padding: '2px 5px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              {creature.rarity.charAt(0)}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold' }}>{creature.species_name}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {creature.display_form || `Form ${creature.form}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Overlay background */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div 
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '900px',
          width: isMobile ? '95%' : '90%',
          height: isMobile ? '90vh' : '80vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#222',
          borderRadius: '10px',
          boxShadow: '0 5px 25px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          touchAction: 'pan-y'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and buttons */}
        <div style={{ 
          position: 'sticky',
          top: 0,
          backgroundColor: '#222',
          padding: '15px',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #444',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0, color: '#FF5722' }}>My Creatures</h2>
          
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#333',
              padding: '8px 16px',
              borderRadius: '5px',
              border: 'none',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Content area */}
        <div style={{ 
          display: 'flex', 
          flex: 1,
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden'
        }}>
          {/* List of creatures (left panel) */}
          <div style={{ 
            width: isMobile ? '100%' : '30%',
            height: isMobile ? '30%' : '100%',
            borderRight: isMobile ? 'none' : '1px solid #444',
            borderBottom: isMobile ? '1px solid #444' : 'none',
            overflowY: 'auto',
            padding: '10px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Your Collection</h3>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading creatures...</p>
              </div>
            ) : connectionStatus !== 'ready' ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Connect your wallet to see your creatures</p>
                <button
                  onClick={updateAccountSharing}
                  style={{
                    backgroundColor: '#FF5722',
                    color: 'white',
                    marginTop: '10px'
                  }}
                >
                  Connect Wallet
                </button>
              </div>
            ) : creatures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>You don't have any creatures yet</p>
                <button
                  onClick={() => {
                    onClose();
                    // Set the showCreatureMinter to true after closing this panel
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        const mintButton = document.querySelector('.creature-mint-button');
                        if (mintButton) mintButton.click();
                      }
                    }, 300);
                  }}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    marginTop: '10px'
                  }}
                >
                  Mint Your First Creature
                </button>
              </div>
            ) : (
              <div className="creature-list">
                {creatures.map(renderCreatureItem)}
              </div>
            )}
          </div>

          {/* Creature details (right panel) */}
          <div style={{ 
            width: isMobile ? '100%' : '70%',
            height: isMobile ? '70%' : '100%',
            padding: '15px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {selectedCreature ? (
              <>
                <CreatureDetails creature={selectedCreature} />
                
                {/* Action buttons */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '15px',
                  marginTop: '20px',
                  padding: '15px',
                  borderTop: '1px solid #444'
                }}>
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading || isEvolving || 
                             !selectedCreature.evolution_progress || 
                             selectedCreature.evolution_progress.stat_upgrades_completed >= 3}
                    style={{
                      backgroundColor: (!selectedCreature.evolution_progress || 
                                      selectedCreature.evolution_progress.stat_upgrades_completed >= 3) ? 
                                      '#666' : '#4CAF50',
                      opacity: (!selectedCreature.evolution_progress || 
                               selectedCreature.evolution_progress.stat_upgrades_completed >= 3) ? 
                               0.5 : 1,
                      padding: '10px 20px',
                      borderRadius: '5px',
                      border: 'none',
                      color: '#fff',
                      cursor: (!selectedCreature.evolution_progress || 
                              selectedCreature.evolution_progress.stat_upgrades_completed >= 3) ? 
                              'not-allowed' : 'pointer',
                      flex: 1,
                      maxWidth: '200px'
                    }}
                  >
                    {isUpgrading ? 'Upgrading...' : 'Level Up'}
                  </button>
                  <button
                    onClick={handleEvolve}
                    disabled={isUpgrading || isEvolving || 
                             !selectedCreature.evolution_progress || 
                             selectedCreature.evolution_progress.stat_upgrades_completed < 3 ||
                             selectedCreature.form >= 3} // Max form is 3
                    style={{
                      backgroundColor: (!selectedCreature.evolution_progress || 
                                      selectedCreature.evolution_progress.stat_upgrades_completed < 3 ||
                                      selectedCreature.form >= 3) ? 
                                      '#666' : '#FF5722',
                      opacity: (!selectedCreature.evolution_progress || 
                               selectedCreature.evolution_progress.stat_upgrades_completed < 3 ||
                               selectedCreature.form >= 3) ? 
                               0.5 : 1,
                      padding: '10px 20px',
                      borderRadius: '5px',
                      border: 'none',
                      color: '#fff',
                      cursor: (!selectedCreature.evolution_progress || 
                              selectedCreature.evolution_progress.stat_upgrades_completed < 3 ||
                              selectedCreature.form >= 3) ? 
                              'not-allowed' : 'pointer',
                      flex: 1,
                      maxWidth: '200px'
                    }}
                  >
                    {isEvolving ? 'Evolving...' : 'Evolve'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: '#888'
              }}>
                <p style={{ fontSize: '18px' }}>Select a creature to view details</p>
                <p style={{ fontSize: '14px', maxWidth: '400px', margin: '10px auto' }}>
                  Click on any creature in your collection to see stats, upgrade or evolve it!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Stats Modal */}
      {showUpgradeModal && selectedCreature && (
        <UpgradeStatsModal
          creature={selectedCreature}
          onClose={() => setShowUpgradeModal(false)}
          onConfirm={handleFinishUpgrade}
        />
      )}
    </>
  );
};

export default MyCreaturesPanel;
