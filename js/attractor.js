var Attractor = (function() {
	"use strict";

	var animationDuration = 1000,
		t = d3.transition().duration(animationDuration),
		plotWidth = 500 * 2,
		plotHeight = 400 * 2,
		margin = {
			top: 150,
			right: 10,
			bottom: 10,
			left: 10
		},
		addRemoveArea = {
			width : 70,
			height : 70
		},
		colors = {
			addPoint : "#FFFFFF",
			fixedPoint : "#FFFFFF",
			point : "#999999"
		},
		addPointR = 7,
		pointR = 3,
		fixedPointR = 7,
		width = plotWidth - margin.left - margin.right,
		height = plotHeight - margin.top - margin.bottom,
		fixedPointId = 0,
		fixedPoints = [
			{ id : fixedPointId++, x : width * 0.2, y : height * 0.8},
			{ id : fixedPointId++, x : width * 0.8, y : height * 0.8},
			{ id : fixedPointId++, x : width * 0.5, y : height * 0.2},
			createNewFixedPoint(fixedPointId++)
		],
		data = [],
		spareFixedPoint = {
			x : 50,
			y : margin.top / 2
		},
		plotG;

	function createNewFixedPoint(id) {
		return { 
			id : id, 
			x : addRemoveArea.width * 0.3, 
			y : height - addRemoveArea.height * 0.3 
		};
	}

	function isInRemoveArea(x, y) {
		return x > width - addRemoveArea.width && y > height - addRemoveArea.height;
	}

	function isInAddArea(x, y) {
		return x < addRemoveArea.width && y > height - addRemoveArea.height;
	}

	function randomIntFromInterval(min,max) {
    	return Math.floor(Math.random() * (max - min + 1) + min);
	}

	function dragstarted(d) {
		d3.select(this)
			.classed("moving", true);
	}

	function dragged(d, i) {
		if (fixedPoints.length > 2 && isInRemoveArea(d3.event.x, d3.event.y)) {
			d3.select(this)
				.classed("remove", true);
		} else {
			d3.select(this)
				.classed("remove", false);
		}
		d3.select(this)
			.attr("cx", d.x = Math.max(fixedPointR, Math.min(width - fixedPointR, d3.event.x)))
			.attr("cy", d.y = Math.max(fixedPointR, Math.min(height - fixedPointR, d3.event.y)));
	}

	function dragended(d, i) {
		if (d.id === fixedPointId - 1 && !isInAddArea(d3.event.x, d3.event.y)) {
			fixedPoints.push(createNewFixedPoint(fixedPointId++));
			update(data);
		}
		
		d3.select(this)
			.classed("moving", false);
		if (fixedPoints.length > 2 && isInRemoveArea(d3.event.x, d3.event.y)) {
			var index,
				selectedIndex;
			for(index = 0; index < fixedPoints.length; ++index) {
				if (fixedPoints[index].id === d.id) {
					selectedIndex = index;
				}
			}
			fixedPoints.splice(selectedIndex, 1);
			update(data);
		}
	}

	/**
	 * Append gradient definitions to svg.
	 */
	function appendGradient(svg) {
		var gradientLeft,
			gradientRight;

		if (svg.select("defs").empty()) {
			svg.append("defs");
		}

		gradientLeft = svg.select("defs")
			.append("radialGradient")
				.attr("id", "gradientLeft")
				.attr("cx", "0%")
				.attr("cy", "100%")
				.attr("r", "100%");

		gradientLeft.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#00FF00");

		gradientLeft.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#000000");

		gradientRight = svg.select("defs")
			.append("radialGradient")
				.attr("id", "gradientRight")
				.attr("cx", "100%")
				.attr("cy", "100%")
				.attr("r", "100%");

		gradientRight.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#FF0000");

		gradientRight.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#000000");
	}

	function create(selector) {
		var removeAreaG,
			topRect;



		// add plot area background
		d3.select(selector)
			.append("svg")
			.attr("width", plotWidth)
			.attr("height", plotHeight)
			.append("rect")
				.attr("x", margin.left)
				.attr("y", margin.top)
				.attr("width", width)
				.attr("height", height)
				// add starting point on click
				.on("click", function() {
					var startingPoint = {
						x : d3.mouse(this)[0] - margin.left,
						y: d3.mouse(this)[1] - margin.top
					};
					if (data.length === 0) {
						data = [startingPoint];
						update(data);
						setInterval(addPoint, 500);
					} else {
						data = [startingPoint];
						update(data);
					}
				});

		appendGradient(d3.select(selector).select("svg"));

		// add top area above plot area
		topRect = d3.select(selector)
			.select("svg")
			.append("rect")
				.classed("topRect", true)
				.attr("x", margin.left)
				.attr("width", width)
				.attr("height", margin.top);

		// add plot area g
		plotG = d3.select(selector)
			.select("svg")
			.append("g")
			.classed("mainG", true)
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// add add area
		plotG.append("rect")
			.attr("x", 0)
			.attr("y", height - addRemoveArea.height)
			.attr("width", addRemoveArea.width)
			.attr("height", addRemoveArea.height)
			.attr("fill", "url(#gradientLeft)");
		
		// add remove area
		plotG.append("rect")
			.attr("x", width - addRemoveArea.width)
			.attr("y", height - addRemoveArea.height)
			.attr("width", addRemoveArea.width)
			.attr("height", addRemoveArea.height)
			.classed("removeArea", true)
			.attr("fill", "url(#gradientRight)");

		update([]);
		return topRect;
    }

    function update(data) {
		// JOIN new data with old elements
		var point = plotG.selectAll("circle.point")
				.data(data, function(d, i) { return i; });
		var fixedPoint = plotG.selectAll("circle.fixedPoint")
				.data(fixedPoints, function(d, i) { 
					return d.id; 
				});

		// EXIT old elements not present in new data
		point.exit()
			.remove();
		fixedPoint.exit()
			.remove();

		// UPDATE old elements present in new data
		point
  			.attr("cx", function(d) { 
				return d.x; 
			})
			.attr("cy", function(d) { 
				return d.y; 
			});
		fixedPoint
			.attr("fill", function(d, i) {
				return d.id === fixedPointId - 1 ? colors.addPoint : colors.fixedPoint;
			})
			.attr("r", function(d, i) {
				return d.id === fixedPointId - 1 ? addPointR : fixedPointR;
			});

		// ENTER new elements present in new data
		point.enter()
			.append("circle")
			.classed("point", true)
  			.attr("cx", function(d) { 
				return d.x; 
			})
			.attr("cy", function(d) { 
				return d.y; 
			})
			.attr("r", pointR)
			.attr("fill", colors.point);
		fixedPoint.enter()
			.append("circle")
			.classed("fixedPoint", true)
  			.attr("cx", function(d) { 
				return d.x; 
			})
			.attr("cy", function(d) { 
				return d.y; 
			})
			.attr("r", function(d, i) {
				return d.id === fixedPointId - 1 ? addPointR : fixedPointR;
			})
			.attr("fill", function(d, i) {
				return d.id === fixedPointId - 1 ? colors.addPoint : colors.fixedPoint;
			})
			.call(d3.drag()
				.container(document.querySelector("svg"))
        		.on("start", dragstarted)
        		.on("drag", dragged)
        		.on("end", dragended));
	}

	function addPoint() {
		var fixedIndex = randomIntFromInterval(0, fixedPoints.length - 2),
			selectedFixed = fixedPoints[fixedIndex],
			lastPoint = data[data.length - 1],
			newPoint = {
				fromFixedIndex : fixedIndex
			};

		if (lastPoint.x >= selectedFixed.x) {
			newPoint.x = selectedFixed.x + (lastPoint.x - selectedFixed.x) / 2;
		} else {
			newPoint.x = lastPoint.x + (selectedFixed.x - lastPoint.x) / 2;
		}
		if (lastPoint.y >= selectedFixed.y) {
			newPoint.y = selectedFixed.y + (lastPoint.y - selectedFixed.y) / 2;
		} else {
			newPoint.y = lastPoint.y + (selectedFixed.y - lastPoint.y) / 2;
		}
		data.push(newPoint);    
		update(data);
	}

	return {
		create : create
	};
})();
