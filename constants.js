export const NO_PLAYER = -1
export const EMPTY_SPOT = { "player": NO_PLAYER, "count": 0 };

export const PLAYER_0_POKEY = 26;
export const PLAYER_1_POKEY = 27;
export const POKEYS = [ PLAYER_0_POKEY, PLAYER_1_POKEY ];

export const PLAYER_0_HOME = 28;
export const PLAYER_1_HOME = 29;
export const HOMES = [ PLAYER_0_HOME, PLAYER_1_HOME ];

export const PLAYER_0_START = 0;
export const PLAYER_1_START = 25;
export const STARTS = [ PLAYER_0_START, PLAYER_1_START ];

export const PLAYER_ORDERS = [
   [PLAYER_0_START, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, PLAYER_0_HOME],
   [PLAYER_1_START, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, PLAYER_1_HOME]
];

export const LAST_QUADRANTS = [
   [ 19, 20, 21, 22, 23, 24 ],
   [ 1, 2, 3, 4, 5, 6 ]
];

export const DrinkReason = {
   SOCIAL: 1,
   NUMBER: 2,
   DOUBLES: 3,
   CANT_MOVE: 4,
};