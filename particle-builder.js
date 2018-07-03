//1. Install dependencies
//npm install

//2. Set your auth token:
//export AUTH_TOKEN=xxxxxxx
//You can generate one, or get it from the Settings tab at https://build.particle.io.

//3. Run the program:
//npm start <path_to_source_to_build>

//You can also save the auth token in a file config.json that will be read at startup if present.
const config = require('./config');

const fs = require('fs');
const path = require('path');

const argv = require('yargs')
.usage('Usage: $0 [options] [<path>]')
.argv;

//https://github.com/nodeca/js-yaml
var yaml = require('js-yaml');

const spawn = require('child_process').spawn;


var projectDirsAbsPaths = argv._;
if (projectDirsAbsPaths.length == 0) {
	projectDirsAbsPaths.push(__dirname);
}

var buildData;
var buildIndex = 0;
var platformIndex = 0;
var versionIndex = 0;

console.log("projectDirsAbsPaths", projectDirsAbsPaths);

//You must set AUTH_TOKEN in an environment variable!


//Log in using the AUTH_TOKEN. This only needs to be done once as it's saved.
//Only start processing the first project if successful
{
	var args = [];

	args.push("--no-update-check");

	args.push("login");
	args.push("--token");
	args.push(config.get('AUTH_TOKEN'));

	const cmd = spawn('particle', args);

	cmd.stdout.on('data', (data) => {
		console.log(data.toString());
	});

	cmd.stderr.on('data', (data) => {
		console.log(data.toString());
	});

	cmd.on('exit', (code) => {
		console.log(`login exited with code ${code}`);
		if (code == 0) {
			processFirstProject();
		}
		else {
			console.log("not able to log in, exiting without building");
			process.exit(1);
		}
	});
}


function processFirstProject() {
	console.log("processing ", projectDirsAbsPaths[0]);

	var buildFile = path.resolve(projectDirsAbsPaths[0], 'build.yml');

	try {
		buildData = yaml.safeLoad(fs.readFileSync(buildFile, 'utf8'));

		console.log("loaded " + buildFile, buildData);

		buildIndex = 0;
		platformIndex = 0;
		versionIndex = 0;

		processNextBuild();		
	} catch (e) {
		console.log("did not load " + buildFile + ", no build.yml", e);

		processNextProject();
	}
}


/*
 * [ { build: 'example/1-simple',
    photon: [ '0.6.3', '0.7.0', '0.8.0-rc.8' ],
    p1: [ '0.7.0' ],
    electron: [ '0.6.3', '0.7.0', '0.8.0-rc.8' ] },
  { build: 'example/2-selftest', photon: [ '0.7.0' ] } ]
 */

function processNextBuild() {
	if (buildIndex >= buildData.length) {
		processNextProject();
		return;
	}

	var keys = Object.keys(buildData[buildIndex]);
	if (platformIndex >= keys.length) {
		// No more platforms, go to the next build
		buildIndex++;
		platformIndex = 0;
		versionIndex = 0;
		processNextBuild();
		return;
	}

	if (keys[platformIndex] == 'build') {
		// Skip 
		platformIndex++;
		versionIndex = 0;
		processNextBuild();
		return;
	}

	var versions = buildData[buildIndex][keys[platformIndex]];
	if (versionIndex >= versions.length) {
		// No more versions
		platformIndex++;
		versionIndex = 0;
		processNextBuild();
		return;
	}

	// To make the code simpler below, if empty we override it to . here
	if (buildData[buildIndex].build == '') {
		buildData[buildIndex].build = '.';
	}

	var buildAbsPath = path.resolve(projectDirsAbsPaths[0], buildData[buildIndex].build);
	var platformName = keys[platformIndex];
	var systemVersion = versions[versionIndex];

	versionIndex++;

	console.log("building buildAbsPath=" + buildAbsPath);
	console.log("platformName=" + platformName + " systemVersion=" + systemVersion);

	var args = [];

	args.push("--no-update-check");

	args.push("compile");
	args.push(platformName);
	args.push(buildAbsPath);
	if (systemVersion != 'latest') {
		args.push("--target");
		args.push(systemVersion);
	}
	args.push("--saveTo");
	args.push("firmware.bin");

	console.log("compiling with options", args);

	runParticle(args);
}

function processNextProject() {
	// Done handing this one, move to the next
	projectDirsAbsPaths.shift();
	if (projectDirsAbsPaths.length != 0) {
		processFirstProject();
	}	
}

function runParticle(args) {
	const cmd = spawn('particle', args);

	cmd.stdout.on('data', (data) => {
		console.log(data.toString());
	});

	cmd.stderr.on('data', (data) => {
		console.log(data.toString());
	});

	cmd.on('exit', (code) => {
		console.log(`compile exited with code ${code}`);
		if (code == 0) {
			processNextBuild();
		}
	});
}

