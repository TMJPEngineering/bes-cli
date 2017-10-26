var Q = require('q');
var Logger = require('bower-logger');

/**
 * Require commands only when called.
 *
 * Running `commandFactory(id)` is equivalent to `require(id)`. Both calls return
 * a command function. The difference is that `cmd = commandFactory()` and `cmd()`
 * return as soon as possible and load and execute the command asynchronously.
 */

function commandFactory(id) {
    function runApi() {
        var command = require(id);
        var commandArgs = [].slice.call(arguments);

        return withLogger(function (logger) {
            commandArgs.unshift(logger);

            return command.apply(undefined, commandArgs);
        });
    }

    function runFromArgv(argv) {
        var commandArgs;
        var command = require(id);

        commandArgs = command.readOptions(argv);

        return withLogger(function (logger) {
            commandArgs.unshift(logger);

            return command.apply(undefined, commandArgs);
        });
    }

    function withLogger(func) {
        var logger = new Logger();

        Q.try(func, logger)
            .done(function () {
                var args = [].slice.call(arguments);
                args.unshift('end');
                logger.emit.apply(logger, args);
            }, function (error) {
                logger.emit('error', error);
            });

        return logger;
    }

    runApi.line = runFromArgv;

    return runApi;
}

module.exports = {
    create: commandFactory('./create'),
    help: commandFactory('./help'),
    // version: commandFactory('./version')
};
