'use strict';
/**
 * You know about the robot,
 * but make no assumptions about a `message`
 */

var Support = {},
    Queue,
    templates = require('./spotifyTemplates'),
    resultListeners = [],
    MetaData,
    manager,
    robot,
    url;

function spotRequest(path, method, params, callback) {
    console.log('SPOT:' + method, url + path, params);
    robot.http(url + path).query(params)[method]()(callback);
}

function getCurrentTrackUri (callback) {
    spotRequest('/currently-playing', 'get', {}, function (err, res, body) {
        callback(err, body);
    });
}

function determineTemplate (type) {
    switch (type) {
        case manager.types.ALBUMS:
            return templates.albumsLines;
        case manager.types.ARTISTS:
            return templates.artistsLines;
    }
    return templates.tracksLines;
}

function resultToString (data, type, userId, template) {
    var index = manager.persist(data, type, userId);
    return [templates.resultNumber(index), template(data)].join("\n");
}

function getDataHandler (userId, type, callback) {
    var rawTemplate = determineTemplate(type),
        template = function (data) {
            return rawTemplate(data, true);
        };
    return function handleData (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(err, resultToString(data, type, userId, template));
    };
}

Support.purgeLists = function () {
    manager.purge();
};

Support.purgeMusicDataCache = function () {
    MetaData.clearCache();
};

function getInflatedAlbumHandler(callback, userId) {
    return function handleInflatedAlbum (err, album) {
        var index, tracks;
        if (!err) {
            tracks = album.getTracks();
            if (tracks.length) {
                index = manager.persist(tracks, manager.types.TRACKS, userId);
            }
        }
        callback(err, album, index);
    }
}

Support.translateToAlbum = function (str, userId, callback) {
    var resultNum, listItem, results,
        data, album, metaData, track,
        inflatedAlbumHandler = getInflatedAlbumHandler(callback, userId);
    if (str.match(/^(#|:)?(\d+)$/)) {
        listItem = RegExp.$2;
        metaData = manager.getRelevantMetaData(void 0, userId, listItem);
        if (!metaData) {
            callback('Nothing found matching ' + str);
            return;
        }
        if (metaData.type === manager.types.ARTISTS) {
            callback('That\'s an artist list; use a track or album list');
            return;
        }
        if (metaData.type === manager.types.TRACKS) {
            track = manager.getResult(metaData.index)[listItem];
            if (!track.getInflatedAlbum) {
                track = new MetaData.Track(track);
            }
            track.getInflatedAlbum(inflatedAlbumHandler);
            return;
        }
        album = manager.getResult(metaData.index)[listItem];
        album.inflateTracks(inflatedAlbumHandler);
        return;
    }
    if (str.match(/^(\d+)(#|:)(\d+)/)) {
        resultNum = RegExp.$1;
        listItem = RegExp.$3;
        data = manager.getResultMetaData(resultNum);
        if (data.type === manager.types.ARTISTS) {
            callback('That\'s an artist list; use a track or album list');
            return;
        }
        results = manager.getResult(resultNum);
        if (!results || !results[listItem]) {
            callback('Item ' + listItem + ' not found for Result #' + resultNum);
            return;
        }
        if (data.type === manager.types.TRACKS) {
            track = results[listItem];
            if (!track.getInflatedAlbum) {
                track = new MetaData.Track(track);
            }
            track.getInflatedAlbum(inflatedAlbumHandler);
            return;
        }
        album = results[listItem];
        album.inflateTracks(inflatedAlbumHandler);
        return;
    }
    MetaData.findAlbums(str, 1, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        album = data[0];
        album.inflateTracks(inflatedAlbumHandler);
    });
};

Support.translateToTrack = function (str, userId, callback) {
    var resultNum, listItem, results, data;
    if (str.match(/^(#|:)?(\d+)$/)) {
        listItem = RegExp.$2;
        results = manager.getRelevantResult(manager.types.TRACKS, userId, listItem);
        if (!results || !results.length) {
            callback('Nothing found matching ' + str);
            return;
        }
        callback(null, results[listItem]);
        return;
    }
    if (str.match(/^(\d+)(#|:)(\d+)/)) {
        resultNum = RegExp.$1;
        listItem = RegExp.$3;
        data = manager.getResultMetaData(resultNum);
        if (data.type !== manager.types.TRACKS) {
            callback(templates.resultNumber(resultNum) + ' is not a track result list');
            return;
        }
        results = manager.getResult(resultNum);
        if (!results || !results[listItem]) {
            callback('Item ' + listItem + ' not found for ' + templates.resultNumber(resultNum));
            return;
        }
        callback(null, results[listItem]);
        return;
    }
    MetaData.findTracks(str, 1, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, data[0]);
    });
};

Support.translateToArtist = function (str, userId, callback) {
    var resultNum, listItem, results, data, datum, artists;
    if (str.match(/^(#|:)?(\d+)$/)) {
        listItem = RegExp.$2;
        results = manager.getRelevantResult(manager.types.ARTISTS, userId, listItem);
        if (!results || !results.length) {
            callback('Nothing found matching ' + str);
            return;
        }
        callback(null, results[listItem]);
        return;
    }
    if (str.match(/^(\d+)(#|:)(\d+)/)) {
        resultNum = RegExp.$1;
        listItem = RegExp.$3;
        data = manager.getResultMetaData(resultNum);
        results = manager.getResult(resultNum);
        if (!results || !results[listItem]) {
            callback('Item ' + listItem + ' not found for ' + templates.resultNumber(resultNum));
            return;
        }
        datum = results[listItem];
        if (data.type === manager.types.ALBUMS) {
            artists = datum.getArtists();
            if (!artists.length) {
                callback('Album has no artists :S');
                return;
            }
            callback(null, artists[0]);
            return;
        }
        if (data.type === manager.types.TRACKS) {
            //TRANSLATE TRACK TO ARTIST
            //WORK HERE
            return;
        }
        callback(null, results[listItem]);
        return;
    }
    MetaData.findArtists(str, 1, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, data[0]);
    });
};

Support.debug = function () {
    return 'debug';
};

Support.playUri = function (uri, callback) {
    spotRequest('/play-uri', 'post', {'uri' : uri}, function (err, res, body) {
        callback(err, body);
    });
};

Support.playTrack = function (track, callback) {
    return Support.playUri(track.href, callback);
};

Support.findTracks = function (query, userId, limit, callback) {
    MetaData.findTracks(query, limit, getDataHandler(userId, manager.types.TRACKS, callback));
};

Support.findAlbums = function (query, userId, limit, callback) {
    var handler = getDataHandler(userId, manager.types.ALBUMS, callback);
    if (query.match(/^\s*by\s+(.+)/)) {
        MetaData.translateToArtist(RegExp.$1, userId, function (err, artist) {
            if (err) {
                callback(err);
            }
            artist.inflateAlbums(function (err, albums) {
                if (!err) {
                    albums = albums.slice(0, limit);
                }
                handler(err, albums);
            });
        });
        return;
    }
    MetaData.findAlbums(query, limit, handler);
};

Support.findArtists = function (query, userId, limit, callback) {
    MetaData.findArtists(query, limit, getDataHandler(userId, manager.types.ARTISTS, callback));
};

module.exports = function (Robot, URL) {
    robot = Robot;
    url = URL;
    Queue = require('./spotifyQueue')(robot, URL);
    MetaData = require('./spotifyMetaData')(Robot);
    manager = require('./spotifyResultManager')(Robot);
    return Support;
};

