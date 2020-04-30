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

var debug = logger( 'pytorch' );

var PYTORCH_DOCS_INDEX_URL = 'https://pytorch.org/docs/stable/tensors.html';
var PYTORCH_DOCS_ROOT_URL = 'https://pytorch.org/docs/stable/tensors.html';


// MAIN //

/**
* Returns a promise for scraping PyTorch's API documentation for a list of public APIs (e.g., array manipulation methods, etc).
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

	debug( 'Navigating to %s.', PYTORCH_DOCS_INDEX_URL );
	await page.goto( PYTORCH_DOCS_INDEX_URL );

	debug( 'Loading page content...' );
	content = await page.content();

	debug( 'Searching for applicable APIs...' );
	$ = cheerio.load( content );
	candidates = $( '#torch\\.Tensor' ).next().children( 'dl' );

	debug( 'Found %d potential APIs. Filtering candidate list...', candidates.length );
	results = [];
	for ( i = 0; i < candidates.length; i++ ) {
		row = $( candidates.get( i ) );
		sig = row.children().first();

		tmp = sig.text();
		tmp = replace( tmp, /\r?\n/g, '' );

		j = tmp.indexOf( '(' );
		if ( j >= 0 ) {
			name = tmp.substring( 0, j );
		} else {
			name = tmp;
		}
		name = 'tensor.' + name;
		desc = sig.next().children().first().text();

		link = sig.find( 'dt a.anchorjs-link' ).attr( 'href' );
		if ( !link ) {
			debug( 'Interface does not have a documentation link. Interface: %s. Skipping...', name );
			continue;
		}
		url = PYTORCH_DOCS_ROOT_URL + link;

		sig = 'tensor.' + tmp;

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
