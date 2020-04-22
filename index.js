import {
   NO_PLAYER,
   EMPTY_SPOT,
   POKEYS,
   PLAYER_0_HOME,
   PLAYER_1_HOME,
   HOMES,
   PLAYER_0_START,
   PLAYER_1_START,
   PLAYER_ORDERS,
   LAST_QUADRANTS,
   DrinkReason,
 } from "./constants";

 import { v4 as uuidv4 } from 'uuid';

 const PlayerState = {
   PLAYING: 1,
   ON_POKEY: 2,
   MOVING_IN: 3
};

function IsVictory(G, ctx) {
   return G.spots[HOMES[currentPlayerId(ctx)]].count === 15;
}

function addDrink(G, ctx, player, reason, notified=false, count=1 ) {
   let drink = {
      id: uuidv4(),
      turn: ctx.turn,
      player: player,
      reason: reason,
      count: count,
      notified: notified
   }
   G.drinks.push (drink);
}

// start game

function startRollForNumbers(G, ctx) {
   if(G.numbers.every(element => element === null)) {
      // Both players are rolling for number.
      G.rollingDice = ctx.random.D6(4);
   } else {
      // One of the players has yet to set a number.
      G.rollingDice = ctx.random.D6(2);
   }
}

function finishRollForNumbers(G, ctx) {
   // Can't have acey-deuecy or any socials.
   let badNumbers = [ 3 ].concat(G.socials);

   if(G.numbers.every(element => element === null)) {
      // Both players are rolling for number.
      let p1number = G.rollingDice[0] + G.rollingDice[1];
      let p2number = G.rollingDice[2] + G.rollingDice[3];

      if (p1number === p2number && !G.socials.includes(p1number)) {
         G.socials.push(p1number);
         G.rollingDice = null;

         if (G.numbers.includes(null)) {
            startRollForNumbers(G, ctx);
         }
         return;
      } else {
         if (!badNumbers.includes(p1number)) {
            G.numbers[0] = p1number;
         }
         if (!badNumbers.includes(p2number)) {
            G.numbers[1] = p2number;
         }
      }
   } else {
      // One of the players has yet to set a number.
      let number = G.rollingDice[0] + G.rollingDice[1];

      // Check to see if single roll matches already set number.
      if ((G.numbers[0] === null && number === G.numbers[1]) || 
          (G.numbers[1] === null && number === G.numbers[0])) {
            G.socials.push(number)
            G.numbers = Array(2).fill(null);
      }
      // Next, ensure new number is allowed.
      else if (!badNumbers.includes(number)) {
         if (G.numbers[0] === null) {
            G.numbers[0] = number;
         } else {
            G.numbers[1] = number;
         }
      }
   }

   G.rollingDice = null;

   if (G.numbers.includes(null)) {
      startRollForNumbers(G, ctx);
   }
}

function startRollForStart (G, ctx) {
   // Roll for Start
   G.rollingDice = ctx.random.D6(2);
}

function finishRollForStart (G, ctx) {
   if (G.rollingDice[0] === G.rollingDice[1]) {
      G.dice.push(G.rollingDice[0], G.rollingDice[0], G.rollingDice[0], G.rollingDice[0]);

      // Roll again.
      G.rollingDice = null;
      startRollForStart(G, ctx);
   } else {
      if (G.rollingDice[0] + G.rollingDice[1] === 3) {
         G.dice.push(12);
      } else {
         G.dice.push(G.rollingDice[0], G.rollingDice[1]);
      }
      G.rollingDice = null;
   }
}

function getFirstPlayer(G, ctx) {
   if (G.dice[G.dice.length - 1] > G.dice[G.dice.length - 2]){
      return 1;
   } else {
      return 0;
   }
}

// play game
function startDiceRoll(G, ctx) {
   G.rollingDice = ctx.random.D6(2);
}

function startOverrideDiceRoll(G, ctx) {
   // Set G.rollingDice to what you want.
}

function checkForMoves(G, ctx) {
   if (getAllPossibleMoves(G, ctx).length === 0) {
      // If there are un-used dice drink and clear out.
      if (G.dice.length) {
         addDrink(G, ctx, currentPlayerId(ctx), DrinkReason.CANT_MOVE, false, G.dice.length);
         G.dice = [];
      }
      if (!G.hadDoubles) {
         ctx.events.endTurn();
      }
      // Reset doubles indicator.
      G.hadDoubles = false;
   }
}

