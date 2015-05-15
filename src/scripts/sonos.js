// Description:
//   Allows running some simple volume controls on a Sonos system
//
// Dependencies:
//   "sonos": "^0.8.0"
//
// Configuration:
//   HUBOT_SONOS_HOST
//   HUBOT_SONOS_PORT
//   HUBOT_SONOS_MAX_VOLUME
//
// Commands:
//   hubot vol + - Increase the volume a little
//   hubot vol - - Decrease the volume a little
//   hubot vol ++ - Increase the volume by quite a bit
//   hubot vol -- - Decrease the volume by quite a bit
//   hubot set vol to <number> - Set the volume to a specific number (between 0 and 100)
// 
// Author:
//   berg, jballant
//

var logger = require('./support/logger');
var sonos = require('sonos');

var maxVol = 50;

var _VOLUME_ = 20;

var sonosInstance;

var volumeIsLocked = false;

function getSonos() {

    // TODO: Remove and use actual sonos
    return {
        getVolume: function (cb) {
            cb(null, _VOLUME_);
        },
        setVolume: function (vol, cb) {
            _VOLUME_ = vol;
            cb();
        }
    };
    // TODO: remove above and use actual sonos code below

    var host;
    var port;
    if (!sonosInstance) {
        host = process.env.HUBOT_SONOS_HOST || 'https://sonos:1400';
        port = process.env.HUBOT_SONOS_PORT || 1400;
        maxVol = process.env.HUBOT_SONOS_MAX_VOLUME || 100;
        maxVol = parseInt(maxVol, 10);
        sonosInstance = new sonos.Sonos(host, 1400);
    }
    return sonosInstance;
}

function getVolume (callback) {
    logInfo('Getting sonos volume...');
    getSonos().getVolume(function (err, vol) {
        if (vol) {
            logInfo('Got sonos volume %s', vol);
        }
        callback(err, vol);
    });
}

function calcNewVolume (vol) {
    var ratio = 100 / maxVol;
    logInfo('Calculating new volume with input "%s" and ratio to sonos "%s"', vol, ratio);
    return Math.floor(vol / ratio);
}

function calcOrigVolume (vol) {
    var ratio = 100 / maxVol;
    logInfo('Calculating original user input volume with input "%s" and ratio to sonos "%s"', vol, ratio);
    return Math.ceil(vol * ratio);
}

function calcVolIncrease (currVol, amount) {
    var vol = calcOrigVolume(currVol) + amount;
    return calcNewVolume(vol);
}

function setVolumeTo (newVolume, callback) {
    if (newVolume < 0) {
        logInfo('New volume less than 0, using 0 instead');
        newVolume = 0;
    } else if (newVolume > maxVol) {
        logInfo('New volume greater than max, using max volume');
        newVolume = maxVol;
    }
    logInfo('Setting sonos volume to %s', String(newVolume));
    getSonos().setVolume(newVolume, callback);
}

function increaseVolByAmount (amount, callback) {
    logInfo('Increasing volume by %s', amount);
    getVolume(function (err, volume) {
        if (err) {
            return callback(err);
        }
        volume = parseInt(volume, 10);
        var newVol = calcNewVolume(calcOrigVolume(volume) + amount);
        logInfo('Calculated new sonos volume: %s', newVol);
        setVolumeTo(newVol, callback);
    });
}

function logErr (err) {
    logger.error(err);
}

function logInfo () {
    logger.minorInfo.apply(logger, arguments);
}

function sendErrorMessage (msg, err) {
    if (err && err.message) {
        logErr(err);
    }
    var text = (err && typeof err === 'string') ? err : 'An error occurred communicating with Sonos';
    return msg.send(text);
}

function lockVolume () {
    logInfo('Locking sonos volume');
    volumeIsLocked = true;
    setTimeout(function () {
        volumeIsLocked = false;
        logInfo('Volume is now unlocked');
    }, (6 * 1000));
}


module.exports = function(robot) {

    function checkInputVolume (volume, msg) {
        volume = (volume || volume === 0) ? parseInt(volume, 10) : null;
        if (volume === null || isNaN(volume)) {
            sendErrorMessage(msg, 'Unable to parse volume param');
        }
        return volume < 0 ? 0 : (volume > 100) ? 100 : volume;
    }

    function getVolumeWithMsg (msg, text) {
        getVolume(function (err, volume) {
            if (err) { return sendErrorMessage(msg, err); }
            text = text || 'Volume set to ';
            msg.send(text + calcOrigVolume(volume));
        });
    }

    function increaseVolByAmountWithMessage (msg, amount) {
        if (volumeIsLocked) {
            return sendErrorMessage(msg, ':no_good: Volume is currently locked');
        }
        increaseVolByAmount(amount, function (err) {
            if (err) { return sendErrorMessage(msg, err); }
            getVolumeWithMsg(msg);
        });
    }

    robot.respond(/vol ?\+$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, 7);
    });

    robot.respond(/vol ?\-$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, -7);
    });

    robot.respond(/vol ?\+\+$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, 14);
    });

    robot.respond(/vol ?\-\-$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, -14);
    });

    robot.respond(/vol\?/i, function (msg) {
        getVolumeWithMsg(msg, 'Volume is currently ');
    });

    robot.respond(/set vol to (\d+)/i, function (msg) {
        if (volumeIsLocked) {
            return sendErrorMessage(msg, ':no_good: Volume is currently locked');
        }

        var volume = msg.match[1];
        var newVol;
        volume = checkInputVolume(volume, msg);
        newVol = calcNewVolume(volume);
        setVolumeTo(newVol, function (err) {
            if (err) {
                return sendErrorMessage(msg);
            }
            msg.send('Volume set to ' + volume);
        });
    });

    robot.respond(/lock vol at (\d+)/i, function (msg) {
        var volume = msg.match[1];
        var newVol;
        volume = checkInputVolume(volume);
        if (volume > 70 || volume < 40) {
            return sendErrorMessage(msg, ':no_good: You may only lock at reasonable volumes');
        }
        newVol = calcNewVolume(volume);
        setVolumeTo(newVol, function (err) {
            if (err) {
                return sendErrorMessage(msg);
            }
            lockVolume();
            msg.send('Volume locked at ' + volume);
        });
    });
};