var mevn = require('../');
var mout = require('mout');
var Logger = require('bower-logger');
var cli = require('../util/cli');
var version = require('../version');

var options;
var renderer;
var loglevel;
var command;
var commandFunc
var logger;
var levels = Logger.LEVELS;

options = cli.readOptions({
    'version': { type: Boolean, shorthand: 'v' },
    'help': { type: Boolean, shorthand: 'h' }
});

// Handle print of version
if (options.version) {
    process.stdout.write(version + '\n');
    process.exit();
}

// Get the command to execute
while (options.argv.remain.length) {
    command = options.argv.remain.join(' ');

    // Alias lookup
    if (mevn.abbreviations[command]) {
        command = mevn.abbreviations[command].replace(/\s/g, '.');
        break;
    }

    command = command.replace(/\s/g, '.');

    // Direct lookup
    if (mout.object.has(mevn.commands, command)) {
        break;
    }

    options.argv.remain.pop();
}

// Execute the command
commandFunc = command && mout.object.get(mevn.commands, command);
command = command && command.replace(/\./g, ' ');

// If no command was specified, show mevn help
// Do the same if the command is unknown
if (!commandFunc) {
    logger = mevn.commands.help();
    command = 'help';
// If the user requested help, show the command's help
// Do the same if the actual command is a group of other commands (e.g.: cache)
} else if (options.help || !commandFunc.line) {
    logger = mevn.commands.help(command);
    command = 'help';
// Call the line method
} else {
    logger = commandFunc.line(process.argv);

    // If the method failed to interpret the process arguments
    // show the command help
    if (!logger) {
        logger = mevn.commands.help(command);
        command = 'help';
    }
}

// Get the renderer and configure it with the executed command
renderer = cli.getRenderer(command, logger.json, mevn.config);

function handleLogger(logger, renderer) {
    logger
        .on('end', function (data) {
            if (!mevn.config.silent && !mevn.config.quiet) {
                renderer.end(data);
            }
        })
        .on('error', function (err)  {
            if (command !== 'help' && (err.code === 'EREADOPTIONS' || err.code === 'EINVFORMAT')) {
                logger = mevn.commands.help(command);
                renderer = cli.getRenderer('help', logger.json, mevn.config);
                handleLogger(logger, renderer);
            } else {
                if (levels.error >= loglevel) {
                    renderer.error(err);
                }

                process.exit(1);
            }
        })
        .on('log', function (log) {
            if (levels[log.level] >= loglevel) {
                renderer.log(log);
            }
        })
        .on('prompt', function (prompt, callback) {
            renderer.prompt(prompt)
                .then(function (answer) {
                    callback(answer);
                });
        });
}

handleLogger(logger, renderer);
