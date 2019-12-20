#!/usr/bin/env node

(() => {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var glob = require('glob');
	var minimist = require('minimist');

	var inliner = require('./bin/inliner.js');

	var args = minimist(process.argv.slice(2), {
		alias: {
			s: 'silent',
			c: 'compress'
		},
		boolean: ['silent', 'compress']
	});

	var directory = args._.slice()[0];

	if (!directory) {
		console.log('ngi [-s|--silent] [-c|--compress] <directory>');
	} else {
		glob(directory + '/**/*.+(component.js|metadata.json)', {}, (error, files) => {
			if (error) {
				console.error('Failed to find component files from: ' + directory);

				process.exit(1);
			} else {
				files.forEach((file) => {
					var target = path.join(process.cwd(), file);

					var content = fs.readFileSync(target);

					if (content) {
						if (!args.silent) {
							console.log('Procesing: ' + target);
						}

						inliner(directory, content.toString(), args.compress, file.slice(-4) === 'json')
							.then((result) => {
								fs.writeFile(target, result, (error) => {
									if (error) {
										console.error('Error processing file: ' + file);
										console.error('The received error was: ' + error);
									}
								});
							}).catch((error) => {
								console.error('Inlining failed with error: ' + error);
							});
					} else {
						console.error('Failed to read content from file: ' + file);
					}
				});
			}
		});
	}
})();
