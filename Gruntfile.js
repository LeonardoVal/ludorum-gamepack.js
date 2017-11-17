/** Gruntfile for [ludorum-gamepack.js](http://github.com/LeonardoVal/ludorum-gamepack.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceFiles: [
			'src/__prologue__.js',
			'node_modules/@creatartis/ludorum-game-connect4/build/ludorum-game-connect4-raw.js',
			'node_modules/@creatartis/ludorum-game-colograph/build/ludorum-game-colograph-raw.js',
			'node_modules/@creatartis/ludorum-game-mancala/build/ludorum-game-mancala-raw.js',
			'node_modules/@creatartis/ludorum-game-reversi/build/ludorum-game-reversi-raw.js',
			'src/__epilogue__.js'
		],
		//sourceMap: false,
		concatProcess: function (src, filepath) { // Code wrapper for game libraries.
			var chk = /@creatartis\/(ludorum-game-.*?)\/.*?-raw.js/.exec(filepath);
			if (chk) {
				return '(function () { this[\''+ chk[1] +'\'] = ('+ src +
					'\n)(base, Sermat, ludorum); }).call(that);\n';
			} else {
				return src;
			}
		},
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
		 		path: 'node_modules/sermat/build/sermat-umd-min.js' },
			{ id: 'ludorum' }
		]
	});

	grunt.registerTask('default', ['build']);
};
