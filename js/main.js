var Main = (function(Attractor, SpeedChart) {
	"use strict";
	var topRect = Attractor.create("#plotArea");
	SpeedChart.create(topRect, Attractor.setSpeed, 299);
	
})(Attractor, SpeedChart);
