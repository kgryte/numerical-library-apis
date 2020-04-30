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

var playwright = require( 'playwright' );
var cheerio = require( 'cheerio' );
var logger = require( 'debug' );
var replace = require( '@stdlib/string/replace' );
var sort = require( './sort.js' );


// VARIABLES //

var debug = logger( 'cupy' );

var CUPY_DOCS_INDEX_URL = 'https://docs-cupy.chainer.org/en/stable/genindex.html';
var CUPY_DOCS_ROOT_URL = 'https://docs-cupy.chainer.org/en/stable/';

var RE_API_INCLUDE = /\(in module cupy.*\)/;
var RE_API_EXCLUDE = /cupy\.(?:cuda|testing)/;
var RE_UFUNC = / ?= ?<ufunc.*>/;


// FUNCTIONS //

/**
* Filters a list of link elements to find API candidates.
*
* @private
* @param {Object} $ - Cheerio selector
* @param {Array} links - list of elements
* @returns {Array<string>} list of candidate URLs
*/
function filterLinks( $, links ) {
	var out = [];
	links.each( onLink );
	return out;

	function onLink( i, el ) {
		var el = $( el );
		var txt = el.text();
		if ( RE_API_INCLUDE.test( txt ) && !RE_API_EXCLUDE.test( txt ) ) {
			out.push( el.attr( 'href' ) );
		}
	}
}


// MAIN //

/**
* Returns a promise for scraping CuPy's API documentation for a list of public APIs (e.g., array creation methods, etc).
*
* @private
* @param {Object} [options] - options
* @param {string} [options.browser='chromium'] - browser engine
* @returns {Object} results
*
* @example
* var results = await scrape();
*/
async function scrape( options ) {
	var failures;
	var browser;
	var content;
	var results;
	var links;
	var opts;
	var page;
	var ctx;
	var idx;
	var $;

	opts = {
		'browser': 'chromium'
	};
	if ( arguments.length ) {
		opts.browser = options.browser;
	}
	debug( 'Options: %s', JSON.stringify( opts ) );

	debug( 'Launching %s browser...', opts.browser );
	browser = await playwright[ opts.browser ].launch();

	debug( 'Creating a new browser context...' );
	ctx = await browser.newContext();

	debug( 'Creating a new browser page...' );
	page = await ctx.newPage();

	debug( 'Navigating to %s.', CUPY_DOCS_INDEX_URL );
	await page.goto( CUPY_DOCS_INDEX_URL );

	debug( 'Loading page content...' );
	content = await page.content();

	debug( 'Searching for applicable APIs...' );
	$ = cheerio.load( content );
	links = $( '.indextable li a' );

	debug( 'Found %d potential APIs. Filtering initial candidate list...', links.length );
	links = filterLinks( $, links );
	debug( 'Results: %d candidates.', links.length );

	results = [];
	failures = [];
	idx = -1;
	await next();

	debug( 'Sorting results...' );
	results = sort( results );

	debug( 'Finished.' );
	debug( 'Number of failures: %d', failures.length );
	debug( 'Failures: %s', JSON.stringify( failures ) );

	debug( 'Closing browser...' );
	await browser.close();
	debug( 'Browser closed.' );

	debug( 'Total APIs: %d', results.length );

	return results;

	async function next() {
		var extlink;
		var name;
		var desc;
		var url;
		var sig;
		var ref;
		var txt;
		var dd;
		var el;
		var j;
		var n;
		var t;

		idx += 1;

		url = CUPY_DOCS_ROOT_URL + links[ idx ];
		debug( '(%d of %d) Navigating to %s.', idx+1, links.length, url );
		try {
			await page.goto( url );
		} catch ( err ) {
			debug( 'Failed to navigate to %s. Error: %s', url, err.message );
			failures.push({
				'error': err.message,
				'url': url
			});
			return await done();
		}

		debug( 'Loading page content...' );
		content = await page.content();

		debug( 'Searching for interface definition...' );
		$ = cheerio.load( content );
		sig = $( 'dl.data dt' );
		if ( sig.length === 0 ) {
			sig = $( 'dl.function dt' );
		}
		if ( sig.length === 0 ) {
			debug( 'Unable to find interface definition. Skipping...' );
			return await done();
		}
		dd = sig.next( 'dd' );
		desc = dd.children().first().text();
		desc = replace( desc, /\r?\n/g, ' ' );
		if ( !desc ) {
			debug( 'Interface definition does not have a description. Skipping...' );
			return await done();
		}
		sig = sig.text().split( '¶' )[ 0 ].split( '[source]' )[ 0 ];
		if ( !sig ) {
			debug( 'Unable to find interface definition. Skipping...' );
			return await done();
		}
		j = sig.indexOf( '(' );
		if ( j === -1 ) {
			if ( !RE_UFUNC.test( sig ) ) {
				debug( 'Interface definition is not a function. Interface: %s. Skipping...', sig );
				return await done();
			}
			j = sig.length;
		}
		name = sig.substring( 0, j );
		if ( /^\r?\n/.test( name[ 0 ] ) ) {
			sig = sig.substring( 1 );
			name = name.substring( 1 );
		}
		debug( 'Found an interface definition.' );
		debug( 'Name: %s', name );
		debug( 'Signature: %s', sig );
		debug( 'Description: %s', desc );

		debug( 'Searching for external references...' );
		extlink = dd.find( 'div.seealso a.reference.external' );
		debug( 'Found %d external reference(s).', extlink.length );

		ref = {
			'name': '',
			'url': ''
		};
		for ( j = 0; j < extlink.length; j++ ) {
			el = $( extlink.get( j ) );
			if ( /\(in NumPy.*\)/.test( el.attr( 'title' ) ) ) {
				txt = el.text();
				t = txt.split( '.' );
				t = t[ t.length-1 ];
				t = replace( t, /[^a-zA-Z0-9]/g, '' );

				n = name.split( ' ' )[ 0 ].split( '.' ); // e.g., cupy.add = <ufunc 'cupy_add'>
				n = n[ n.length-1 ];
				n = replace( n, /[^a-zA-Z0-9]/g, '' );

				// Require that the CuPy name match the NumPy name...
				if ( t === n ) {
					ref.name = txt;
					ref.url = el.attr( 'href' );
					debug( 'Found a NumPy reference: %s', ref.name );
					break;
				}
			}
		}
		results.push({
			'name': name,
			'description': desc,
			'signature': sig,
			'url': url,
			'numpy': ref.name,
			'numpy_url': ref.url
		});

		await done();
	}

	async function done() {
		if ( idx < links.length-1 ) {
			await next();
		}
	}
}


// EXPORTS //

module.exports = scrape;
