/*===============

Window.js: Creates a draggable, resizable "window" from any node.

==Usage:==
new Window(contentElement, titleElement, width, height, xPosition, yPosition, zIndex);
	contentElement = the element to be encapsulated in a Window. Can be an element 
		already existing within the document or script-generated (document.createElement).
		This element is given the CSS class .window-content
	titleElement = the node to be put in the title bar of the Window. Can be a node
		already existing within the document (such as an <h1/> before or within the 
		contentElement) or script-generated. If it exists within the document it will
		be moved from its original location in the node tree to the title bar.
		The title bar element is given the CSS class .window-title-bar
	width = initial width of the Window in pixels. If not supplied, Window.minWidth 
		below will be used instead.
	height = initial height of the Window in pixels. If not supplied, Window.minHeight
		below will be used instead.
	xPosition = initial horizontal position in pixels. Defaults to zero if not supplied.
	yPosition = initial vertical position in pixels. Defaults to zero if not supplied.
	zIndex = initial z-index of the Window, for when windows overlap. Not very useful.
	
==Example Styles:==
<style type="text/css">
.window {position:absolute; border:2px outset #FFF; background:#EEE;}
.window-content {border:2px inset #FFF; overflow:auto; padding-left:4px;}
.window-title-bar {margin:0; padding:.25em 1em; margin:0; background:#009; color:#FFF; font-weight:bold; cursor:default; white-space:nowrap; -moz-user-select:none;}
.window-resizer {position:absolute; right:-5px; bottom:-5px; width:16px; height:16px; border:solid #666; border-width:0 1px 1px 0; cursor:se-resize;}
</style>

===============*/



function Window(contentElt, titleElt, w, h, x, y, z) {
	// Freaks out Mac IE: // if(!(this instanceof Window)) return new Window(elt, title);
	this.windowW = w;
	this.windowH = h;
	this.windowX = x;
	this.windowY = y;
	this.windowZ = z;
	this.init(contentElt, titleElt);
}
Window.minWidth  = 100;
Window.minHeight = 100;
Window.topZIndex = 0;
Window.instances = [];

