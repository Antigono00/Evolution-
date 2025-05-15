// src/components/CreatureDetails.jsx
import React from 'react';

const CreatureDetails = ({ creature }) => {
  if (!creature) return null;
  
  // Helper function to get stat color based on value
  const getStatColor = (value) => {
    if (value >= 20) return '#F44336'; // High red
    if (value >= 15) return '#FF9800'; // Orange
    if (value >= 10) return '#4CAF50'; // Green
    if (value >= 5) return '#2196F3'; // Blue
    return '#9E9E9E'; // Gray for low values
  };
  
  // Get creature image based on form
  const getCreatureImage = () => {
    return creature.image_url || creature.key_image_url;
  };
  
  // Format stat progress bar
  const renderStatBar = (name, value) => {
    const maxWidth = 200;
    const percent = Math.min(100, (value / 30) * 100); // Max stat value assumed to be 30
    const barWidth = (percent / 100) * maxWidth;
    const color = getStatColor(value);
    
    return (
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <div>{name}</div>
          <div>{value}</div>
        </div>
        <div style={{ 
          width: `${maxWidth}px`, 
          height: '8px', 
          backgroundColor: 'rgba(0,0,0,0.3)', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${barWidth}px`, 
            height: '100%', 
            backgroundColor: color,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    );
  };
  
  // Get progress info for evolutions
  const getEvolutionProgress = () => {
    const progress = creature.evolution_progress;
    if (!progress) return { completed: 0, total: 3, percent: 0 };
    
    const completed = progress.stat_upgrades_completed;
    return {
      completed,
      total: 3, // Always need 3 upgrades per form
      percent: (completed / 3) * 100
    };
  };
  
  const evolutionProgress = getEvolutionProgress();
  const stats = creature.stats || {};
  const formLabel = creature.display_form || `Form ${creature.form}`;
  const maxForm = 3; // Maximum form is 3
  const atMaxForm = creature.form >= maxForm;
  
  return (
    <div className="creature-details">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Creature image and basic info */}
        <div style={{ 
          flexBasis: '200px', 
          flexShrink: 0, 
          textAlign: 'center',
          position: 'relative'
        }}>
          <img 
            src={getCreatureImage()} 
            alt={creature.species_name} 
            style={{ 
              width: '180px', 
              height: '180px', 
              objectFit: 'contain',
              borderRadius: '10px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              padding: '5px',
              border: `2px solid ${
                creature.rarity === 'Legendary' ? '#FFD700' : 
                creature.rarity === 'Epic' ? '#9C27B0' : 
                creature.rarity === 'Rare' ? '#2196F3' : '#78909C'
              }`
            }}
          />
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: creature.rarity === 'Legendary' ? '#FFD700' : 
                            creature.rarity === 'Epic' ? '#9C27B0' : 
                            creature.rarity === 'Rare' ? '#2196F3' : '#78909C',
            color: 'white',
            fontSize: '12px',
            padding: '3px 8px',
            borderRadius: '10px',
            fontWeight: 'bold'
          }}>
            {creature.rarity}
          </div>
          <h3 style={{ marginTop: '10px', marginBottom: '5px' }}>{creature.species_name}</h3>
          <div style={{ 
            padding: '5px 10px', 
            backgroundColor: atMaxForm ? '#FF5722' : '#2196F3',
            color: 'white',
            display: 'inline-block',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            marginTop: '5px'
          }}>
            {formLabel} {atMaxForm ? '(MAX)' : ''}
          </div>
          
          {creature.display_combination && (
            <div style={{ 
              padding: '3px 8px', 
              backgroundColor: '#9C27B0',
              color: 'white',
              display: 'inline-block',
              borderRadius: '15px',
              fontSize: '12px',
              marginTop: '8px',
              marginLeft: '5px'
            }}>
              {creature.display_combination}
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Stats</h3>
          
          {renderStatBar('Energy', stats.energy || 0)}
          {renderStatBar('Strength', stats.strength || 0)}
          {renderStatBar('Magic', stats.magic || 0)}
          {renderStatBar('Stamina', stats.stamina || 0)}
          {renderStatBar('Speed', stats.speed || 0)}
          
          {/* Evolution progress */}
          {!atMaxForm && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Evolution Progress</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    height: '10px', 
                    backgroundColor: 'rgba(0,0,0,0.3)', 
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${evolutionProgress.percent}%`, 
                      height: '100%', 
                      backgroundColor: evolutionProgress.completed >= 3 ? '#4CAF50' : '#FF9800',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  {evolutionProgress.completed}/{evolutionProgress.total} Upgrades
                </div>
              </div>
              
              <div style={{ 
                fontSize: '13px', 
                marginTop: '5px',
                color: evolutionProgress.completed >= 3 ? '#4CAF50' : '#FF9800'
              }}>
                {evolutionProgress.completed >= 3 
                  ? 'Ready to evolve!' 
                  : `${3 - evolutionProgress.completed} more upgrade${3 - evolutionProgress.completed !== 1 ? 's' : ''} needed`}
              </div>
            </div>
          )}
          
          {/* Show final form message if at max form */}
          {atMaxForm && (
            <div style={{ 
              marginTop: '20px',
              padding: '10px',
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              borderRadius: '8px',
              borderLeft: '4px solid #FF5722'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#FF5722' }}>Final Form Reached</h4>
              <p style={{ margin: '0', fontSize: '14px' }}>
                This creature has reached its final form! You can continue to level up its stats.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Bonus stats if any */}
      {creature.bonus_stats && Object.keys(creature.bonus_stats).length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '10px',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          borderRadius: '8px',
          borderLeft: '4px solid #9C27B0'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#9C27B0' }}>Bonus Stats</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(creature.bonus_stats).map(([stat, value]) => (
              <div key={stat} style={{ 
                padding: '5px 10px',
                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                borderRadius: '5px',
                fontSize: '13px'
              }}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}: +{value}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Token requirements for evolution/upgrades */}
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderRadius: '8px',
        borderLeft: '4px solid #2196F3'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>Required Token</h4>
        <div style={{ fontSize: '14px' }}>
          <p style={{ margin: '0 0 5px 0' }}>
            This species uses <strong>{creature.preferred_token || 'XRD'}</strong> tokens for all upgrades and evolutions.
          </p>
          <p style={{ margin: '0', fontSize: '13px', opacity: 0.8 }}>
            Make sure you have enough tokens before attempting upgrades or evolution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatureDetails;
