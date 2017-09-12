/** Gruntfile for [ludorum-gamepack.js](http://github.com/LeonardoVal/ludorum-gamepack.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__', '__epilogue__'],
		deps: [
			'@creatartis/ludorum-game-connect4',
			'@creatartis/ludorum-game-colograph',
			'@creatartis/ludorum-game-mancala',
			'@creatartis/ludorum-game-reversi',
			{ id: 'sermat', path: 'node_modules/sermat/build/sermat-umd-min.js', indirect: true }
		]
	});

	grunt.registerTask('default', ['build']);
};
