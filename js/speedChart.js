var SpeedChart = (function() {
	"use strict";

	var pointAnimationDelay = 20, // when animating points in chart delay between sequentila points changing state
		margin = { // Margins between plot area and SVG container. This area will be left empty.
			top: 10,
			right: 10,
			bottom: 50,
			left: 20
		},
		padding = { // Padding between plot content and margins. This area can be filled by plot axis and labels.
			top: 20,
			right: 100,
			bottom: 0,
			left: 0
		},
		colors = {
			pointActive: "#FFFFFF",
			pointInactive: "#000000"
		},
		width, // width of SVG minus margins
		height, // height of SVG minus margins
		plotWidth, // width of SVG minus margins and padding
		plotHeight, // height of SVG minus margins and padding
		plotG, // SVG G element offset by margins from SVG
		pointR, // radius of point
		noRows, // number of rows of points
		noColumns, // number of columns of points
		currentMarkPoint = 1, // currently selected point
		xScale, // scale for the X axis
		data = []; // points data
		
	/**
	 * Return x coordinate on plotG of point d.
	 */
	function getPointX(d) {
		return padding.left + 2 * pointR + d.column * 3 * pointR;
	}

	/**
	 * Return y coordinate on plotG of point d.
	 */
	function getPointY(d) {
		return padding.top + 2 * pointR + d.row * 3 * pointR;
	}

	/**
	 * Return number of point d.
	 */
	function getPointNumber(d) {
		return d.column * noRows + d.row + 1;
	}

	/**
	 * Append gradient definitions to svg.
	 */
	function appendGradient(svg) {
		var gradientBkg,
			gradientPoint;

		if (svg.select("defs").empty()) {
			svg.append("defs");
		}
		
		gradientBkg = svg.select("defs")
			.append("linearGradient")
				.attr("id", "gradient1")
				.attr("x1", "0")
				.attr("x2", "0")
				.attr("y1", "0")
				.attr("y2", "1")
			    .attr("spreadMethod", "pad");

		gradientBkg.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#FFFFFF");

		gradientBkg.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#000000");

		gradientPoint = svg.select("defs")
			.append("radialGradient")
				.attr("id", "gradient2")
				.attr("cx", "50%")
				.attr("cy", "50%")
				.attr("r", "100%");

		gradientPoint.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#FFFFFF");

		gradientPoint.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#000000");
	}

	/**
	 * Create SpeedChart.
	 * @param{d3-element} rect - SVG rect on which SpeedChart will be placed.
	 * @param{Integer} noPoints - number of points in the chart.
	 */
	function create(rect, noPoints) {
		var i, j,
			voronoi;

		appendGradient(d3.select(rect.node().parentNode));
		rect.attr("fill", "url(#gradient1)");

		// compute width/height with margins/padding
		width = rect.attr("width") - margin.left - margin.right;	
		height = rect.attr("height") - margin.top - margin.bottom;
		plotWidth = width - padding.left - padding.right;
		plotHeight = height - padding.top - padding.bottom;

		// Select nubmer of rows, columns, and point radius so that points fill the available area.
		// Number of columns to number of rows is proportional to width / height ratio.
		// Point radius is selected to fill the area with one point radius space between points (and between points and edges).
		// Extra space (when noColumns * noRows > noPoints) will be at bottom right.
		noColumns = Math.floor(Math.sqrt(noPoints * plotWidth / plotHeight));
		noRows = Math.ceil(noPoints / noColumns);
		pointR = Math.min(plotWidth / (3 * noColumns + 1), plotHeight / (3 * noRows + 1));
		// Scale maps number of points to x axis of same width as points area.
		xScale = d3.scaleLinear().domain([0, noRows * noColumns]).range([2 * pointR, noColumns * 3 * pointR - pointR]);

		// Create points data. 
		// Points with marked=true have point number smaller or equal to selected point, others have point=false.
		for(i = 0; i < noColumns; ++i) {
			for(j = 0; j < noRows; ++j) {
				if (i * noRows + j < noPoints) {
					data.push({
						row : j,
						column : i,
						marked : false
					});
				}
			}
		}
		
		// Create Voronoi triangulation on points (used for hover areas).
		voronoi = d3.voronoi()
    		.extent([[0, 0], [plotWidth, plotHeight]])
    		.x(function(d, i) {
				return getPointX(d) - padding.left;
			})
			.y(function(d, i) {
				return getPointY(d) - padding.top;
			});

		// add g with margins
		plotG = d3.select(rect.node().parentNode)
			.append("g")
			.classed("topG", true)
			.attr("transform", "translate(" + (margin.left + (rect.attr("x") ? +rect.attr("x") : 0)) + "," + (margin.top + (rect.attr("y") ? +rect.attr("y") : 0)) + ")");

		// add x axis at top of points
		plotG.append("g")
      		.attr("class", "axis axis-x")
      		.attr("transform", "translate(" + padding.left + ", " + padding.top + ")")
      		.call(d3.axisTop(xScale));

      	// add text to the right
		plotG.append("text")
    		.attr("x", noColumns * pointR * 3 + 2 * pointR)
    		.attr("y", padding.top)
    		.attr("dy", ".35em")
    		.style("font-size", plotHeight * 1.7 + "px")
    		.style("alignment-baseline", "middle")
    		.text("/s");

    	
      	
      	// Add Voronoi triangulation polygons on top of points.
      	// Set underlying point class to hover when mouse is over polygon and remove class when mouse is not over polygon.
      	// On click, set clicked point as new selected point and update points.
      	plotG.append("g")
      		.attr("transform", "translate(" + padding.left + ", " + padding.top + ")")
    		.attr("class", "polygons")
  			.selectAll("path")
  			.data(voronoi.polygons(data))
  			.enter().append("path")
    			.attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
    			.on("mouseover", function(d, i) {
	    			d3.select("#speedPoint-" + d.data.row + "-" + d.data.column)
	    				.classed("hover", true);
				})
				.on("mouseleave", function(d, i) {
	    			d3.select("#speedPoint-" + d.data.row + "-" + d.data.column)
	    				.classed("hover", false);
				})
				.on("click", function(d, i) {
					update(getPointNumber(d.data));
				});

		// Select first point and update points.
		update(1);
	}

	/**
	 * Update points.
	 * @param{Integer} markPoint - new selected point.
	 */
	function update(markPoint) {
		var t = d3.transition(),
			point;

		// mark points before markPoint (and markPoint) and unmark points after markPoint
		data.forEach(function(point) {
			point.marked = (getPointNumber(point) <= markPoint);
		});

		// cancel any ongoing animation on points
		plotG.selectAll("circle.speedPoint").interrupt();

		// JOIN new data with old elements
		point = plotG.selectAll("circle.speedPoint")
				.data(data, function(d, i) { 
					return d.row + "-" + d.column; 
				});

		// UPDATE old elements present in new data
		point
			.transition(t)
			.delay(function(d, i) {
				// Delay point change of color so that points change color one after another in order of point numbers.
				// Points will change color in direction from old selected point to new selected point.
				// Points that don't change color do not contribut to delay, first point to change color starts with no delay.
				var thisPointNumber = getPointNumber(d);
				if (markPoint > currentMarkPoint) {
					if (thisPointNumber <= currentMarkPoint) {
						return 0;
					} else {
						return (thisPointNumber - currentMarkPoint) * pointAnimationDelay;
					}
				} else {
					if (thisPointNumber >= currentMarkPoint) {
						return 0;
					} else {
						return (currentMarkPoint - thisPointNumber) * pointAnimationDelay;
					}
				}
			})
  			.style("fill", function(d, i) {
				return d.marked ? colors.pointActive : colors.pointInactive;
			});
		
		// ENTER new elements present in new data
		point.enter()
			.append("circle")
				.classed("speedPoint", true)
				.attr("id", function(d, i) {
					return "speedPoint-" + d.row + "-" + d.column;
				})
  				.attr("cx", function(d) { 
					return getPointX(d);
				})
				.attr("cy", function(d) { 
					return getPointY(d);
				})
				.attr("r", pointR)
				.style("fill", function(d, i) {
					return d.marked ? colors.pointActive : colors.pointInactive;
				});

		// update current marked point
		currentMarkPoint = markPoint;
	}

	return {
		create : create,
		update : update
	};
})();
