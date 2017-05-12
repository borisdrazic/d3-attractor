var SpeedChart = (function() {
	"use strict";

	var animationDuration = 1000,
		t = d3.transition().duration(animationDuration),
		margin = {
			top: 10,
			right: 10,
			bottom: 10,
			left: 10
		},
		padding = {
			top: 50,
			right: 10,
			bottom: 30,
			left: 300
		},
		width,
		height,
		data = [],
		plotG,
		pointR,
		noRows,
		noColumns,
		xScale;


	function create(rect, noPoints) {
		var i, j,
			voronoi;

		width = rect.attr("width") - margin.left - margin.right;
		height = rect.attr("height") - margin.top - margin.bottom;
		noColumns = Math.floor(Math.sqrt(noPoints * (width - padding.left - padding.right) / (height - padding.top - padding.bottom)));
		noRows = Math.ceil(noPoints / noColumns);
		pointR = Math.min((width - padding.left - padding.right) / (3 * noColumns + 1), (height - padding.top - padding.bottom) / (3 * noRows + 1));
		xScale = d3.scaleLinear().domain([0, noRows * noColumns]).range([2 * pointR, noColumns * 3 * pointR - pointR]);

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
		
		voronoi = d3.voronoi()
    		.extent([[0, 0], [width - padding.left - padding.right, height - padding.top - padding.bottom ]])
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

		plotG.append("g")
      		.attr("class", "axis axis-x")
      		.attr("transform", "translate(" + padding.left + ", " + padding.top + ")")
      		.call(d3.axisTop(xScale));
      	
      	var polygon = plotG.append("g")
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
				var markPoint = d.data.column * noRows + d.data.row + 1;
				update(markPoint);
			});

		update(0);
	}

	function update(markPoint) {
		data.forEach(function(point) {
			if (point.column * noRows + point.row < markPoint) {
				point.marked = true;
			} else {
				point.marked = false;
			}
		});
		// JOIN new data with old elements
		var point = plotG.selectAll("circle.speedPoint")
				.data(data, function(d, i) { 
					return d.row + "-" + d.column; 
				});

		// UPDATE old elements present in new data
		point
			.transition(t)
			.duration(function(d, i) {
				return (d.column * noRows + d.row + 1) * animationDuration / 200;
			})
  			.style("fill", function(d, i) {
				return d.marked ? "white" : "black";
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
					return d.marked ? "white" : "black";
				});

	}

	function getPointX(d) {
		return padding.left + 2 * pointR + d.column * 3 * pointR;
	}

	function getPointY(d) {
		return padding.top + 2 * pointR + d.row * 3 * pointR;
	}

	return {
		create : create,
		update : update
	};
})();
