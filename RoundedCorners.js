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
		var i, c, props;
		var elt = this.element;
		this.corners = [];
		
		function gCS(prop) {
			return document.defaultView.getComputedStyle(elt, null).getPropertyValue(prop);
		}
		
		//create inner container
		var inner = this.inner = document.createElement("div");
			props = ["top","left","bottom","right"];
			for(i in props) inner.style["padding" + props[i].charAt(0).toUpperCase() + props[i].substring(1)] = gCS("padding-" + props[i]);
			elt.style.padding = "0px";
		while(elt.lastChild) inner.appendChild(elt.lastChild);
		
		//create corners
		props = [["top","left"],["top","right"],["bottom","left"],["bottom","right"]];
		for(i=0; i<props.length; i++) {
			c = this.corners[i] = document.createElement("div");
			c.className = "rounded-corner " + props[i][0] + "-" + props[i][1];
			(i==0 ? elt : this.corners[i-1]).appendChild(c);
		}
		this.corners[props.length-1].appendChild(inner);
		elt.appendChild(this.corners[0]);


	},
	destroy : function() {
		var elt = this.element;
		//for(var i in this.corners) elt.removeChild(this.corners[i]);
		//elt.style.position = "";
		while(this.inner.lastChild) elt.appendChild(this.inner.lastChild);
		elt.removeChild(this.corners[0]);
		elt.style.padding = "";
	}
};
RoundedCorners.scriptSheetSelector = ".rounded-corners";
