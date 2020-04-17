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

// FUNCTIONS //

/**
* Comparison function.
*
* @private
* @param {Object} a - first value
* @param {Object} b - second value
* @returns {number} sort indicator
*/
function comparison( a, b ) {
	if ( a.name < b.name ) {
		return -1;
	}
	if ( a.name === b.name ) {
		return 0;
	}
	return 1;
}


// MAIN //

/**
* Sorts a results object based on the `name` field.
*
* @private
* @param {Array<Object>} arr - array to sort
* @returns {Array<Object>} sorted array
*/
function sort( arr ) {
	arr.sort( comparison );
	return arr;
}


// EXPORTS //

module.exports = sort;
