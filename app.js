
/**
 * ABN Look-up Viewer
 * 
 * Author: Neil Brittliff
 * 
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var pug = require('pug');

var app = express();
var favicon = require('serve-favicon');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler')
const search = require('./search');
const storage = require('./storage');

const promise = require('bluebird');

app.use(favicon(path.join(__dirname, 'public','images','favicon.ico'))); 

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(methodOverride());
app.use(express.json());    

if (process.env.NODE_ENV === 'development') {
   app.use(errorhandler())
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/modules", express.static(path.join(__dirname, 'node_modules')));

if (process.env.NODE_ENV === 'development') {
  app.use(errorhandler())
}

function logMessage(message) {
  
  console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + '[INFO] ' + message);
  
}

function logError(message) {
  
  console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' [ERROR] ' + message);
  
}

var keys = {};

// Get the Key - this file should never be checked in and may not be preset
try {
   keys = require('./keys.json');
} catch (e) { 
}

var searchKey =  process.env.SEARCH_KEY || keys.searchKey;
var searchUrl =  process.env.SEARCH_URL || keys.searchUrl;
var searchIndex =  process.env.SEARCH_INDEX || keys.searchIndex;
var accountName =  process.env.ACCOUNT_NAME || keys.accountName;
var accountKey =  process.env.ACCOUNT_KEY || keys.accountKey;
var fileSystem =  process.env.FILE_SYSTEM || keys.fileSystem;
var directory =  process.env.DIRECTORY || keys.directory;

app.get('/', routes.index);

/**
 * Respond to Get Request - Retrieve all Videos
 * 
 * @param {string} filter The URI Filter
 * @param {function} responder The responder to the web application
 * 
 */
app.all('/search', function(req, res, next) {
  var criteria = req.param('criteria');

  console.log(`Criteria: ${criteria}`);

  var service = new search(searchUrl, searchKey, searchIndex);

  service.search(criteria).then(function(result) {
    res.status(200).send(result.body);
  }); 

});

/**
 * Respond to Get Request - Retrieve all Videos
 * 
 * @param {string} filter The URI Filter
 * @param {function} responder The responder to the web application
 * 
 */
app.all('/get/:filename?', function(req, res, next) {
  var filename = req.param('filename');
  console.log(`file: ${filename}`)
  var service = new storage(accountName, accountKey, fileSystem);

  service.readFileStream(directory, filename, res);

});

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port: \'' + app.get('port') +'\'');
});

