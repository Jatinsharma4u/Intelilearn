// src/components/badges/BadgeSystem.jsx
import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

export const useBadges = () => {
  const { progress, updateProgress } = useProgress();

  const checkAndAwardBadge = (badgeType, criteria) => {
    if (!progress.badges) progress.badges = [];
    
    // Check if badge already awarded
    if (progress.badges.some(b => b.name === badgeType.name)) {
      return false;
    }
    
    // Check criteria based on badge type
    let shouldAward = false;
    
    switch(badgeType.id) {
      case 'first_blood':
        shouldAward = criteria.battlesWon >= 1;
        break;
      case 'rising_star':
        shouldAward = criteria.battlesWon >= 10;
        break;
      case 'battle_veteran':
        shouldAward = criteria.battlesWon >= 50;
        break;
      case 'undefeated':
        shouldAward = criteria.battlesWon >= 100;
        break;
      case 'speed_demon':
        shouldAward = criteria.fastAnswers >= 50;
        break;
      case 'accuracy_king':
        shouldAward = criteria.highAccuracyBattles >= 25;
        break;
      case 'quick_learner':
        shouldAward = criteria.coursesCompleted >= 10;
        break;
      case 'knowledge_seeker':
        shouldAward = criteria.coursesCompleted >= 25;
        break;
      case 'course_master':
        shouldAward = criteria.coursesCompleted >= 50;
        break;
      case 'daily_warrior':
        shouldAward = criteria.streak >= 7;
        break;
      case 'unstoppable':
        shouldAward = criteria.streak >= 30;
        break;
      case 'iron_will':
        shouldAward = criteria.streak >= 100;
        break;
      default:
        return false;
    }
    
    if (shouldAward) {
      const newBadge = {
        name: badgeType.name,
        icon: badgeType.icon,
        earned_date: new Date().toISOString(),
        reward: badgeType.reward
      };
      
      const updatedBadges = [...progress.badges, newBadge];
      updateProgress({ badges: updatedBadges });
      
      return true;
    }
    
    return false;
  };

  return { checkAndAwardBadge };
};

export const BADGE_TYPES = {
  FIRST_BLOOD: { id: 'first_blood', name: 'First Blood', icon: '🩸', reward: 100 },
  RISING_STAR: { id: 'rising_star', name: 'Rising Star', icon: '⭐', reward: 500 },
  BATTLE_VETERAN: { id: 'battle_veteran', name: 'Battle Veteran', icon: '⚔️', reward: 2000 },
  UNDEFEATED: { id: 'undefeated', name: 'Undefeated', icon: '👑', reward: 5000 },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', reward: 3000 },
  ACCURACY_KING: { id: 'accuracy_king', name: 'Accuracy King', icon: '✅', reward: 4000 },
  QUICK_LEARNER: { id: 'quick_learner', name: 'Quick Learner', icon: '🚀', reward: 1000 },
  KNOWLEDGE_SEEKER: { id: 'knowledge_seeker', name: 'Knowledge Seeker', icon: '📖', reward: 2500 },
  COURSE_MASTER: { id: 'course_master', name: 'Course Master', icon: '🎓', reward: 5000 },
  DAILY_WARRIOR: { id: 'daily_warrior', name: 'Daily Warrior', icon: '📅', reward: 500 },
  UNSTOPPABLE: { id: 'unstoppable', name: 'Unstoppable', icon: '💪', reward: 2000 },
  IRON_WILL: { id: 'iron_will', name: 'Iron Will', icon: '⛓️', reward: 10000 }
};