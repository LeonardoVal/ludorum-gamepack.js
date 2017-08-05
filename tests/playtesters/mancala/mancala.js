﻿require.config({ paths: {
	'creatartis-base': '../../lib/creatartis-base.min',
	'sermat': '../../lib/sermat-umd',
	'ludorum': '../../lib/ludorum.min',
	'ludorum-gamepack': '../../lib/ludorum-gamepack',
	'playtester': '../../lib/playtester-common'
}});
require(['ludorum', 'ludorum-gamepack', 'creatartis-base', 'sermat', 'playtester'],
		function (ludorum, ludorum_gamepack, base, Sermat, PlayTesterApp) {
	var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface;

	/** Custom HTML interface for Mancala.
	*/
	var MancalaHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function MancalaHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},

		/** Board is displayed in HTML as a table with two rows: north and south. The north row has the
		two stores on each side, as `TD`s with `rowspan=2`. Each table cell (houses and stores) contains
		the number of seeds inside it.
		*/
		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var ui = this,
				table, tr, td, data,
				north = game.players[0],
				south = game.players[1],
				activePlayer = game.activePlayer(),
				moves = game.moves(),
				boardSquare = function boardSquare(td, i, isStore) {
					var data = {
						id: "ludorum-square-"+ i,
						className: isStore ? "ludorum-square-store" : "ludorum-square-house",
						square: game.board[i],
						innerHTML: base.Text.escapeXML(game.board[i])
					};
					if (!isStore && moves && moves[activePlayer] && moves[activePlayer].indexOf(i) >= 0) {
						data.move = i;
						data.activePlayer = activePlayer;
						data.className = "ludorum-square-move";
						td.onclick = data.onclick = ui.perform.bind(ui, data.move, activePlayer);
					}
					td['ludorum-data'] = data;
					td.id = data.id;
					td.className = data.className;
					td.innerHTML = data.innerHTML;
					td.setAttribute("rowspan", isStore ? 2 : 1);
					return td;
				};
			ui.container.appendChild(table = document.createElement('table'));
			table.appendChild(tr = document.createElement('tr'));
			tr.appendChild(boardSquare(document.createElement('td'), game.store(north), true));
			game.houses(north).reverse().forEach(function (h) {
				tr.appendChild(boardSquare(document.createElement('td'), h, false));
			});
			tr.appendChild(boardSquare(document.createElement('td'), game.store(south), true));
			table.appendChild(tr = document.createElement('tr'));
			game.houses(south).forEach(function (h) {
				tr.appendChild(boardSquare(document.createElement('td'), h, false));
			});
			return ui;
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(new ludorum_gamepack.Mancala(), new MancalaHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] });
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, Infinity, 100)
		.playerMonteCarlo("", true, Infinity, 1000)
		.playerUCT("", true, Infinity, 100)
		.playerUCT("", true, Infinity, 1000)
		.playerAlfaBeta("", true, 3)
		.playerAlfaBeta("", true, 5)
		.playerAlfaBeta("Heuristic-\u03b1\u03b2 (4 plies)", true, 3, 'ludorum_gamepack.Mancala.defaultHeuristic')
		.playerAlfaBeta("Heuristic-\u03b1\u03b2 (6 plies)", true, 5, 'ludorum_gamepack.Mancala.defaultHeuristic')
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // require().
