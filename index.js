// Return true if `points` is in a winning configuration.
function IsVictory(points) {
   // TODO: IsVictory
   return false
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
      if (G.numbers[0] === null) {
         badNumbers.push(G.numbers[1]);
      } else {
         badNumbers.push(G.numbers[0]);
      }

      let number = G.rollingDice[0] + G.rollingDice[1];

      if (!badNumbers.includes(number)) {
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
let PLAYER_ORDERS = [
   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 0],
   [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 15]
]

function startDiceRoll(G, ctx) {
   G.rollingDice = ctx.random.D6(2);
}

function startOverrideDiceRoll(G, ctx) {
   // Set G.rollingDice to what you want.
}

function finishDiceRoll(G) {
   if (G.rollingDice) {
      if (G.rollingDice[0] === G.rollingDice[1]) {
         G.dice.push (G.rollingDice[0], G.rollingDice[0], G.rollingDice[0], G.rollingDice[0]);
         G.hadDoubles = true;
      } else if (G.rollingDice[0] + G.rollingDice[1] === 3) {
         G.dice.push(12);
         G.hadDoubles = true;
      } else {
         G.dice = G.rollingDice;
      }

      G.rollingDice = null;
   }
}

function resolveAceyDeucey(G, ctx, number) {
   // Get rid of the acey-deucey indicator.
   G.dice.splice(G.dice.indexOf(12), 1);
   G.dice.push (number, number, number, number);
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

function getPossibleMoves(G, ctx, id) {
   let order = PLAYER_ORDERS[currentPlayerId(ctx)];
   let currentSpot = order.indexOf(id);

   // Start by getting moves assuming board is empty.
   let rawMoves = [];
   G.dice.forEach(function(die) {
      if (die + currentSpot < order.length) {
         rawMoves.push({"spot": order[die + currentSpot], "die": die});
      }
   });

   // destination is empty point
   // destination is spot with players pieces
   // destination is spot with 1 opponent piece
   // TODO: destination is home and all checkers are in last quadrant
   let possibleMoves = [];
   rawMoves.forEach(function(move) {
      if (G.spots[move.spot] === null ||
          G.spots[move.spot].player === currentPlayerId(ctx) ||
          (G.spots[move.spot].player !== currentPlayerId(ctx) && G.spots[move.spot].count === 1)) {
             possibleMoves.push(move);
      }
   });

   return possibleMoves;
}

function choosePiece(G, ctx, id) {
   // Check to see if chosen spot has a player's piece and that piece has somewhere to go.
   if (G.spots[id] && G.spots[id].player === currentPlayerId(ctx) && getPossibleMoves(G, ctx, id).length) {
      // Pick up the piece.
      G.inHand = id;
      // Remove piece from board.
      if (G.spots[id].count-1 > 0) {
         G.spots[id] = { "player": G.spots[id].player, "count": --G.spots[id].count};
      } else {
         G.spots[id] = null;
      }
   }
}

function placePiece(G, ctx, lastId, id) {
   // Look over the possible moves to see if player picked one of those.
   getPossibleMoves(G, ctx, lastId).some(function(element) {
      if (element.spot === id) {
         if (G.spots[id] === null) {
            // Put piece in empty spot.
            G.spots[id] = { "player": currentPlayerId(ctx), "count": 1 };
         } else if (G.spots[id].player === currentPlayerId(ctx)) {
            // Put piece with another piece.
            G.spots[id] = { "player": G.spots[id].player, "count": ++G.spots[id].count};
         } else if (G.spots[id].player !== currentPlayerId(ctx) && G.spots[id].count === 1) {
            // Put opponent on pokey
            if (currentPlayerId(ctx) === 0) {
               if (G.spots[27] === null) {
                  G.spots[27] = { "player": 1, "count": 1}
               } else {
                  G.spots[27] = { "player": 1, "count": ++G.spots[27].count };
               }
            } else {
               if (G.spots[26] === null) {
                  G.spots[26] = { "player": 0, "count": 1}
               } else {
                  G.spots[26] = { "player": 0, "count": ++G.spots[26].count };
               }
            }
            // Put piece in opponents old spot.
            G.spots[id] = { "player": currentPlayerId(ctx), "count": 1 };
         }
         // Remove used die.
         G.dice.splice(G.dice.indexOf(element.die), 1);
         // Clear hand.
         G.inHand = null;
         // End turn if done.
         if (G.dice.every(element => element === null)) {
            if (G.hadDoubles) { 
               G.hadDoubles = false; 
            } else {
               ctx.events.endTurn();
            }
         }
         return true;
      }
      return false;
   });
}

export const Beergammon = {
   name: "beergammon",

   setup: () => ({ numbers: Array(2).fill(null),
                   socials: [ 10 ],
                   spots: Array(28).fill(null),
                   dice: Array(),
                   hadDoubles: false,
                   rollingDice: null,
                   inHand: null }),

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
         moves: { clickCell, startDiceRoll, finishDiceRoll, resolveAceyDeucey, startOverrideDiceRoll },
         onBegin: (G, ctx) => {
            G.spots[0] = { "player": 0, "count": 15 };
            G.spots[25] = { "player": 1, "count": 15};
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
      if (IsVictory(G.points)) {
         return { winner: ctx.currentPlayer };
      }
   },
};

export default Beergammon;
