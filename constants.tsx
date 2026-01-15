
import React from 'react';
import { CardColor, CardValue } from './types';

export const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
export const VALUES: CardValue[] = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'skip', 'reverse', 'draw2'
];

export const INITIAL_USER_ID = 'UID-8829-XJ';

export const AVATARS = [
  'https://picsum.photos/seed/p1/200',
  'https://picsum.photos/seed/p2/200',
  'https://picsum.photos/seed/p3/200',
  'https://picsum.photos/seed/p4/200',
];

export const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  cardPlay: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  draw: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  uno: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};
