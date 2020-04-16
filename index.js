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
let BLACK = "b";
let WHITE = "w";
let BLACK_ORDER = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12 ];
let WHITE_ORDER = [ 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 ];
let POINT_COUNT = 24;

function playerColor(id) {
   if (id === "0") return BLACK;
   return WHITE;
}

function opponentColor(id) {
   if (id === "0") return WHITE;
   return BLACK;
}

function playerOrder(id) {
   if (id === "0") return BLACK_ORDER;
   return WHITE_ORDER;
}

function getSpotValue(G, section, id) {
   if (section === "points") {
      return G.points[id];
   } else if (section === "home") {
      return G.home[id];
   } else if (section === "pokey") {
      return G.pokey[id];
   }
}

function setSpotValue(G, section, id, color, count) {
   if (section === "points") {
      G.points[id] = { "color": color, "count": count};
   } else if (section === "home") {
      G.home[id] = { "color": color, "count": count};
   } else if (section === "pokey") {
      G.pokey[id] = { "color": color, "count": count};
   }
}

function emptySpot(G, section, id) {
   if (section === "points") {
      G.points[id] = null;
   } else if (section === "home") {
      G.home[id] = null;
   } else if (section === "pokey") {
      G.pokey[id] = null;
   }
}

function startDiceRoll(G, ctx) {
   G.rollingDice = ctx.random.D6(2);
}

function finishDiceRoll(G) {
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

function clickCell(G, ctx, section, id) {
   if (!G.inHand) {
      choosePiece(G, ctx, section, id);
   } else {
      placePiece(G, ctx, G.inHand.section, G.inHand.id, section, id);
   }
}

function resolveAceyDeucey(G, ctx, number) {
   // Get rid of the acey-deucey indicator.
   G.dice.splice(G.dice.indexOf(12), 1);
   G.dice.push (number, number, number, number);
}

function getPossibleMoves(G, ctx, section, id) {
   let order = playerOrder(ctx.currentPlayer);
   let currentSpot = -1;
   if (section === "points") {
      currentSpot = order.indexOf(id);
   }

   // Start by getting moves assuming board is empty.
   let rawMoves = [];
   G.dice.forEach(function(element) {
      if (element + currentSpot < POINT_COUNT) {
         rawMoves.push({"spot":order[element + currentSpot], "die": element});
      }
   });

   // destination is empty point
   // destination is spot with players pieces
   // destination is spot with 1 opponent piece
   // TODO: destination is home and all checkers are in last quadrant
   let possibleMoves = [];
   rawMoves.forEach(function(element) {
      let spotValue = getSpotValue(G, section, id);
      if (spotValue === null ||
          spotValue.color === playerColor(ctx.currentPlayer) ||
          (spotValue.color === opponentColor(ctx.currentPlayer) && spotValue.count === 1)) {
             possibleMoves.push(element);
      }
   });

   return rawMoves;
}

function choosePiece(G, ctx, section, id) {
   let value = getSpotValue(G,section,id);
   // Check to see if chosen spot has a player's piece and that piece has somewhere to go.
   if (value && value.color === playerColor(ctx.currentPlayer) && getPossibleMoves(G, ctx, section, id).length) {
      // Pick up the piece.
      G.inHand = { section: section, id: id }
      // Remove piece from board.
      let currentValue = getSpotValue(G, section, id);
      if (currentValue.count-1 > 0) {
         setSpotValue(G, section, id, currentValue.color, --currentValue.count);
      } else {
         emptySpot(G, section, id);
      }
   }
}

function placePiece(G, ctx, lastSection, lastId, section, id) {
   let moves = getPossibleMoves(G, ctx, lastSection, lastId);
   // Look over the possible moves to see if player picked one of those.
   moves.some(function(element) {
      if (element.spot === id) {
         // Update new spot.
         let currentSpot  = getSpotValue(G, section, id);
         if (currentSpot === null) {
            setSpotValue(G, section, id, playerColor(ctx.currentPlayer), 1);
         } else if (currentSpot.color === playerColor(ctx.currentPlayer)) {
            setSpotValue(G, setSpotValue, id, currentSpot.color, ++currentSpot.count);
         } else if (currentSpot.color === opponentColor(ctx.currentPlayer)) {
            // TODO: handle opponent already on pokey.
            // TODO: pokeys are backwards from other sections.
            setSpotValue(G, "pokey", ctx.currentPlayer, opponentColor(ctx.currentPlayer), "1");
            setSpotValue(G, section, id, playerColor(ctx.currentPlayer), 1);
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
                   points: Array(24).fill(null),
                   home: [ {"color": "b", "count": 15}, {"color": "w", count: 15}],
                   pokey: Array(2).fill(null),
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
         moves: { clickCell, startDiceRoll, finishDiceRoll, resolveAceyDeucey },
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
