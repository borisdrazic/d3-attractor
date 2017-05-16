var Attractor = (function() {
	"use strict";

	/**
	 * Returns random integer between given min and max integers (inclusive).
	 */
	function randomIntFromInterval(min, max) {
    	return Math.floor(Math.random() * (max - min + 1) + min);
	}

	var plotWidth = 900,
		plotHeight = 700,
		margin = { // Margins between plot area and SVG container. This area will be left empty.
			top: 160, // NOTE: top area will be filled with speed chart, not this attractor chart
			right: 0,
			bottom: 0,
			left: 0
		},
		addRemoveArea = { // Size of squares at bottom corners used to add and remove points
			width : 70,
			height : 70
		},
		colors = {
			addPoint : "#FFFFFF", // color of fixed point that can be dragged to center to add it
			fixedPoint : "#FFFFFF", // color of fixed points in center area
			point : "#999999" // color of points in center area
		},
		pointR = {
			addPoint : 7, // radius of fixed point that can be dragged to center to add it
			fixedPoint : 7, // radius of fixed points in center area
			point : 2 // radius of points in center area
		},
		width = plotWidth - margin.left - margin.right, // width of SVG minus margins
		height = plotHeight - margin.top - margin.bottom,  // height of SVG minus margins
		fixedPointId = 0, // ID of next fixed point to add (used to generate new fixed point IDs)
		fixedPoints = [ // three starting fixed points + one fixed in add area
			{ id : fixedPointId++, x : width * 0.2, y : height * 0.8},
			{ id : fixedPointId++, x : width * 0.8, y : height * 0.8},
			{ id : fixedPointId++, x : width * 0.5, y : height * 0.2},
			createNewFixedPoint(fixedPointId++) // create fixed point in add area
		],
		intervalTime = 1000, // interval (in ms) between points appearing
		interval, // interval of points appearing
		data = [], // data about all (non-fixed) points in chart
		plotG; // main plot area

	/**
	 * Append gradient definitions to svg.
	 * These gradients are used for add (bottom left) and remove (bottom right) areas.
	 */
	function appendGradient(svg) {
		var gradientLeft,
			gradientRight;

		// add <defs> element to SVG if not already there
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

	/**
	 *	Returns new fixed point with given id and positioned in add area.
	 */
	function createNewFixedPoint(id) {
		return { 
			id : id, 
			x : addRemoveArea.width * 0.3, 
			y : height - addRemoveArea.height * 0.3 
		};
	}

	/**
	 * Returns true if given coordinates x and y are inside add area.
	 */
	function isInAddArea(x, y) {
		return x < addRemoveArea.width && y > height - addRemoveArea.height;
	}

	/**
	 * Returns true if given coordinates x and y are inside remove area.
	 */
	function isInRemoveArea(x, y) {
		return x > width - addRemoveArea.width && y > height - addRemoveArea.height;
	}

	
	/**
	 * Apply class "moving" to point that the user started dragging.
	 */
	function dragstarted(d) {
		d3.select(this)
			.classed("moving", true);
	}

	/**
	 * Update poisition of fixed point that the user is dragging.
	 * Fixed point dragging is limited to main chart area.
	 * Apply class "remove" to fixed points dragged inside remove area.
	 */
	function dragged(d, i) {
		// NOTE: At leas one fixed point needs to remain in chart.
		// Apply class remove if fixed point is inside remove area and is not the only fixed point.
		if (fixedPoints.length > 2 && isInRemoveArea(d3.event.x, d3.event.y)) {
			d3.select(this)
				.classed("remove", true);
		} else {
			d3.select(this)
				.classed("remove", false);
		}
		// Update fixed point position and ensure point does not exit main chart area.
		// (Center of fixed point can get at most pointR.fixedPoint close to edges.)
		d3.select(this)
			.attr("cx", d.x = Math.max(pointR.fixedPoint, Math.min(width - pointR.fixedPoint, d3.event.x)))
			.attr("cy", d.y = Math.max(pointR.fixedPoint, Math.min(height - pointR.fixedPoint, d3.event.y)));
	}

	/**
	 * Remove class "moving" from fixed point the user stopped dragging.
	 * If fixed point ended in remove area (and is not the only fixed point) remove this fixed point.
	 * If fixed point started in add area and ended outside of it add this fixed point.
	 */
	function dragended(d, i) {
		// If this point is fixed point that was in add area when drag started, add this fixed point
		// to chart area and generate new fixed point in add area.
		if (d.id === fixedPointId - 1 && !isInAddArea(d3.event.x, d3.event.y)) {
			fixedPoints.push(createNewFixedPoint(fixedPointId++));
			update(data);
		}

		// Remove class "moving" from this fixed point.
		d3.select(this)
			.classed("moving", false);

		// If this fixed point is in the remove area and not the only fixed point remove this fixed point.
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
	 * Add next (non-fixed) point to data and update dispaly.
	 * Next point position is at halfway point between last (non-fixed) point and a randomly selected fixed point.
	 */
	function addPoint() {
		var fixedIndex = randomIntFromInterval(0, fixedPoints.length - 2), // pick random fixed point (excluding the one in add area)
			selectedFixed = fixedPoints[fixedIndex],
			lastPoint = data[data.length - 1],
			newPoint = {};

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

	/**
	 * Set speed of new points appearing.
	 * @Input{Integer} pps - points per second.
	 */
	function setSpeed(pps) {
		intervalTime = 1000 / pps;
		if (typeof interval !== "undefined") {
			clearInterval(interval);
			interval = setInterval(addPoint, intervalTime);
		}
	}

	/**
	 * Creates attractor chart.
	 * Returns rectangle at the top.
	 */
	function create(selector) {
		var topRect;

		// Add plot area background and setup click handling.
		d3.select(selector)
			.append("svg")
			.attr("width", plotWidth)
			.attr("height", plotHeight)
			.append("rect")
				.attr("x", margin.left)
				.attr("y", margin.top)
				.attr("width", width)
				.attr("height", height)
				.on("click", function() { // add starting point on click
					// Create starting point at place where user clicked.
					var startingPoint = {
						x : d3.mouse(this)[0] - margin.left,
						y: d3.mouse(this)[1] - margin.top
					};
					// If this is firs time user created starting point, setup point generating by calling setInterval.
					// Otherwise, clear old points, create this new starting point, and continue using existing setInterval.
					if (data.length === 0) {
						data = [startingPoint];
						update(data);
						interval = setInterval(addPoint, intervalTime);
					} else {
						data = [startingPoint];
						update(data);
					}
				});

		// Add SVG gradient definitions
		appendGradient(d3.select(selector).select("svg"));

		// Add top area above plot area (speed chart will go here).
		topRect = d3.select(selector)
			.select("svg")
			.append("rect")
				.classed("topRect", true)
				.attr("x", margin.left)
				.attr("width", width)
				.attr("height", margin.top);

		// Add main plot area g.
		plotG = d3.select(selector)
			.select("svg")
			.append("g")
			.classed("mainG", true)
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// Add add area to bottom left.
		plotG.append("rect")
			.attr("x", 0)
			.attr("y", height - addRemoveArea.height)
			.attr("width", addRemoveArea.width)
			.attr("height", addRemoveArea.height)
			.attr("fill", "url(#gradientLeft)");
		
		// Add remove area to bottom right.
		plotG.append("rect")
			.attr("x", width - addRemoveArea.width)
			.attr("y", height - addRemoveArea.height)
			.attr("width", addRemoveArea.width)
			.attr("height", addRemoveArea.height)
			.classed("removeArea", true)
			.attr("fill", "url(#gradientRight)");

		// Draw fixed points.
		update([]);

		// Return the top rectangle.
		return topRect;
    }

    /**
     * Update fixed and non-fixed points.
     * @Input[Array] data - array of non-fixed point objects.
     */
    function update(data) {
		// JOIN new data with old elements
		var point = plotG.selectAll("circle.point")
				.data(data, function(d, i) { 
					return i; 
				});
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
				return d.id === fixedPointId - 1 ? pointR.addPoint : pointR.fixedPoint;
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
			.attr("r", pointR.point)
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
				return d.id === fixedPointId - 1 ? pointR.addPoint : pointR.fixedPoint;
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

	return {
		create : create,
		setSpeed : setSpeed
	};
})();
