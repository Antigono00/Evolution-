// src/components/UpgradeStatsModal.jsx
import React, { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';

const UpgradeStatsModal = ({ creature, onClose, onConfirm }) => {
  const { 
    isMobile,
    creatureStatsData,
    handleStatAllocation,
    resetStatAllocation
  } = useContext(GameContext);
  
  // Local state for stat points
  const [statPoints, setStatPoints] = useState({
    energy: 0,
    strength: 0,
    magic: 0,
    stamina: 0,
    speed: 0
  });
  
  // Track total allocated points
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [maxPoints] = useState(2); // Max points allowed per upgrade
  
  // Reset allocation when modal opens
  useEffect(() => {
    resetStatAllocation();
    
    return () => {
      // Reset on unmount
      resetStatAllocation();
    };
  }, [resetStatAllocation]);

  // Handle point allocation
  const handleIncreaseStat = (stat) => {
    if (totalAllocated >= maxPoints) return;
    
    setStatPoints(prev => ({
      ...prev,
      [stat]: prev[stat] + 1
    }));
    setTotalAllocated(prev => prev + 1);
  };

  const handleDecreaseStat = (stat) => {
    if (statPoints[stat] <= 0) return;
    
    setStatPoints(prev => ({
      ...prev,
      [stat]: prev[stat] - 1
    }));
    setTotalAllocated(prev => prev - 1);
  };

  // Get preferred token for this creature
  const getPreferredToken = () => {
    return creature.preferred_token || 'XRD';
  };

  // Disable confirm if no points allocated
  const canConfirm = totalAllocated > 0;

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
          zIndex: 10000,
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
          zIndex: 10001,
          maxWidth: '500px',
          width: isMobile ? '95%' : '90%',
          backgroundColor: '#222',
          borderRadius: '10px',
          boxShadow: '0 5px 25px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '15px',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#4CAF50' }}>Upgrade Stats</h3>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img 
              src={creature.image_url || creature.key_image_url} 
              alt={creature.species_name} 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '10px',
                objectFit: 'contain',
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '5px'
              }}
            />
            <h4 style={{ margin: '10px 0 5px 0' }}>{creature.species_name}</h4>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              {creature.display_form || `Form ${creature.form}`}
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div>Available points:</div>
              <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {maxPoints - totalAllocated}/{maxPoints}
              </div>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>
              Allocate up to {maxPoints} points to your creature's stats.
            </div>
          </div>
          
          {/* Stat allocation controls */}
          <div>
            {['energy', 'strength', 'magic', 'stamina', 'speed'].map(stat => {
              const currentValue = creature.stats ? (creature.stats[stat] || 0) : 0;
              const newValue = currentValue + statPoints[stat];
              
              return (
                <div key={stat} style={{ 
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ textTransform: 'capitalize', marginBottom: '3px' }}>
                      {stat}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '40px', fontSize: '14px' }}>
                        {currentValue}
                      </div>
                      {statPoints[stat] > 0 && (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          color: '#4CAF50'
                        }}>
                          <span style={{ fontSize: '14px' }}>→</span>
                          <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
                            {newValue}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            marginLeft: '3px', 
                            opacity: 0.8 
                          }}>
                            (+{statPoints[stat]})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => handleDecreaseStat(stat)}
                      disabled={statPoints[stat] <= 0}
                      style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: statPoints[stat] <= 0 ? '#444' : '#FF5722',
                        opacity: statPoints[stat] <= 0 ? 0.5 : 1,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: statPoints[stat] <= 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      -
                    </button>
                    <div style={{ 
                      width: '30px', 
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {statPoints[stat]}
                    </div>
                    <button
                      onClick={() => handleIncreaseStat(stat)}
                      disabled={totalAllocated >= maxPoints}
                      style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: totalAllocated >= maxPoints ? '#444' : '#4CAF50',
                        opacity: totalAllocated >= maxPoints ? 0.5 : 1,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: totalAllocated >= maxPoints ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Token info */}
          <div style={{ 
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <span>Required:</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{getPreferredToken()}</span>
              <span>tokens</span>
            </div>
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div style={{ 
          padding: '15px',
          borderTop: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#444',
              padding: '10px 15px',
              borderRadius: '5px',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              flex: 1,
              marginRight: '10px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(statPoints)}
            disabled={!canConfirm}
            style={{
              backgroundColor: canConfirm ? '#4CAF50' : '#444',
              opacity: canConfirm ? 1 : 0.5,
              padding: '10px 15px',
              borderRadius: '5px',
              border: 'none',
              color: '#fff',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              flex: 1
            }}
          >
            Confirm Upgrade
          </button>
        </div>
      </div>
    </>
  );
};

export default UpgradeStatsModal;
