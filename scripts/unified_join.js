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
var keyBy = require( '@stdlib/utils/key-by' );
var objectKeys = require( '@stdlib/utils/keys' );
var hasOwnProp = require( '@stdlib/assert/has-own-property' );
var replace = require( '@stdlib/string/replace' );
var json2csv = require( './../lib/json2csv.js' );


// FUNCTIONS //

/**
* Returns a callback which returns a value assigned to a specified property.
*
* @private
* @param {string} prop - property name
* @returns {Function} callback
*/
function keyByCallback( prop ) {
	return onValue;

	/**
	* Returns a value assigned to a specified property.
	*
	* @private
	* @param {Object} value - collection value
	* @returns {string} property value
	*/
	function onValue( value ) {
		return value[ prop ];
	}
}


// MAIN //

/**
* Main execution sequence.
*
* @private
*/
function main() {
	var prefix;
	var files;
	var dpath;
	var fpath;
	var fopts;
	var data;
	var libs;
	var keys;
	var tmp;
	var ext;
	var ref;
	var out;
	var r;
	var f;
	var l;
	var i;
	var j;
	var k;

	fopts = {
		'encoding': 'utf8'
	};

	// Load NumPy data:
	fpath = resolve( __dirname, '..', 'data', 'numpy.json' );
	ref = readJSON( fpath, fopts );
	if ( ref instanceof Error ) {
		console.error( ref.message );
		return;
	}
	// Convert NumPy data to a hash table:
	ref = keyBy( ref, keyByCallback( 'name' ) );

	// Load the individual join data:
	dpath = resolve( __dirname, '..', 'data', 'joins' );
	files = readDir( dpath );
	libs = [ 'numpy' ];
	for ( i = 0; i < files.length; i++ ) {
		f = files[ i ];
		ext = extname( f );
		if ( ext !== '.json' || /unified_join/.test( f ) ) {
			continue;
		}
		fpath = resolve( dpath, f );
		data = readJSON( fpath, fopts );
		if ( data instanceof Error ) {
			console.error( data.message );
			continue;
		}
		// We assume the naming convention `XXXXXX_numpy.json` where `XXXXXX` corresponds to the library name:
		l = f.split( '_numpy.' )[ 0 ];
		if ( l === 'dask' ) {
			l += '.array';
		}
		libs.push( l );

		// We assume that the prefix convention, if present, matches the library name:
		prefix = ( l === 'pytorch' ) ? 'torch' : l;

		for ( j = 0; j < data.length; j++ ) {
			tmp = data[ j ];
			if ( tmp.numpy ) {
				if ( !hasOwnProp( ref, tmp.numpy ) ) {
					console.error( 'Unrecognized NumPy API: %s. File: %s.', tmp.numpy, f );
					continue;
				}
				r = ref[ tmp.numpy ];
				if ( !hasOwnProp( r, '__join__' ) ) {
					r.__join__ = {};
				}
				r.__join__[ l ] = replace( tmp.name, prefix+'.', '' ); // replace any library name prefixes (e.g., `torch.add` => `add`)
			}
		}
	}
	// Generate a hash table mapping each NumPy interface to its equivalent in other libraries...
	keys = objectKeys( ref ).sort();
	out = [];
	for ( i = 0; i < keys.length; i++ ) {
		k = keys[ i ];
		r = ref[ k ].__join__;
		tmp = {};
		for ( j = 0; j < libs.length; j++ ) {
			l = libs[ j ];
			if ( l === 'numpy' ) {
				tmp[ l ] = k;
			} else if ( hasOwnProp( r, l ) ) {
				tmp[ l ] = r[ l ];
			} else {
				tmp[ l ] = '';
			}
		}
		out.push( tmp );
	}
	// Save the table to file:
	fpath = resolve( __dirname, '..', 'data', 'joins', 'unified_join.json' );
	tmp = writeFile( fpath, JSON.stringify( out ) + '\n', fopts );
	if ( tmp instanceof Error ) {
		console.error( tmp.message );
		return;
	}
	// Generate a CSV file:
	fpath = resolve( __dirname, '..', 'data', 'joins', 'unified_join.csv' );
	tmp = json2csv( out );
	tmp = writeFile( fpath, tmp, fopts );
	if ( tmp instanceof Error ) {
		console.error( tmp.message );
		return;
	}
}

main();
