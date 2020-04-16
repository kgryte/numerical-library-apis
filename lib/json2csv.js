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

var objectKeys = require( '@stdlib/utils/keys' );
var replace = require( '@stdlib/string/replace' );


// MAIN //

/**
* Converts a JSON array to a CSV string.
*
* @private
* @param {Array<Object>} arr - JSON array
* @returns {string} CSV string
*/
function json2csv( arr ) {
	var headers;
	var out;
	var tmp;
	var N;
	var M;
	var o;
	var v;
	var i;
	var j;

	out = '';
	if ( arr.length === 0 ) {
		return out;
	}
	headers = objectKeys( arr[ 0 ] );
	N = headers.length;
	for ( i = 0; i < N; i++ ) {
		out += headers[ i ];
		if ( i < N-1 ) {
			out += ',';
		}
	}
	out += '\r\n';

	M = arr.length;
	for ( i = 1; i < M; i++ ) {
		o = arr[ i ];
		tmp = '';
		for ( j = 0; j < N; j++ ) {
			v = o[ headers[ j ] ];
			v = replace( v, ',', '\\,' );
			v = replace( v, '"', '"""' );
			tmp += '"' + v + '"';
			if ( j < N-1 ) {
				tmp += ',';
			}
		}
		out += tmp + '\r\n';
	}
	return out;
}


// EXPORTS //

module.exports = json2csv;