function finishDiceRoll(G, ctx) {
   let total = G.rollingDice.reduce(function(a, b){return a + b;}, 0);

   if (G.rollingDice) {
      if (G.rollingDice[0] === G.rollingDice[1]) {
         G.dice.push (G.rollingDice[0], G.rollingDice[0], G.rollingDice[0], G.rollingDice[0]);
         G.hadDoubles = true;
      } else if (total === 3) {
         G.dice.push(12);
         G.hadDoubles = true;
      } else {
         G.dice = G.rollingDice;
      }

      // Doubles
      if (G.hadDoubles) {
         addDrink(G, ctx, currentOpponentId(ctx), DrinkReason.DOUBLES);
      }
      // Numbers
      G.numbers.forEach(function(number, index) {
         if (total === number) {
            addDrink(G, ctx, index, DrinkReason.NUMBER);
         }
      });
      // Social!
      if (G.socials.includes(total)) {
         addDrink(G, ctx, 0, DrinkReason.SOCIAL);
         // No need to notify both users of a social but do want to track everyone's drinks.
         addDrink(G, ctx, 1, DrinkReason.SOCIAL, true);
      }

      G.rollingDice = null;
   }

   checkForMoves(G, ctx);
}

function resolveAceyDeucey(G, ctx, number) {
   // Get rid of the acey-deucey indicator.
   G.dice.splice(G.dice.indexOf(12), 1);
   G.dice.push (number, number, number, number);

   // Make sure they didn't pick a number that can't move like a real dummy.
   checkForMoves(G, ctx);
}

function markDrinkNotified(G, ctx, id) {
   for (let drink of G.drinks) {
      if (drink.id === id) {
         drink.notified = true;
         break;
      }
    }
}

function clickCell(G, ctx, id) {
   if (G.inHand === null) {
      choosePiece(G, ctx, id);
   } else {
      placePiece(G, ctx, G.inHand, id);
   }
}

function currentPlayerId(ctx) {
   return Number(ctx.currentPlayer);
}

function currentOpponentId(ctx) {
   if (ctx.currentPlayer === "0") {
      return 1;
   } else {
      return 0;
   }
}

function destinationFilter(G, ctx, moves) {
   // destination is empty point
   // destination is spot with players pieces
   // destination is spot with 1 opponent piece
   let possibleMoves = [];
   moves.forEach(function(move) {
      if (G.spots[move.spot].player === NO_PLAYER ||
         G.spots[move.spot].player === currentPlayerId(ctx) ||
         (G.spots[move.spot].player !== currentPlayerId(ctx) && G.spots[move.spot].count === 1)) {
            possibleMoves.push(move);
      }
   });
   return possibleMoves;
}

function getPossibleMoves(G, ctx, id) {
   let order = PLAYER_ORDERS[currentPlayerId(ctx)];
   let orderedSpot = order.indexOf(id);
   let possibleMoves = [];

   if (G.playerState[currentPlayerId(ctx)] === PlayerState.MOVING_IN) {
      // Put in a dummy move to trick the game in to moving forward until
      //the player resolves the acey-deucy.
      if (G.dice.includes(12)) {
         return [ {"spot": 0, "die": 12}];
      }
      
      // Only possible moves are directly home.
      G.dice.forEach(function(die) {
         if (order[die + orderedSpot] === HOMES[currentPlayerId(ctx)]) {
            possibleMoves.push({"spot": order[die + orderedSpot], "die": die});
         }
      });
   } else if (G.playerState[currentPlayerId(ctx)] === PlayerState.ON_POKEY) {
      // Can't move a non-pokey piece or if you didn't get doubles/acey-deucey.
      if (id !== POKEYS[currentPlayerId(ctx)] || !G.hadDoubles) {
         return [];
      }
      
      // Raw moves are 
      let rawMoves = [];
      G.dice.forEach(function(die) {
         rawMoves.push({"spot": order[die], "die": die});
      });

      // Filter out moves that you can't move to.
      possibleMoves = destinationFilter(G, ctx, rawMoves);

      let destinations = [];
      possibleMoves.forEach(function(move){
         destinations.push(move.spot);
      })
   } else {
      // No possible moves if piece is in last quadrant and you're not moving in.
      if (LAST_QUADRANTS[currentPlayerId(ctx)].includes(id)) {
         return [];
      }

      // Start by getting moves assuming board is empty.
      let rawMoves = [];
      G.dice.forEach(function(die) {
         if (die + orderedSpot < order.length) {
            rawMoves.push({"spot": order[die + orderedSpot], "die": die});
         }
      });

      // Filter out moves that you can't move to.
      possibleMoves = destinationFilter(G, ctx, rawMoves);
   }
   return possibleMoves;
}

function getAllPossibleMoves(G, ctx) {
   let allPossibleMoves = [];
   G.spots.forEach(function(spot, index) {
      if (spot.player === currentPlayerId(ctx)) {
         allPossibleMoves = allPossibleMoves.concat(getPossibleMoves(G, ctx, index));
      }
   });
   return allPossibleMoves;
}

