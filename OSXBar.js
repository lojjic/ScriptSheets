
/*

<ul class="OSX-bar">
	<li id="item-one"><a href="url">Label</a></li>
	<li id="item-two">Label
		<ul>
			<li>Submenu</li>
			<li>Submenu</li>
			<li>Submenu</li>
		</ul>
	</li>
</ul>

* outer <ul> is container strip - it expands height to fit scaled images
* each <li> uses list-style-image:url() as its icon
* first child of <li> pops up next to icon when hovered
* all other children of <li> pop out into panel next to icon when clicked.

This would be much easier with the XHTML2-proposed <nl> structure.

TODO:
	* PERF: Put (small) delay on creation of icon label popup (tried, but it actually worsened performance?!)
	* PERF: Find ways to prevent excessive icon position/size calculation
		* DONE - Icons already at correct size and position don't need to be re-set
		* DONE - Cache numeric position/size values instead of having to parseFloat() style strings all the time
		* Make icon positioning "smarter" so it doesn't have to rely on position of previous icon (?)
	* Handle label/popup widths/heights better (make them adjust to size of contents if possible)
	* DONE - Make icon max/min size, spacing, and reach parameters to the constructor

*/


function OSXBar(elt, edge, minSize, maxSize, spacing, reach) {
	this.element = elt;
	this.edge = edge || "left"; //one of "top", "right", "bottom", or "left". Defaults to "left".
	this.iconMinSize = minSize || 24; // smallest (initial) icon size (pixels).
	this.iconMaxSize = maxSize || 48; // largest size when scaled (pixels). For best quality, this should be the natural height of the icon image.
	this.iconSpacing = spacing || 12; // space between icons (pixels).
	this.scaleReach  = reach   || 7;  // "gradualness" of the scaling - larger number gives smoother curve. Set to 0 for no scaling.
	this.create();
}
OSXBar.prototype = {
	scaled : false,
	scalingLocked : false,

	create : function() {
		var i,j,k;
		var elt = this.element;
		this.icons = [];

		// hookup the icons:
		var items = elt.childNodes;
		for(i=0; i<items.length; i++) { //make <li>s into icons:
			if(items[i].nodeType == 1 && items[i].tagName.toLowerCase() == "li") new OSXBarIcon(items[i], this); 
		}

		//set bar position, style:
		elt.className = "osx-bar";
		this.setSizeAndPosition();
		
		//hookup scaling with mouse position:
		var thisRef = this;
		document.addEventListener("mousemove", function(evt){thisRef.onMouseMoved(evt);}, false);
	},

	onMouseMoved : function(evt) {
		if(this.scalingLocked) return;
	
		//reduce scaling to larger time intervals (makes animation smoother with fast mouse movement, no frame skipping);
		var now = new Date();
		if(this.lastScaledTime && now - this.lastScaledTime < 100) return;
		this.lastScaledTime = now;

		var isVertical = this.isVertical();
		var isTopLeft = (this.edge=="top" || this.edge=="left");
		var mousePos = isVertical ? evt.clientX : evt.clientY;
		var windowSize = isVertical ? (window.innerWidth || document.body.clientWidth) : (window.innerHeight || document.body.clientHeight); 
		if((isTopLeft ? 0 : windowSize - (this.iconMinSize + this.iconSpacing) * 2) < mousePos && 
				mousePos < (isTopLeft ? (this.iconMinSize + this.iconSpacing) * 2 : windowSize)) 
			this.onScale(evt);
		else if(this.scaled) this.onUnscale(evt);
	},
	
	onScale : function(evt) { // XXX - will eventually want this to move smoothly (several steps)
		this.scaled = true; //flag status
		for(var i=0; i<this.icons.length; i++) this.icons[i].setSizeAndPosition(evt); //set all icons to scaled size and position
		this.setSizeAndPosition(); //set expanded bar height and position
	},
	
	onUnscale : function(evt) { // XXX - will eventually want this to move smoothly (several steps)
		this.scaled = false; //flag status
		for(var i=0; i<this.icons.length; i++) this.icons[i].setSizeAndPosition(null); //set all icons back to normal size and position (null event so scaling doesn't occur)
		this.setSizeAndPosition(); //set bar to normal length and position
	},
	
	isVertical : function() { // returns whether bar is vertically-oriented.  Value is cached for performance.
		return this._cachedIsVertical || (this._cachedIsVertical = (this.edge=="left" || this.edge=="right"));
	},

	setSizeAndPosition : function() {
		var iconLength = 0; //keep track of icon heights
		var iconSizeProp = this.isVertical() ? "height" : "width";
		for(var i=0; i<this.icons.length; i++) iconLength += this.icons[i].size;
		
		var edgeLength = this.isVertical() ? (window.innerHeight || document.body.clientHeight) : (window.innerWidth || document.body.clientWidth); //width or height of window
		var lngth = iconLength + this.icons.length * this.iconSpacing;
		var girth = this.iconMinSize + this.iconSpacing;
		var toSide = (this.position = edgeLength / 2 - lngth / 2) + "px";
		var toEdge = (this.iconSpacing / 2) + "px";
		var l, t, r, b, h, w;
		switch(this.edge) {
			case "top": l=toSide; t=toEdge; h=girth; w=lngth; break;
			case "right": t=toSide; r=toEdge; h=lngth; w=girth; break;
			case "bottom": l=toSide; b=toEdge; h=girth; w=lngth; break;
			default: t=toSide; l=toEdge; h=lngth; w=girth; break;
		}
		var s = this.element.style;
			s.position = "absolute";
			s.left = l || "auto"; s.top = t || "auto"; s.right = r || "auto"; s.bottom = b || "auto";
			s.height = h + "px"; s.width = w + "px";
	}
};