Window.prototype = {
	init : function(contentElt, titleElt) {
		var elt = this.element = document.createElement("div");
		var thisRef = this;		

		//Make it positioned:
		elt.className = "window";
		elt.style.position = "absolute";
		elt.style.left = (this.windowX || 0) + "px";
		elt.style.top  = (this.windowY || 0) + "px";
		elt.style.width  = (this.windowW || Window.minWidth ) + "px";
		elt.style.height = (this.windowH || Window.minHeight) + "px";

		//Make it pop to front when clicked:
		if(this.windowZ > Window.topZIndex) Window.topZIndex = this.windowZ;
		elt.addEventListener("mousedown", function(){thisRef.bringToFront();}, false);
				
		//Create title bar:
		var titlebar = document.createElement("div");
			titlebar.className = "window-title-bar";
			titlebar.appendChild(titleElt);
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
			//Hack to make height adjust to container in IE:
			if(contentElt.style.setExpression) contentElt.style.setExpression("height", "parseFloat(" + elt.uniqueID + ".style.height) - 20");
		this.element.appendChild(contentElt);
		(document.getElementsByTagName("body")[0] || document.documentElement).appendChild(this.element);
		
		//Make sure it's not overlapping:
		this.moveToOpenSpace();
	},
	
	bringToFront : function() {
		this.element.style.zIndex = this.windowZ = Window.topZIndex += 1;
	},
	
	moveToOpenSpace : function() {
		var thisElt = this.element;
		var wins = Window.instances;
		var isOverlapping = false;
		for(var i=0; i<wins.length; i++) {
			if(wins[i] != this) {
				var otherElt = wins[i].element;
				var xA = this.getLength("left");
				var yA = this.getLength("top");
				var wA = this.getWidth();
				var hA = this.getHeight();
				var xB = parseFloat(otherElt.style.left);
				var yB = parseFloat(otherElt.style.top);
				var wB = otherElt.offsetWidth;
				var hB = otherElt.offsetHeight;

				if((xA <= xB && xA + wA > xB && (yA <= yB && yA + hA > yB || yB <= yA && yB + hB > yA)) ||
				   (xB <= xA && xB + wB > xA && (yA <= yB && yA + hA > yB || yB <= yA && yB + hB > yA))) {
					//move to closer side:
					if(xB + wB - xA < yB + hB - yA) thisElt.style.left = (this.windowX = xB + wB + 4) + "px";
					else thisElt.style.top  = (this.windowY = yB + hB + 4) + "px";
					isOverlapping = true;
				}  
			}
		}
		if(isOverlapping) this.moveToOpenSpace(); //re-run to check for new overlaps
	},
	
	startDrag : function(evt) {
		var elt = this.element;

		//Capture initial positions to compare to later:
		this.mouseX = this.getMouseX(evt);
		this.windowX = parseFloat(elt.style.left);
		this.mouseY = this.getMouseY(evt);
		this.windowY = parseFloat(elt.style.top);

		this.stopDrag();
		var thisRef = this;
		document.addEventListener("mousemove", this.docMousemoveHandler=function(evt){thisRef.doDrag(evt)}, false);
		document.addEventListener("mouseup", this.docMouseupHandler=function(evt){thisRef.stopDrag(evt)}, false);
	},
	
	doDrag : function(evt) {
		var elt = this.element;

		//Calc distance mouse moved:
		var diffX = -this.mouseX + (this.mouseX = this.getMouseX(evt));
		var diffY = -this.mouseY + (this.mouseY = this.getMouseY(evt));

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
		this.mouseX = this.getMouseX(evt);
		this.windowW = this.getWidth();
		this.mouseY = this.getMouseY(evt);
		this.windowH = this.getHeight();

		this.stopResize();
		var thisRef = this;
		document.addEventListener("mousemove", this.docMousemoveHandler=function(evt){thisRef.doResize(evt)}, false);
		document.addEventListener("mouseup", this.docMouseupHandler=function(evt){thisRef.stopResize(evt)}, false);
	},
	
	doResize : function(evt) {
		var elt = this.element;

		//Calc distance mouse moved:
		var diffX = -this.mouseX + (this.mouseX = this.getMouseX(evt));
		var diffY = -this.mouseY + (this.mouseY = this.getMouseY(evt));

		//Move panel by same amount as mouse:
		this.windowW += diffX;
		this.windowH += diffY;

		//Commit:
		var minW = Window.minWidth;
		var minH = Window.minHeight;
		elt.style.width  = (this.windowW > minW ? this.windowW : minW) + "px";
		elt.style.height = (this.windowH > minH ? this.windowH : minH) + "px";
	},
	
	stopResize : function(evt) {
		this.moveToOpenSpace();

		//Remove event listeners:
		document.removeEventListener("mousemove", this.docMousemoveHandler, false);
		document.removeEventListener("mouseup", this.docMouseupHandler, false);
	},
	
	//Utilities to get properties, dimensions:
	getLength : function(prop) {
		return parseFloat(window.getComputedStyle(this.element,null).getPropertyValue(prop));
	},	
	getWidth : function() {
		return this.element.offsetWidth || ( this.getLength("width") + 
			this.getLength("padding-left") + this.getLength("padding-right") +
			this.getLength("border-left-width") + this.getLength("border-right-width")		
		);
	},	
	getHeight : function() {
		return this.element.offsetHeight || ( this.getLength("height") + 
			this.getLength("padding-top") + this.getLength("padding-bottom") +
			this.getLength("border-top-width") + this.getLength("border-bottom-width")		
		);
	},
	getMouseX : function(evt) {
		return evt.pageX || (evt.clientX + (window.scrollX || document.body.scrollLeft));
	},
	getMouseY : function(evt) {
		return evt.pageY || (evt.clientY + (window.scrollY || document.body.scrollTop));
	}
};