function choosePiece(G, ctx, id) {
   // Check to see if chosen spot has a player's piece and that piece has somewhere to go.
   if (G.spots[id].player === currentPlayerId(ctx) && getPossibleMoves(G, ctx, id).length) {
      // Pick up the piece.
      G.inHand = id;
      // Remove piece from board.
      if (G.spots[id].count-1 > 0) {
         G.spots[id] = { "player": G.spots[id].player, "count": --G.spots[id].count};
      } else {
         G.spots[id] = EMPTY_SPOT;
      }
   }
}

function placePiece(G, ctx, lastId, id) {
   // Figure out where the user is actually trying to go.
   let destinationId = id;
   if (G.playerState[currentPlayerId(ctx)] === PlayerState.MOVING_IN) {
      if (id === PLAYER_0_START) { destinationId = PLAYER_0_HOME; } 
      else if (id === PLAYER_1_START) { destinationId = PLAYER_1_HOME; }
   }

   // Look over the possible moves to see if player picked one of those.
   getPossibleMoves(G, ctx, lastId).some(function(element) {
      if (element.spot === destinationId) {
         if (G.spots[destinationId].player === NO_PLAYER) {
            // Put piece in empty spot.
            G.spots[destinationId] = { "player": currentPlayerId(ctx), "count": 1 };
         } else if (G.spots[destinationId].player === currentPlayerId(ctx)) {
            // Put piece with another piece.
            G.spots[destinationId] = { "player": G.spots[destinationId].player, "count": ++G.spots[destinationId].count};
         } else if (G.spots[destinationId].player !== currentPlayerId(ctx) && G.spots[destinationId].count === 1) {
            // Put opponent on pokey
            if (G.spots[POKEYS[currentOpponentId(ctx)]].player === NO_PLAYER) {
               G.spots[POKEYS[currentOpponentId(ctx)]] = { "player": currentOpponentId(ctx), "count": 1};
            } else {
               G.spots[POKEYS[currentOpponentId(ctx)]] = { "player": currentOpponentId(ctx), "count": ++G.spots[POKEYS[currentOpponentId(ctx)]].count };
            }
            G.playerState[currentOpponentId(ctx)] = PlayerState.ON_POKEY;
            // Put piece in opponents old spot.
            G.spots[destinationId] = { "player": currentPlayerId(ctx), "count": 1 };
         }
         
         // Clean up.
         G.dice.splice(G.dice.indexOf(element.die), 1);
         G.inHand = null;
         
         // Check for moving in.
         let lastQuadrantCount = G.spots[HOMES[currentPlayerId(ctx)]].count;
            LAST_QUADRANTS[currentPlayerId(ctx)].forEach (function(id) {
            lastQuadrantCount += G.spots[id].count;
         });
         if (lastQuadrantCount === 15 || lastQuadrantCount === 14 && G.inHand) {
            G.playerState[currentPlayerId(ctx)] = PlayerState.MOVING_IN;
         }

         // Check for of pokey
         if (G.spots[POKEYS[currentPlayerId(ctx)]].count === 0 && G.playerState[currentPlayerId(ctx)] !== PlayerState.MOVING_IN) {
            G.playerState[currentPlayerId(ctx)] = PlayerState.PLAYING;
         }

         // End the turn if out of moves.
         checkForMoves(G, ctx);
         return true;
      }
      return false;
   });
}


export const Beergammon = {
   name: "beergammon",

   setup: () => ({ numbers: Array(2).fill(null),
                   socials: [ 10 ],
                   spots: Array(30).fill(EMPTY_SPOT),
                   dice: Array(),
                   hadDoubles: false,
                   playerState: [ PlayerState.PLAYING, PlayerState.PLAYING ],
                   rollingDice: null,
                   inHand: null,
                   drinks: Array() }),

   phases: {
      rollForNumbers: {
         moves: { startRollForNumbers, finishRollForNumbers },
         endIf: G => (G.numbers.every(element => element !== null)),
         next: 'startGame',
         start: true,
      },
      startGame: {
         moves: { startRollForStart, finishRollForStart },
         endIf: G => (G.dice.length !== 0 && G.dice[G.dice.length - 1] !== G.dice[G.dice.length - 2]),
         next: 'play',
      },
      play: {
         moves: { clickCell, startDiceRoll, finishDiceRoll, resolveAceyDeucey, markDrinkNotified, startOverrideDiceRoll },
         onBegin: (G, ctx) => {
            G.spots[PLAYER_0_START] = { "player": 0, "count": 15 };
            G.spots[PLAYER_1_START] = { "player": 1, "count": 15};
          },
         turn: {
            order: {
              first: (G, ctx) => getFirstPlayer(G, ctx),
              next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers,
            }
          }
      },
   },

   endIf: (G, ctx) => {
      if (IsVictory(G, ctx)) {
         return { winner: ctx.currentPlayer };
      }
   },
};

export default Beergammon;
