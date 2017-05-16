var Main = (function(Attractor, SpeedChart) {
	"use strict";

	var topRect = Attractor.create("#plotArea");
	SpeedChart.create(topRect, Attractor.setSpeed, 299);

	d3.select("#plotOverlay").on("click", function() {
		d3.select("#plotArea").classed("overlay", false);
		d3.select(this).style("display", "none");
	});
	
})(Attractor, SpeedChart);
