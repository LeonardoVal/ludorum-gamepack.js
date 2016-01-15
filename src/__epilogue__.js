// See __prologue__.js
	'Chess Colograph ConnectFour Mancala Othello'.split(/\s+/).forEach(function (id) {
		var game = exports[id];
		ludorum.games[id] = game;
		if (game.__SERMAT__) {
			game.__SERMAT__.identifier = exports.__package__ +'.'+ game.__SERMAT__.identifier;
			exports.__SERMAT__.include.push(game);
		}
	});
	Sermat.include(exports); // Ludorum uses Sermat internally.
	
	return exports;
});