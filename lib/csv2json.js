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

var RE_EOL = require( '@stdlib/regexp/eol' );


// MAIN //

/**
* Converts a CSV string to a JSON array.
*
* @private
* @param {string} csv - CSV string
* @returns {Array<Object>} JSON array
*/
function csv2json( csv ) {
	var nfields;
	var fields;
	var nrows;
	var rows;
	var out;
	var r;
	var o;
	var i;
	var j;

	out = [];
	rows = csv.split( RE_EOL );
	nrows = rows.length;
	if ( nrows === 0 ) {
		return out;
	}
	// We assume that the first row is a header row:
	fields = rows[ 0 ].split( ',' );
	nfields = fields.length;

	for ( i = 1; i < nrows; i++ ) {
		r = rows[ i ];

		// We assume simple CSV rows:
		r = r.substring( 1, r.length-1 ).split( '","' );

		// Assemble the data object...
		o = {};
		for ( j = 0; j < nfields; j++ ) {
			o[ fields[ j ] ] = r[ j ];
		}

		// Append to the output data array:
		out.push( o );
	}
	return out;
}


// EXPORTS //

module.exports = csv2json;
