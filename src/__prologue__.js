/** Package wrapper and layout.
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
