(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["ludorum-game-connect4","ludorum-game-colograph","ludorum-game-mancala","ludorum-game-reversi","sermat"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("@creatartis/ludorum-game-connect4"),require("@creatartis/ludorum-game-colograph"),require("@creatartis/ludorum-game-mancala"),require("@creatartis/ludorum-game-reversi"),require("sermat")); // CommonJS module.
			} else {
				this["ludorum-gamepack"] = init(this["ludorum-game-connect4"],this["ludorum-game-colograph"],this["ludorum-game-mancala"],this["ludorum-game-reversi"],this.sermat); // Browser.
			}
		}).call(this,/** Package wrapper and layout.
*/
function __init__(connect4, colograph, mancala, reversi) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-gamepack',
		__name__: 'ludorum_gamepack',
		__init__: __init__,
		__dependencies__: [connect4, colograph, mancala, reversi],
		__SERMAT__: { include: [connect4, colograph, mancala, reversi] }
	};

// Imports /////////////////////////////////////////////////////////////////////////////////////////

	exports.connect4 = connect4;
	exports.colograph = colograph;
	exports.mancala = mancala;
	exports.reversi = reversi;


// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-gamepack.js.map