function OSXBarIcon(elt, bar) {
	bar.icons[this.instanceIndex = bar.icons.length] = this;
	
	this.element = elt; //original <li>
	this.parentBar = bar; //parent OSXBar
	
	this.create();
}
OSXBarIcon.prototype = {
	focused : false,

	create : function() {
		//hide original <li>:
		this.element.style.display = "none";

		//get label (first text node):
		function getFirstTextNode(inNode) {
			if(!inNode) return false; //exit if node not defined
			if(inNode.nodeType == 3) return inNode; //text node! - return the text node
			if(inNode.nodeType == 1) { //element - recurse into children, then following siblings
				var outNode;
				if(outNode = getFirstTextNode(inNode.firstChild)) return outNode;
				if(outNode = getFirstTextNode(inNode.nextSibling)) return outNode;
				return false;
			}
			return false;
		}
		var labelNode = getFirstTextNode(this.element);
		this.label = labelNode.nodeValue.replace(/^\s*(.*)\s*$/,"$1"); //strip leading and trailing space
		if(labelNode.parentNode.tagName.toLowerCase() == "a") this.link = labelNode.parentNode.href; //remember label link
		if(this.link) labelNode.parentNode.parentNode.removeChild(labelNode.parentNode);
		else labelNode.parentNode.removeChild(labelNode);
		
		//create icon, set initial position:
		var icon = this.icon = document.createElement("img");
			//alert(elt.currentStyle.listStyleImage);
			icon.src = window.getComputedStyle(this.element,null).getPropertyValue("list-style-image").replace(/^url\("?([^"]*)"?\)$/,"$1"); //get path out of "url(path)" string
			icon.alt = this.label;
			this.setSizeAndPosition();
			this.parentBar.element.appendChild(icon);

		var thisRef = this;
		icon.addEventListener("mouseover", function(evt){thisRef.onMouseOver(evt);}, false);
		icon.addEventListener("mouseout", function(evt){thisRef.onMouseOut(evt);}, false);
		icon.addEventListener("click", function(evt){thisRef.onPoke(evt);}, false);
	},

	onMouseOver : function(evt) { 
		//label pops up on hover:
		if(!this.parentBar.scalingLocked && (!this.popupSubmenu || !this.popupSubmenu.popupNode.parentNode)) 
			this.popupLabel = new OSXBarPopupLabel(this.element, this);
		if(this.link) window.status = this.link; //if link, put address in status bar
	},

	onMouseOut : function(evt) {
		if(this.popupLabel) this.popupLabel.destroy(); //remove icon label
		this.popupLabel = null; //remove ref to avoid position updating of destroyed object
		window.status = ""; //remove link from status bar
	},

	onPoke : function(evt) {
		// unlock scaling if locked:
		this.parentBar.scalingLocked = false;
		this.parentBar.onScale(evt); //force scaling to new position
	
		// if link, go there:
		if(this.link) {
			location.href = this.link;
			return;
		}

		// if submenu, create popup:
		// XXX - only if has child nodes...
		this.popupSubmenu = new OSXBarPopupSubmenu(this.element, this);
	},
	
	setSizeAndPosition : function(evt) {
		var bar = this.parentBar;
		var edge = bar.edge;
		var isVertical = bar.isVertical();
		var fixPosProp = edge; //property matches name of edge
		var adjPosProp = isVertical ? "top" : "left";
		var mousePosProp = isVertical ? "clientY" : "clientX";
		var sizeProp = isVertical ? "height" : "width";
	
		//calculate icon size:
		var newSize = bar.iconMinSize;
		if(evt) {
			var mouseDist = evt[mousePosProp] - bar.position - this.position - this.size/2;
			newSize = bar.iconMaxSize - Math.abs(mouseDist) / bar.scaleReach;
			if(Math.abs(mouseDist) < bar.iconMaxSize/2) newSize = bar.iconMaxSize; //snap to max size if mouse over icon (best image quality)
			if(newSize < bar.iconMinSize) newSize = bar.iconMinSize; //keep from going below minimum size
		}
		var prevIcon = bar.icons[this.instanceIndex-1];
		var newPos = prevIcon ? (prevIcon.position + prevIcon.size + bar.iconSpacing) : (bar.iconSpacing / 2);
		if(this.size == (newSize = Math.round(newSize)) && this.position == (newPos = Math.round(newPos))) return; //if already in the right place, stop calculation
			
		//set icon position and size:
		var s = this.icon.style;
		s.position = "absolute";
		s.height = s.width = s.left = s.top = s.right = s.bottom = "auto"; //default all
		s[sizeProp] = (this.size = newSize) + "px";
		s[fixPosProp] = bar.iconSpacing / 2 + "px";
		s[adjPosProp] = (this.position = newPos) + "px";
		
		if(this.popupLabel) this.popupLabel.setPosition();	
		if(this.popupSubmenu) this.popupSubmenu.setPosition();
	}
};



