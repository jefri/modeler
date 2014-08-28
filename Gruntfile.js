/*global module:false*/
module.exports = function(grunt) {
	'use strict';
	grunt.initConfig({
		pkg: require('./package'),
		meta: {
			banner: '// <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "// " + pkg.homepage + "\n" : "" %>' +
				'// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>'
		},
		clean: {
			app: {
				src: ["build", "docs", "app/views/templates.html", 'test/unit/js']
			}
		},
		jade: {
			templates: {
				files: {
					'app/views/templates.html': ['app/components/**/*jade']
				}
			},
			page: {
				files: {
					'build/index.html': 'app/views/page/index.jade'
				}
			}
		},
		coffee: {
			app: {
				files: {
					'build/scripts/app.js': 'app/scripts/coffee/app.coffee',
					'build/scripts/filters.js': 'app/scripts/coffee/filters/*coffee',
					'build/scripts/services.js': 'app/scripts/coffee/services/*coffee',
					'build/scripts/directives.js': 'app/scripts/coffee/directives/*coffee',
					'build/scripts/controllers.js': 'app/scripts/coffee/controllers/*coffee',
					'build/scripts/components.js': 'app/components/**/script.coffee'
				},
				options: {
					bare: false
				}
			},
			dist: {
				files: {
					'build/dist/<%= pkg.name %>.js': 'build/dist/<%= pkg.name %>.coffee'
				}
			},
			src: {
				files: {
					'lib/<%= pkg.name %>.js': ['src/*']
				}
			},
			test: {
				files: {
					'test/unit/js/components.js': ['app/components/**/test*coffee'],
					'test/e2e/e2e.js': 'test/e2e/coffee/**/*coffee'
				},
				options: {
					bare: true
				}
			}
		},
		stylus: {
			app: {
				files: {
					'build/styles/<%= pkg.name %>.css': ['app/styles/styl/*styl', 'app/components/**/*styl']
				}
			}
		},
		concat: {
			coffee: {
				src: [
					'app/scripts/coffee/app.coffee',
					'app/scripts/coffeecoffee/**/*coffee',
					'app/components/**/*coffee'
				],
				dest: 'build/dist/<%= pkg.name %>.coffee'
			},
			unit: {
				src: ['test/unit/js/*'],
				dest: 'test/unit.js'
			}
		},
		copy: {
			app: {
				files: [{
					expand: true,
					cwd: 'app/scripts/lib/',
					src: ['**'],
					dest: 'build/scripts/lib/'
				}, {
					expand: true,
					cwd: 'app/styles/lib/',
					src: ['**'],
					dest: 'build/styles/lib/'
				}, {
					expand: true,
					cwd: 'app/styles/img',
					src: ['**'],
					dest: 'build/styles/img/'
				}, {
					expand: true,
					cwd: 'app/images/',
					src: ['**'],
					dest: 'build/images/'
				}, {
					src: 'app/entityContext.json',
					dest: 'build/entityContext.json'
				}]
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'build/dist/<%= pkg.name %>.js'],
				dest: 'build/dist/<%= pkg.name %>.min.js'
			}
		},
		cssmin: {
			dist: {
				files: {
					'build/dist/<%= pkg.name %>.min.css': ['build/styles/<%= pkg.name %>.css']
				}
			}
		},
		qunit: {
			files: ['test/**/*.html']
		},
		watch: {
			app: {
				files: [
					"app/scripts/coffee/**/*coffee",
					"app/views/**/*",
					"test/**/*coffee",
					"app/styles/styl/**/*",
					"app/components/**/*"
				],
				tasks: ["default"]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('views', ['jade:templates', 'jade:page']);
	grunt.registerTask('scripts', ['coffee:app', 'concat:coffee', 'coffee:dist']);
	grunt.registerTask('styles', ['stylus:app', 'cssmin:dist']);
	grunt.registerTask('app', ['views', 'scripts', 'styles', 'copy'/*, 'min'*/]);
	grunt.registerTask('server', ['coffee:src']);
	grunt.registerTask('tests', ['coffee:test', 'concat:unit']);
	grunt.registerTask('default', ['clean', 'app', 'server', 'tests']);
};
