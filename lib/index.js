var commands = require('./commands');
var version = require('./version');
var abbreviations = require('./util/abbreviations')(commands);

module.exports = {
    version: version,
    commands: commands,
    abbreviations: abbreviations
};
