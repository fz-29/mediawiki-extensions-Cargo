/**
 * @author Yaron Koren
 */

( function( $, mw, cargo ) {
	'use strict';

	/**
	 * Class constructor
	 */
	cargo.recreateData = function() {};

	var recreateData = new cargo.recreateData();

	var dataDiv = $("div#recreateDataData");
	var apiURL = dataDiv.attr("apiurl");
	var cargoScriptPath = dataDiv.attr("cargoscriptpath");
	var tableName = dataDiv.attr("tablename");
	var isDeclared = dataDiv.attr("isdeclared");
	var viewTableURL = dataDiv.attr("viewtableurl");
	var templateData = jQuery.parseJSON( dataDiv.html() );

	var numTotalPages = 0;
	var numTotalPagesHandled = 0;

	for ( var i = 0; i < templateData.length; i++ ) {
		numTotalPages += parseInt( templateData[i].numPages );
	}

	recreateData.replaceForm = function() {
		$("#recreateDataCanvas").html( "<div id=\"recreateTableProgress\"></div>" );
		$("#recreateDataCanvas").append( "<div id=\"recreateDataProgress\"></div>" );
	}

	/**
	 * Recursive function that uses Ajax to populate a Cargo DB table with
	 * the data for one or more templates.
	 */
	recreateData.createJobs = function( templateNum, numPagesHandled, replaceOldRows ) {
		var curTemplate = templateData[templateNum];
		var progressImage = "<img src=\"" + cargoScriptPath + "/skins/loading.gif\" />";
		if ( numTotalPages > 1000 ) {
			var remainingPixels = 100 * numTotalPagesHandled / numTotalPages;
			progressImage = "<progress value=\"" + remainingPixels + "\" max=\"100\"></progress>";
		}
		$("#recreateDataProgress").html( "<p>" + progressImage + "</p>" );
		var queryStringData = {
			action: "cargorecreatedata",
			table: tableName,
			template: curTemplate.name,
			offset: numPagesHandled
		};
		if ( replaceOldRows ) {
			queryStringData.replaceOldRows = true;
		}
		$.get(
			apiURL,
			queryStringData
		)
		.done(function( msg ) {
			var newNumPagesHandled = Math.min( numPagesHandled + 500, curTemplate.numPages );
			numTotalPagesHandled += newNumPagesHandled - numPagesHandled;
			if ( newNumPagesHandled < curTemplate.numPages ) {
				recreateData.createJobs( templateNum, newNumPagesHandled, replaceOldRows );
			} else {
				if ( templateNum + 1 < templateData.length ) {
					recreateData.createJobs( templateNum + 1, 0, replaceOldRows );
				} else {
					// We're done.
					$("#recreateDataProgress").html( "<p>" + mw.msg( 'cargo-recreatedata-success' ) + "</p><p><a href=\"" + viewTableURL + "\">" + mw.msg( 'cargo-cargotables-viewtablelink' ) + "</a>.</p>" );
				}
			}
		});
	}

	jQuery( "#cargoSubmit" ).click( function() {
		recreateData.replaceForm();

		if ( isDeclared ) {
			$("#recreateTableProgress").html( "<img src=\"" + cargoScriptPath + "/skins/loading.gif\" />" );
			$.get(
				apiURL, {
					action: "cargorecreatetables",
					template: templateData[0].name
				}
			)
			.done(function( msg ) {
				$("#recreateTableProgress").html( "<p>" + mw.msg( 'cargo-recreatedata-tablecreated', tableName ) + "</p>" );
				recreateData.createJobs( 0, 0, false );
			});
		} else {
			recreateData.createJobs( 0, 0, true );
		}
	});

	// This is not really needed at the moment, since no other JS code
	// is calling this code.
	recreateData.prototype = recreateData;

} )( jQuery, mediaWiki, cargo );
