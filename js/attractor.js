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
			width : 40,
			height : 40
		},
		fixedPointRadius = 5,
		width = plotWidth - margin.left - margin.right,
		height = plotHeight - margin.top - margin.bottom,
		fixedPointId = 0,
		fixedPoints = [
			{ id : fixedPointId++, x : width * 0.2, y : height * 0.8},
			{ id : fixedPointId++, x : width * 0.8, y : height * 0.8},
			{ id : fixedPointId++, x : width * 0.5, y : height * 0.2},
			{ id : fixedPointId++, x : addRemoveArea.width / 2, y : height - addRemoveArea.height / 2}
		],
		data = [],
		spareFixedPoint = {
			x : 50,
			y : margin.top / 2
		},
		plotG;

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
			.attr("cx", d.x = Math.max(fixedPointRadius, Math.min(width - fixedPointRadius, d3.event.x)))
			.attr("cy", d.y = Math.max(fixedPointRadius, Math.min(height - fixedPointRadius, d3.event.y)));
	}

	function dragended(d, i) {
		if (d.id === fixedPointId - 1 && !isInAddArea(d3.event.x, d3.event.y)) {
			fixedPoints.push({ id : fixedPointId++, x : addRemoveArea.width / 2, y : height - addRemoveArea.height / 2});
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
			.attr("height", addRemoveArea.height);
		plotG.append("path")
			.attr("stroke", "green")
			.attr("d", "M0 " + (height - addRemoveArea.height) 
				+ " L" + addRemoveArea.width + " " + (height - addRemoveArea.height)
				+ " L" + addRemoveArea.width + " " + height);
				

		// add remove area
		plotG.append("rect")
			.attr("x", width - addRemoveArea.width)
			.attr("y", height - addRemoveArea.height)
			.attr("width", addRemoveArea.width)
			.attr("height", addRemoveArea.height)
			.classed("removeArea", true);
		plotG.append("path")
			.attr("stroke", "red")
			.attr("d", "M" + width + " " + (height - addRemoveArea.height) 
				+ " L" + (width - addRemoveArea.width) + " " + (height - addRemoveArea.height)
				+ " L" + (width - addRemoveArea.width) + " " + height);
		removeAreaG = plotG.append("g")
			.attr("transform", "translate(" + (width - addRemoveArea.width) + "," + (height - addRemoveArea.height) + ")");
		removeAreaG.append("line")
				.attr("fill", "red")
				.attr("stroke", "red")
				.attr("stroke-width", 5)
				.attr("x1", addRemoveArea.width * 0.3)
				.attr("x2", addRemoveArea.width * 0.7)
				.attr("y1", addRemoveArea.height * 0.3)
				.attr("y2", addRemoveArea.height * 0.7);
		removeAreaG.append("line")
				.attr("fill", "red")
				.attr("stroke", "red")
				.attr("stroke-width", 5)
				.attr("x1", addRemoveArea.width * 0.7)
				.attr("x2", addRemoveArea.width * 0.3)
				.attr("y1", addRemoveArea.height * 0.3)
				.attr("y2", addRemoveArea.height * 0.7);

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
				return d.id === fixedPointId - 1 ? "green" : "yellow";
			})
			.attr("r", function(d, i) {
				return d.id === fixedPointId - 1 ? Math.min(addRemoveArea.width, addRemoveArea.height) / 4 : fixedPointRadius;
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
			.attr("r", 2)
			.attr("fill", "white");
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
				return d.id === fixedPointId - 1 ? Math.min(addRemoveArea.width, addRemoveArea.height) / 4 : fixedPointRadius;
			})
			.attr("fill", function(d, i) {
				return d.id === fixedPointId - 1 ? "green" : "yellow";
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
