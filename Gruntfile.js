module.exports = function(grunt) {
    var debug = !grunt.option('prod');
    
	var jsFiles = {};
	jsFiles['./dist/js/tdgal.jquery.' + (!debug ? 'min.' : '') + 'js'] = './src/gallery.js';
	jsFiles['./dist/js/tdgal.angular.' + (!debug ? 'min.' : '') + 'js'] = './src/directive.js';
	jsFiles['./dist/js/tdgal.angular.standalone.' + (!debug ? 'min' : '') + 'js'] = [
		'./src/gallery.js',
		'./src/directive.js',
	];
	
	var cssFiles = {};
	cssFiles['./dist/css/tdgal.' + (!debug ? 'min.' : '') + 'css'] = './src/style.less';
	
	
	grunt.initConfig({
        uglify: {
			js: {
				files: jsFiles,
				options: {
					preserveComments: debug,
					compress: !debug,
					beautify: debug,
					mangle: !debug
				}
			}
		},
		less: {
			development: {
				files: cssFiles,
				options: {
					compress: !debug,
					yuicompress: false,
					optimization: (debug ? 2 : 10)
				}
			}
		},
		watch: {
			styles: {
				files: [
					'./src/*.less'
				], // which files to watch
				tasks: ['less'],
				options: {
					nospawn: true
				}
			},
			js: {
				files: [
                    './src/*.js'
				],
				tasks: ['uglify']
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
    grunt.registerTask('default', [ 'watch' ]);
    grunt.registerTask('build', [ 'uglify', 'less' ]);
};
