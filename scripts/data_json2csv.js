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

// MODULES //

var resolve = require( 'path' ).resolve;
var readDir = require( '@stdlib/fs/read-dir' ).sync;
var writeFile = require( '@stdlib/fs/write-file' ).sync;
var readJSON = require( '@stdlib/fs/read-json' ).sync;
var extname = require( '@stdlib/utils/extname' );
var replace = require( '@stdlib/string/replace' );
var json2csv = require( './../lib/json2csv.js' );


// MAIN //

/**
* Main execution sequence.
*
* @private
*/
function main() {
	var files;
	var dpath;
	var fpath;
	var fopts;
	var data;
	var tmp;
	var ext;
	var f;
	var i;

	dpath = resolve( __dirname, '..', 'data' );
	files = readDir( dpath );
	fopts = {
		'encoding': 'utf8'
	};
	for ( i = 0; i < files.length; i++ ) {
		f = files[ i ];
		ext = extname( f );
		if ( ext !== '.json' ) {
			continue;
		}
		fpath = resolve( dpath, f );
		data = readJSON( fpath, fopts );
		if ( data instanceof Error ) {
			console.error( data.message );
			continue;
		}
		tmp = json2csv( data );
		fpath = resolve( dpath, replace( f, '.json', '.csv' ) );
		tmp = writeFile( fpath, tmp, fopts );
		if ( tmp instanceof Error ) {
			console.error( tmp.message );
			continue;
		}
	}
}

main();
