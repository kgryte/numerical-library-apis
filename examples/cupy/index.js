/**
* @license Apache-2.0
*
* Copyright (c) 2020 Quansight.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var join = require( 'path' ).join;
var writeFileSync = require( '@stdlib/fs/write-file' ).sync;
var scrape = require( './../../lib/cupy.js' );
var json2csv = require( './../../lib/json2csv.js' );

(async function run() {
	var results;
	var fpath;

	results = await scrape();

	fpath = join( __dirname, 'data.json' );
	writeFileSync( fpath, JSON.stringify( results ) );

	fpath = join( __dirname, 'data.csv' );
	writeFileSync( fpath, json2csv( results ) );
})();
