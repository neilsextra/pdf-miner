'use strict'

const _Promise = require('bluebird');
const _Request = _Promise.promisifyAll(require('request'));
const API_VERSION = "2017-11-11"

var Search = function(url, apiKey, index, apiVersion) { 
    this.url = url;
    this.apiKey = apiKey;
    this.index = index;
    this.apiVersion = apiVersion || API_VERSION;
}

Search.prototype.search = function(criteria) {
    var url = `${this.url}/indexes/${this.index}/docs`;

    console.log(url)
    console.log(this.apiKey)
    console.log(this.apiVersion)
    var params = {};

    params['api-version'] = this.apiVersion;
    params.search = criteria;
 
    return _Request.getAsync({
        url: url,
        qs: params,
        headers:  {
             "Content-type": "application/json",
             "api-key": this.apiKey}
    });

};

module.exports = Search;