/*	<style type="text/css">
.window {position:absolute; border:2px outset #FFF; background:#EEE;}
.window-content {border:2px inset #FFF; overflow:auto; padding-left:4px;}
.window-title-bar {margin:0; padding:.25em 1em; margin:0; background:#009; color:#FFF; font-weight:bold; cursor:default; white-space:nowrap; -moz-user-select:none;}
.window-resizer {position:absolute; right:-5px; bottom:-5px; width:16px; height:16px; border:solid #666; border-width:0 1px 1px 0; cursor:se-resize;}
</style> */



function Window(elt, title, w, h, x, y, z) {
	// Freaks out Mac IE: // if(!(this instanceof Window)) return new Window(elt, title);
	this.windowW = w;
	this.windowH = h;
	this.windowX = x;
	this.windowY = y;
	this.windowZ = z;
	this.init(elt, title);
}
Window.topZIndex = 0;
Window.instances = [];

Window.prototype = {
	init : function(contentElt, title) {
		var elt = this.element = document.createElement("div");
		var thisRef = this;
		

		//Make it positioned:
		elt.className = "window";
		elt.style.position = "absolute";
		if (!elt.style.left) elt.style.left = (this.windowX || 0) + "px";
		if (!elt.style.top)  elt.style.top  = (this.windowY || 0) + "px";
		if (!elt.style.width)  elt.style.width  = (this.windowW || 500) + "px";
		if (!elt.style.height) elt.style.height = (this.windowH || 500) + "px";

		//Make it pop to front when clicked:
		if(this.windowZ > Window.topZIndex) Window.topZIndex = this.windowZ;
		elt.addEventListener("mousedown", function(){thisRef.bringToFront();}, false);
		
		
		//Create title bar:
		var titlebar = document.createElement("div");
			titlebar.className = "window-title-bar";
			titlebar.appendChild(document.createTextNode(title));
			titlebar.addEventListener("mousedown", function(evt){thisRef.startDrag(evt);}, false);
			titlebar.onselectstart = titlebar.ondragstart = function(){return false;} //prevent text selection
		elt.appendChild(titlebar);
		
		//Create resizer:
		var resizer = document.createElement("div");
			resizer.className = "window-resizer";
			resizer.addEventListener("mousedown", function(evt){thisRef.startResize(evt);}, false);
			resizer.onselectstart = resizer.ondragstart = function(){return false;} //prevent text selection
		elt.appendChild(resizer);

		//Add to list of Window objects:
		Window.instances[Window.instances.length] = this;

		//Make window content a child of the new wrapper element:
		contentElt.className += " window-content";
		with (contentElt.style) {
			position = "absolute";
			left = right = bottom = "0"; top = "20px";
		}
			//Hack for IE:
			if(contentElt.style.setExpression) contentElt.style.setExpression("height", "parseFloat(" + elt.uniqueID + ".style.height) - 20");
		this.element.appendChild(contentElt);
		(document.getElementsByTagName("body")[0] || document.documentElement).appendChild(this.element);
	},
	
	getStyle : function(prop) {
		return window.getComputedStyle(this.element, null).getPropertyValue(prop);
	},
	
	bringToFront : function() {
		this.element.style.zIndex = this.windowZ = Window.topZIndex += 1;
	},
	
	moveToOpenSpace : function() {
		var elt = this.element;
		var wins = Window.instances;
		var isOverlapping = false;
		for(var i=0; i<wins.length; i++) {
			if(wins[i] != this) {
				var winElt = wins[i].element;
				var xA = parseFloat(elt.style.left);
				var yA = parseFloat(elt.style.top);
				var wA = elt.offsetWidth;
				var hA = elt.offsetHeight;
				var xB = parseFloat(winElt.style.left);
				var yB = parseFloat(winElt.style.top);
				var wB = winElt.offsetWidth;
				var hB = winElt.offsetHeight;

				if((xA <= xB && xA + wA > xB && (yA <= yB && yA + hA > yB || yB <= yA && yB + hB > yA)) ||
				   (xB <= xA && xB + wB > xA && (yA <= yB && yA + hA > yB || yB <= yA && yB + hB > yA))) {
					//move to closer side:
					if(xB + wB - xA < yB + hB - yA) elt.style.left = (this.windowX = xB + wB + 4) + "px";
					else elt.style.top  = (this.windowY = yB + hB + 4) + "px";
					isOverlapping = true;
				}  
			}
		}
		if(isOverlapping) this.moveToOpenSpace(); //re-run to check for new overlaps
	},
	
	startDrag : function(evt) {
		var elt = this.element;

		//Capture initial positions to compare to later:
		this.mouseX = evt.clientX + (window.scrollX || document.body.scrollLeft);
		this.windowX = parseFloat(elt.style.left);
		this.mouseY = evt.clientY + (window.scrollY || document.body.scrollTop);
		this.windowY = parseFloat(elt.style.top);

		//document.body.className += " panel-dragging"; //hides controls while dragging

		this.stopDrag();
		var thisRef = this;
		document.addEventListener("mousemove", this.docMousemoveHandler=function(evt){thisRef.doDrag(evt)}, false);
		document.addEventListener("mouseup", this.docMouseupHandler=function(evt){thisRef.stopDrag(evt)}, false);
	},
	
	doDrag : function(evt) {
		var elt = this.element;

		//Calc distance mouse moved:
		var diffX = -this.mouseX + (this.mouseX = evt.clientX + (window.scrollX || document.body.scrollLeft));
		var diffY = -this.mouseY + (this.mouseY = evt.clientY + (window.scrollY || document.body.scrollTop));

		//Move panel by same amount as mouse:
		this.windowX += diffX;
		this.windowY += diffY;

		//Commit: (Keep from going beyond top or left of viewport)
		elt.style.left = (this.windowX >= 0 ? this.windowX : 0) + "px";
		elt.style.top  = (this.windowY >= 0 ? this.windowY : 0) + "px";
	},
	
	stopDrag : function(evt) {
		this.moveToOpenSpace();
		//document.body.className = document.body.className.replace(/panel-dragging/g,"")

		//Remove event listeners:
		document.removeEventListener("mousemove", this.docMousemoveHandler, false);
		document.removeEventListener("mouseup", this.docMouseupHandler, false);
	},
	
	startResize : function(evt) {
		var elt = this.element;

		//Capture initial positions to compare to later:
		this.mouseX = evt.clientX + (window.scrollX || document.body.scrollLeft);
		this.windowW = elt.offsetWidth;
		this.mouseY = evt.clientY + (window.scrollY || document.body.scrollTop);
		this.windowH = elt.offsetHeight;

		//document.body.className += " panel-dragging"; //hides controls while dragging

		this.stopResize();
		var thisRef = this;
		document.addEventListener("mousemove", this.docMousemoveHandler=function(evt){thisRef.doResize(evt)}, false);
		document.addEventListener("mouseup", this.docMouseupHandler=function(evt){thisRef.stopResize(evt)}, false);
	},
	
	doResize : function(evt) {
		var elt = this.element;

		//Calc distance mouse moved:
		var diffX = -this.mouseX + (this.mouseX = evt.clientX + (window.scrollX || document.body.scrollLeft));
		var diffY = -this.mouseY + (this.mouseY = evt.clientY + (window.scrollY || document.body.scrollTop));

		//Move panel by same amount as mouse:
		this.windowW += diffX;
		this.windowH += diffY;

		//Commit:
		var minW = Window.minWidth || 100;
		var minH = Window.minHeight || 100;
		elt.style.width =  (this.windowW > minW ? this.windowW : minW) + "px";
		elt.style.height = (this.windowH > minH ? this.windowH : minH) + "px";
	},
	
	stopResize : function(evt) {
		this.moveToOpenSpace();

		//Remove event listeners:
		document.removeEventListener("mousemove", this.docMousemoveHandler, false);
		document.removeEventListener("mouseup", this.docMouseupHandler, false);
	}
};