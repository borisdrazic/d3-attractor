var PickPie = (function() {
	"use strict";

	var animationDuration = 1000,
		innerRadius = 10, // inner radius of pie chart
		outerRadius = 70, // maximum outer radius of pie chart
		colors = ["#01b893", "#01a357", "#03a6b8", "#026fb8", "#0237a1"], // segment colors (left to right)
		scale = d3.scaleLinear()
			.domain([0, 1])
			.range([innerRadius, outerRadius]),
		topPieGenerator = d3.pie() // top pie is top half going from left to right
			.startAngle(-0.5 * Math.PI)
			.endAngle(0.5 * Math.PI)
			.value(function(d) {
				return d.width;
			}),
		bottomPieGenerator = d3.pie() // bottom pie is bottom half, but for eneter/exit animation we need full circle
			.startAngle(0)
			.endAngle(2 * Math.PI)
			.value(function(d) {
				return d.width;
			}),
		topArcGenerator = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(function(d) {
				return scale(d.data.height);
			}),
		bottomArcGenerator = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(function(d) {
				return scale(d.data.height);
			}),
		topG, // SVG G element containing top half of the chart
		bottomG, // SVG G element containing bottom half of the chart
		topArcData, // data for segments in top half of pie chart
		bottomArcData, // data for segments in bottom half of pie chart
		topData = [ // data for segments in top half, all segement have same width, height is from 0 to 1 and will be scaled to pie chart radius
			{ width: 1, height: 0.2 },
			{ width: 1, height: 0.4 },
			{ width: 1, height: 0.6 },
			{ width: 1, height: 0.8 },
			{ width: 1, height: 1 },
		],
		bottomData = [ // data for segment displayed in bottom half
			{ id : 2, width: 1, height: 0.6 }
		],
		setPointSizeFunciton; // function to set point size in attractor

	/**
	 * Tween bottom segment entering.
	 * This segment comes out of selected segment in top half, and moves clockwise to occupy entire bottom half.
	 */
	function bottomArcTweenEnter() {
		return function(d) {
			var interpolateEnd = d3.interpolate(topArcData[d.data.id].endAngle, 1.5 * Math.PI),
				interpolateStart = d3.interpolate(topArcData[d.data.id].startAngle, 0.5 * Math.PI);
			return function(t) {
				d.startAngle = interpolateStart(t);
				d.endAngle = interpolateEnd(t);
				return bottomArcGenerator(d);
			};
		};
	}

	/**
	 * Tween bottom segment exiting.
	 * This segment leaves bottom half clockwise and collapses to top segment it represents.
	 */
	function bottomArcTweenExit() {
		return function(d) {
			var interpolateStart = d3.interpolate(0.5 * Math.PI, 2 * Math.PI + topArcData[d.data.id].startAngle),
				interpolateEnd = d3.interpolate(1.5 * Math.PI, 2 * Math.PI + topArcData[d.data.id].endAngle);
			return function(t) {
				d.startAngle = interpolateStart(t);
				d.endAngle = interpolateEnd(t);
				return bottomArcGenerator(d);
			};
		};
	}

	function create(sizePickerArea, setPointSize) {
		setPointSizeFunciton = setPointSize;

		topG = sizePickerArea
			.append("g")
			.classed("top", true);
				
		bottomG = sizePickerArea
			.append("g")
			.classed("bottom", true);

		// add line between top and bottom pie
		sizePickerArea
			.append("line")
			.attr("x1", -outerRadius - 2)
			.attr("x2", outerRadius + 2)
			.attr("y1", 0)
			.attr("y2", 0)
			.style("stroke", "#5b7476");

		update();
	}

	function update() {
		var topSegment,
			bottomSegment;

		// generate new arc data from segment data
		topArcData = topPieGenerator(topData);
		bottomArcData = bottomPieGenerator(bottomData);

		// JOIN new data with old elements
		topSegment = topG.selectAll('path.segment')
			.data(topArcData);
		bottomSegment = bottomG.selectAll('path.segment')
			.data(bottomArcData, function(d) {
				return d.data.id;
			});

		// EXIT old elements not present in new data
		bottomSegment.exit()
			.transition()
				.duration(animationDuration)
				.attrTween('d', bottomArcTweenExit())
				.remove();

		// ENTER new elements present in new data
		topSegment.enter()
			.append('path')
				.classed("segment", true)
				.style("fill", function(d, i) {
					return colors[i];
				})
				.style("stroke", function(d, i) {
					return colors[i];
				})
				.attr('d', topArcGenerator)
				.on("click", function(d, i) { // set bottom segment to this segment			
					bottomData = [];
					bottomData.push({
						id : i,
						width: 1,
						height: d.data.height
					});
					setPointSizeFunciton(i + 1);
					update();
				});
		bottomSegment.enter()
			.append('path')
				.classed("segment", true)
				.style("fill", function(d, i) {
					return colors[d.data.id];
				})
				.style("stroke", function(d, i) {
					return colors[d.data.id];
				})
				.transition()
				.duration(animationDuration)
				.attrTween('d', bottomArcTweenEnter());
	}

	return {
		create : create
	};
})();
