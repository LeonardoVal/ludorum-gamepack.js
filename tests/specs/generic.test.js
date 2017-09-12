// This is a copy fo similar test cases used in ludorum.
define(['creatartis-base', 'sermat', 'ludorum', 'ludorum-gamepack'], function (base, Sermat, ludorum, gamepack) {
	var RANDOM = base.Randomness.DEFAULT;

	describe("imported", function () {
		function expectGame(submoduleName, gameNames) {
			var submodule = gamepack[submoduleName];
			expect(submodule).toBeOfType("object");
			gameNames.split(/\s+/).forEach(function (gameName) {
				var Game = submodule[gameName];
				expect(Game).toBeOfType("function");
				expect(new Game()).toBeOfType(ludorum.Game);
				expect(ludorum.games[gameName]).toBe(Game);
			});
		}

		it("Connect4", function () {
			expectGame('connect4', 'ConnectFour');
		}); // it "Connect4"

		it("Colograph", function () {
			expectGame('colograph', 'Colograph');
		}); // it "Connect4"

		it("Mancala", function () {
			expectGame('mancala', 'Mancala');
		}); // it "Connect4"

		it("Reversi", function () {
			expectGame('reversi', 'Reversi Othello');
		}); // it "Connect4"
	}); // describe "imported"
}); //// define.
