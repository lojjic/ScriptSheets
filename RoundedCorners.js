/*
**  RoundedCorners script by Jason Johnston (jj@lojjic.net)
**  Created August 2003.  Use freely, but give me credit.
**
**  This script adds corners to a specified element.  The
**  corners can be styled with CSS to provide rounded corners.
*/

function RoundedCorners(elt) {
	this.element = elt;
	this.create();
}
RoundedCorners.prototype = {
	create : function() {
		var elt = this.element;
		this.corners = [];
		
		var eltPos = getComputedStyle(elt, null).getPropertyValue("position");
			if(!eltPos) return; //this script is pretty useless if getComputedStyle not supported, like Opera
		if(eltPos == "static") elt.style.position = "relative"; //make container

		var props = [["top","left"],["top","right"],["bottom","left"],["bottom","right"]];
		for(var i in props) {
			var c = this.corners[this.corners.length] = document.createElement("span");
			c.className = "rounded-corner " + props[i][0] + "-" + props[i][1];
			c.style.position = "absolute";
			for(var j in props[i]) c.style[props[i][j]] = "0px";
			elt.appendChild(c);
		}
		
	},
	destroy : function() {
		var elt = this.element;
		for(var i in this.corners) elt.removeChild(this.corners[i]);
		elt.style.position = "";
	}
};
RoundedCorners.scriptSheetSelector = ".rounded-corners";
