
import { Card, CardColor, CardValue, OnlineSubMode } from '../types';
import { COLORS } from '../constants';

const isPlusValue = (v: CardValue): boolean => 
  ['draw2', 'draw4', 'draw6', 'draw10', 'reverse4', 'all4'].includes(v);

export const getPlusValue = (c: Card): number => {
  let v = 0;
  if (c.value === 'draw2') v = 2;
  else if (['draw4', 'reverse4', 'all4'].includes(c.value)) v = 4;
  else if (c.value === 'draw6') v = 6;
  else if (c.value === 'draw10') v = 10;
  
  if (c.secondaryValue === 'draw4') v += 4;
  return v;
};

const isPlusCard = (c: Card) => isPlusValue(c.value) || c.secondaryValue === 'draw4';

export const createDeck = (mode: OnlineSubMode): Card[] => {
  const deck: Card[] = [];
  let id = 0;

  const addCard = (color: CardColor, value: CardValue, secondary?: CardValue) => {
    deck.push({ id: `c-${id++}`, color, value, secondaryValue: secondary });
  };

  if (mode === 'CLASSIC') {
    COLORS.forEach(color => {
      addCard(color, '0');
      for (let i = 1; i <= 9; i++) {
        const v = i.toString() as CardValue;
        addCard(color, v);
        addCard(color, v);
      }
      for (let i = 0; i < 2; i++) {
        addCard(color, 'draw2');
        addCard(color, 'skip');
        addCard(color, 'reverse');
      }
    });
    for (let i = 0; i < 4; i++) {
      addCard('wild', 'wild');
      addCard('wild', 'draw4');
    }
  } else if (mode === 'NO_MERCY' || mode === 'SUPERIOR') {
    COLORS.forEach(color => {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i <= 9; i++) addCard(color, i.toString() as CardValue);
      }
      for (let i = 0; i < 2; i++) {
        addCard(color, 'draw2');
        addCard(color, 'draw4');
        addCard(color, 'reverse');
      }
      for (let i = 0; i < 4; i++) addCard(color, 'skip');
      for (let i = 0; i < 2; i++) {
        addCard(color, 'allIn');
        addCard(color, 'again');
      }
    });

    for (let i = 0; i < 4; i++) {
      addCard('wild', 'wild');
      addCard('wild', 'reverse4'); 
      addCard('wild', 'draw6');    
      addCard('wild', 'draw10');   
    }

    if (mode === 'SUPERIOR') {
      for (let i = 0; i < 8; i++) addCard('wild', 'vanishing');
      for (let i = 0; i < 8; i++) addCard('wild', 'ghostswap');
      for (let i = 0; i < 6; i++) addCard('wild', 'elitereverse');
      for (let i = 0; i < 8; i++) addCard('wild', 'hybrid', 'draw4');
      for (let i = 0; i < 6; i++) addCard('wild', 'all4');
    }
  }

  return shuffle(deck);
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const canPlayCard = (
  card: Card, 
  topCard: Card, 
  currentColor: CardColor, 
  stackCount: number,
  isBlackChain: boolean,
  lastPlusValue: number
): boolean => {
  if (card.value === 'vanishing') return true;

  if (stackCount > 0) {
    if (!isPlusCard(card)) return false;
    if (isBlackChain && card.color !== 'wild') return false;
    // Compares against the penalty of the last actual plus card played to enforce No Mercy stacking rules
    return getPlusValue(card) >= lastPlusValue;
  }

  if (card.value === 'ghostswap') return stackCount === 0;
  if (topCard.value === 'skip' && card.value === 'skip') return true;
  if (topCard.value === 'reverse' && card.value === 'reverse') return true;
  if (topCard.value === 'reverse4' && card.value === 'reverse4') return true;
  if (topCard.value === 'elitereverse' && card.value === 'elitereverse') return true;
  if (topCard.value === 'allIn' && card.value === 'allIn') return true;
  if (topCard.value === 'again' && card.value === 'again') return true;

  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  
  return false;
};
