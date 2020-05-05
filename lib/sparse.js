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

var debug = logger( 'sparse' );

var SPARSE_DOCS_INDEX_URL = 'https://sparse.pydata.org/en/latest/generated/sparse.html';
var SPARSE_DOCS_ROOT_URL = 'https://jax.readthedocs.io/en/latest/generated/';


// MAIN //

/**
* Returns a promise for scraping Sparse's API documentation for a list of public APIs (e.g., array manipulation methods, etc).
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
	var candidates;
	var browser;
	var content;
	var results;
	var page;
	var opts;
	var name;
	var desc;
	var link;
	var ctx;
	var tmp;
	var url;
	var sig;
	var row;
	var $;
	var i;
	var j;

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

	debug( 'Navigating to %s.', SPARSE_DOCS_INDEX_URL );
	await page.goto( SPARSE_DOCS_INDEX_URL );

	debug( 'Loading page content...' );
	content = await page.content();

	debug( 'Searching for applicable APIs...' );
	$ = cheerio.load( content );
	candidates = $( '.longtable.docutils tr' );

	debug( 'Found %d potential APIs. Filtering candidate list...', candidates.length );
	results = [];
	for ( i = 0; i < candidates.length; i++ ) {
		row = $( candidates.get( i ) );
		sig = row.children().first();
		tmp = sig.text();
		j = tmp.indexOf( '(' );
		if ( j >= 0 ) {
			name = tmp.substring( 0, j );
		} else {
			name = tmp;
		}
		desc = sig.next().text();

		link = sig.find( 'a' ).attr( 'href' );
		if ( !link ) {
			debug( 'Interface does not have a documentation link. Interface: %s. Skipping...', name );
			continue;
		}
		url = SPARSE_DOCS_ROOT_URL + link;

		sig = sig.text();

		debug( 'Found an interface definition.' );
		debug( 'Name: %s', name );
		debug( 'Signature: %s', sig );
		debug( 'Description: %s', desc );
		results.push({
			'name': name,
			'description': desc,
			'signature': sig,
			'url': url
		});
	}
	debug( 'Sorting results...' );
	results = sort( results );

	debug( 'Finished.' );

	debug( 'Closing browser...' );
	await browser.close();
	debug( 'Browser closed.' );

	debug( 'Total APIs: %d', results.length );

	return results;
}


// EXPORTS //

module.exports = scrape;
