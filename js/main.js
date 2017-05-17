var Main = (function(Attractor, SpeedChart, PickPie) {
	"use strict";

	var topRect = Attractor.create("#plotArea"),
		sizePickerArea = SpeedChart.create(topRect, Attractor.setSpeed, 299);
	
	PickPie.create(sizePickerArea, Attractor.setPointSize);

	d3.select("#plotOverlay").on("click", function() {
		d3.select("#plotArea").classed("overlay", false);
		d3.select(this).style("display", "none");
	});
	
})(Attractor, SpeedChart, PickPie);
