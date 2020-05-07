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
var writeFile = require( '@stdlib/fs/write-file' ).sync;
var readFile = require( '@stdlib/fs/read-file' ).sync;
var readJSON = require( '@stdlib/fs/read-json' ).sync;
var replace = require( '@stdlib/string/replace' );
var objectKeys = require( '@stdlib/utils/keys' );


// MAIN //

/**
* Main execution sequence.
*
* @private
*/
function main() {
	var fpath;
	var fopts;
	var data;
	var keys;
	var tmpl;
	var out;
	var err;
	var N;
	var M;
	var d;
	var i;
	var j;
	var k;

	fopts = {
		'encoding': 'utf8'
	};
	fpath = resolve( __dirname, '..', 'data', 'joins', 'unified_join.json' );
	data = readJSON( fpath, fopts );
	if ( data instanceof Error ) {
		console.error( data.message );
		return;
	}
	out = '<table>\n';

	keys = objectKeys( data[ 0 ] );
	N = keys.length;

	out += '<thead>\n<tr>\n';
	for ( i = 0; i < N; i++ ) {
		out += '<th>' + keys[ i ] + '</th>\n';
	}
	out += '</tr>\n</thead>\n';

	out += '<tbody>\n';
	M = data.length;
	for ( i = 0; i < M; i++ ) {
		d = data[ i ];
		out += '<tr>\n';
		for ( j = 0; j < N; j++ ) {
			k = keys[ j ];
			if ( j === 0 ) {
				out += '<th>' + d[ k ] + '</th>\n';
			} else {
				out += '<td>' + d[ k ] + '</td>\n';
			}
		}
		out += '</tr>\n';
	}
	out += '</tbody>\n';
	out += '</table>';

	// Load the HTML template:
	fpath = resolve( __dirname, '..', 'docs', 'template.html' );
	tmpl = readFile( fpath, fopts );
	if ( tmpl instanceof Error ) {
		console.error( tmpl.message );
		return;
	}
	tmpl = replace( tmpl, '{{TABLE}}', out );

	// Write the generated HTML table to file:
	fpath = resolve( __dirname, '..', 'docs', 'index.html' );
	err = writeFile( fpath, tmpl, fopts );
	if ( err instanceof Error ) {
		console.error( err.message );
		return;
	}
}

main();
