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

var debug = logger( 'tensorflow' );

var TENSORFLOW_DOCS_INDEX_URL = 'https://www.tensorflow.org/api_docs/python';

var RE_API_INCLUDE = /^tf\./;
var RE_API_EXCLUDE = /^tf\.(?:[A-Z]|audio|autodiff|autograph|compat|config|data|debugging|distribute|dtypes|errors|estimator|experimental|feature_column|graph_util|image|io|keras|lite|lookup|losses|metrics|mixed_precision|mlir|nest|nn|optimizers|profiler|quantization|queue|ragged|raw_ops|saved_model|summary|sysconfig|test|tpu|train|types|version|xla)/;


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
* Returns a promise for scraping Tensorflow's API documentation for a list of public APIs (e.g., array creation methods, etc).
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
	var browser;
	var content;
	var results;
	var links;
	var page;
	var opts;
	var name;
	var desc;
	var ctx;
	var tmp;
	var url;
	var sig;
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

	debug( 'Navigating to %s.', TENSORFLOW_DOCS_INDEX_URL );
	await page.goto( TENSORFLOW_DOCS_INDEX_URL );

	debug( 'Loading page content...' );
	content = await page.content();

	debug( 'Searching for applicable APIs...' );
	$ = cheerio.load( content );
	links = $( '#primary_symbols_2' ).next( 'ul' ).find( 'li a' );

	debug( 'Found %d potential APIs. Filtering initial candidate list...', links.length );
	tmp = filterLinks( $, links );
	debug( 'Results: %d candidates.', tmp.length );

	results = [];
	for ( i = 0; i < tmp.length; i++ ) {
		url = tmp[ i ];
		debug( '(%d of %d) Navigating to %s.', i+1, tmp.length, url );
		await page.goto( url );

		debug( 'Loading page content...' );
		content = await page.content();

		debug( 'Searching for interface definition...' );
		$ = cheerio.load( content );
		sig = $( 'h1.devsite-page-title' );
		if ( sig.length === 0 ) {
			debug( 'Unable to find interface definition. Skipping...' );
			continue;
		}
		if ( /Module:/.test( sig.text() ) ) {
			debug( 'Found a module definition. Skipping...' );
			continue;
		}
		desc = sig.parent().next().next().find( '.devsite-table-wrapper' ).next( 'p' ).get( 0 );
		desc = $( desc ).text();
		desc = replace( desc, /\r?\n/g, ' ' );
		if ( !desc ) {
			debug( 'Interface definition does not have a description. Skipping...' );
			continue;
		}
		sig = sig.text();
		name = sig;

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
