#!/usr/bin/env node


/*jslint white: true, devel: true, rhino: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true, maxlen: 80 */
/*global require, setInterval, clearInterval, process */
"use strict";


var Fs = require('fs');
var Less = require('less');
var Http = require('http');
var Optparse = require('optparse');

var options = null;


function main (args) {
    options = getOptions(args);
    startServer(options.listen, options.port);
    return 0;
}


function startServer (listen, port) {
    Http.createServer(request).listen(port, listen);
    return true;
}


function request (req, res) {
    var fpath, fstat;
    fpath = getPath(options.root, req.url);
    if (fpath === null) {
        err(res);
        return false;
    }
    if (fileStat(fpath) !== 1) {
        err(res);
        return false;
    }
    Fs.readFile(fpath, 'utf-8', function (err1, data1) {
        if (err1) {
            err();
            return false;
        }
        Less.render(data1, function (err2, data2) {
            if (err2) {
                err();
                return false;
            }
            write(res, data2);
        });
        return true;
    });
    return true;
}


function write (res, data) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(data);
    return true;
}


function err (res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('');
    return true;
}


function getPath (root, url) {
    var fparts, dparts, pth, i, _i, out;
    if (url.length <= 1) {
        return null;
    }
    pth = url.slice(1);
    dparts = pth.split('/');
    fparts = dparts[dparts.length - 1].split('.');
    if (fparts.length < 2 || fparts[fparts.length - 1] !== 'less') {
        return null;
    }
    for (i = 0, _i = dparts.length; i < _i; i++) {
        if (dparts[i][0] === '.' || dparts[i][0] === '') {
            return null;
        }
    }
    out = [root, pth].join('/');
    return out;
}


function fileStat (fpath) {
    var s, exists, type;
    exists = true;
    try {
        s = Fs.statSync(fpath);
    }
    catch (e) {
        exists = false;
    }
    if (exists) {
        type = (s.isDirectory() ? 2 : 1);
    }
    else {
        type = 0;
    }
    return type;
}


function getOptions (args) {
    var options, optParser;
    options = {
        'help' : false,
        'port' : 61775,
        'listen' : '127.0.0.1',
        'root' : null
    };
    optParser = new Optparse.OptionParser([
        ['-h', '--help', 'Show this help.'],
        ['-p', '--port NUMBER', 'Port to listen on. Default is 61775.'],
        ['-s', '--listen', 'Interface to listen on. Default is "127.0.0.1".']
    ]);
    optParser.banner = "Usage: node lessweb.js ROOT [OPTIONS]";
    optParser.on('help', function (val) {
        options.help = true;
        return true;
    });
    optParser.on(2, function (val) {
        var fpath, fstat;
        fpath = (val.slice(-1) === '/' ? val.slice(0, -1) : val);
        fstat = fileStat(fpath);
        if (fstat === 0) {
            console.log(fpath + ' does not exist');
            process.exit(1);
        }
        else if (fstat !== 2) {
            console.log(fpath + ' is not a directory');
            process.exit(1);
        }
        else {
            options.root = fpath;
        }
        return true;
    });
    optParser.on('port', function (name, val) {
        options.port = parseInt(val, 10);
        return true;
    });
    optParser.on('listen', function (name, val) {
        options.listen = val;
        return true;
    });
    optParser.parse(args);
    if (options.help) {
        console.log(optParser.toString());
        console.log();
        console.log('ROOT is the root directory from ' +
                    'which files .less files are retrieved.');
        process.exit(0);
    }
    else if (options.root === null) {
        console.log('ROOT is required')
        process.exit(1);
    }
    return options;
};


main(process.argv);