function OSXBarPopup() {} //used as base class for OSXBarPopupLabel and OSXBarPopupSubmenu
OSXBarPopup.prototype = new PopupObject("osx-bar-popup");
OSXBarPopup.prototype.parentElement = function() {
	return this.parentIcon.parentBar.element; //append to bar instead of body
};
OSXBarPopup.prototype.setPosition = function() {
	var bar = this.parentIcon.parentBar;
	var fixPosProp = bar.edge;; //property matches name of edge
	var adjPosProp = bar.isVertical() ? "top" : "left";
	var dist = bar.iconMaxSize + bar.iconSpacing;
	var s = this.popupNode.style;
		s.position = "absolute";
		s[fixPosProp] = dist + "px";
		s[adjPosProp] = this.parentIcon.position + "px";
};



function OSXBarPopupLabel(elt, icon) {
	this.element = elt;
	this.parentIcon = icon;
	this.create();
	this.addContent();
	this.setPosition();
}
OSXBarPopupLabel.prototype = new OSXBarPopup();
OSXBarPopupLabel.prototype.addContent = function() {
	this.popupNode.className = "osx-bar-popup-label";
	this.popupNode.appendChild(document.createTextNode(this.parentIcon.label)); // add label as content
};



function OSXBarPopupSubmenu(elt, icon) {
	this.element = elt;
	this.parentIcon = icon;
	this.create();
	this.addContent();
	this.setPosition();
}
OSXBarPopupSubmenu.prototype = new OSXBarPopup();
OSXBarPopupSubmenu.prototype.addContent = function() {
	this.popupNode.className = "osx-bar-popup-submenu";

	// add popup label:
	var label = document.createElement("div");
		label.className = "osx-bar-popup-submenu-label";
		label.appendChild(document.createTextNode(this.parentIcon.label));
	this.popupNode.appendChild(label);
	
	// add <li> children to the popup:
	var kids = this.element.childNodes;
	for(var i=0; i<kids.length; i++) this.popupNode.appendChild(kids[i].cloneNode(true));
	
	this.parentIcon.parentBar.scalingLocked = true; // keep icons scaled when popup open
};
OSXBarPopupSubmenu.prototype.destroyBase = OSXBarPopupSubmenu.prototype.destroy;
OSXBarPopupSubmenu.prototype.destroy = function() {
	this.destroyBase();
	this.parentIcon.parentBar.scalingLocked = false;
}




// Hookup on page load (automatically hooks up any <ul>s with class="osx-bar" with default parameters):
function onOSXBarLoaded(evt) {
	var ULs = document.getElementsByTagName("ul");
	for(var i=0; i<ULs.length; i++) {
		if(ULs[i].className.match(/^(.*\s+)?osx-bar(\s+.*)?$/)) new OSXBar(ULs[i]);
	}
}
window.addEventListener("load",onOSXBarLoaded,false);
