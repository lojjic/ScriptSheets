/*
**  OSXBar script by Jason Johnston (jj@lojjic.net)
**  Created July 2003.  Use freely, but give me credit.
**
**  This script creates a bar like the Mac OSX dock
**  out of a nested unordered list (<ul>).  The icons,
**  which scale when near the mouse, are determined 
**  from the list-style-image of the top-level <li>s.
**  Submenus and other children of the <li>s are put
**  in a menu that pops up next to the icon.
*/

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

TODO:
	* PERF: Put (small) delay on creation of icon label popup (tried, but it actually worsened performance?!)
	* PERF: Find ways to prevent excessive icon position/size calculation
		* Make icon positioning "smarter" so it doesn't have to rely on position of previous icon (?)
	* Graduate scaling over several steps for smooth effect when entering and leaving active region
	* Allow on-the-fly changing of bar.edge property
	* Keep bar centered when page scrolled
	* Make submenus adjust if they hit the window edge (like normal PopupObject)
	* Find way to only do IE-PNG-alpha-transparency hack if system supports DirectX filter

*/


function OSXBar(elt, edge, minSize, maxSize, spacing, reach) { //only elt is required; all others default to values below
	this.element = elt;
	this.edge = (edge && edge.match(/^(top|right|bottom|left)$/)) ? edge : "left"; //one of "top", "right", "bottom", or "left". Defaults to "left".
	this.iconMinSize = parseInt(minSize) || 24; // smallest (initial) icon size (pixels).
	this.iconMaxSize = parseInt(maxSize) || 48; // largest size when scaled (pixels). For best quality, this should be the natural height of the icon image.
	this.iconSpacing = parseInt(spacing) || 12; // space between icons (pixels).
	this.scaleReach  = parseInt(reach)   || 7;  // "gradualness" of the scaling - larger number gives smoother curve.
	this.create();
	OSXBar.instances[OSXBar.instances.length] = this;
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

		// set bar style and position:
		elt.className = "osx-bar";
		this.setSizeAndPosition();
		
		//hookup scaling with mouse position:
		var thisRef = this;
		document.addEventListener("mousemove", function(evt){thisRef.onMouseMoved(evt);}, false);
	},

	onMouseMoved : function(evt) {
		if(this.scalingLocked) return; //Do nothing if submenu open
	
		//reduce scaling to larger time intervals (makes animation smoother with fast mouse movement, no frame skipping);
		var now = new Date();
		if(this.lastScaledTime && now - this.lastScaledTime < 100) return;
		this.lastScaledTime = now;

		var isVertical = (this.edge=="left" || this.edge=="right");
		var isTopLeft  = (this.edge=="top" || this.edge=="left");
		var mousePos   = isVertical ? evt.clientX : evt.clientY;
		var windowSize = isVertical ? (window.innerWidth || document.body.clientWidth) : (window.innerHeight || document.body.clientHeight); 
		if(mousePos > (isTopLeft ? this.iconSpacing/2 : windowSize - this.iconMaxSize - this.iconSpacing) && 
		   mousePos < (isTopLeft ? this.iconMaxSize + this.iconSpacing : windowSize - this.iconSpacing/2)) 
			this.onScale(evt);
		else if(this.scaled) this.onUnscale(evt);
	},
	
	onScale : function(evt) {
		this.scaled = true; //flag status
		for(var i=0; i<this.icons.length; i++) this.icons[i].setSizeAndPosition(evt); //set all icons to scaled size and position
		this.setSizeAndPosition(); //set expanded bar height and position
	},
		
	onUnscale : function(evt) {
		this.scaled = false; //flag status
		for(var i=0; i<this.icons.length; i++) this.icons[i].setSizeAndPosition(null); //set all icons back to normal size and position (null event so scaling doesn't occur)
		this.setSizeAndPosition(); //set bar to normal length and position
	},
	
	setSizeAndPosition : function() {
		var isVertical = (this.edge=="left" || this.edge=="right");
		
		//find total size of all icons:
		var iconLength = 0;
		for(var i=0; i<this.icons.length; i++) iconLength += this.icons[i].size;
		
		var edgeLen = isVertical ? (window.innerHeight || document.body.clientHeight) : (window.innerWidth || document.body.clientWidth); //width or height of window
		//var scroll = window.scrollY || document.body.scrollTop;
		var lngth  = iconLength + this.icons.length * this.iconSpacing;
		var girth  = this.iconMinSize + this.iconSpacing;
		var toSide = (this.position = edgeLen / 2 - lngth / 2 /* + scroll*/) + "px";
		var toEdge = (this.iconSpacing / 2) + "px";
		var l,t,r,b,h,w;
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
OSXBar.instances = [];





function OSXBarIcon(elt, bar) {
	bar.icons[this.instanceIndex = bar.icons.length] = this;	
	this.element = elt; //original <li>
	this.parentBar = bar; //parent OSXBar	
	this.create();
}
OSXBarIcon.prototype = {
	focused : false,

	create : function() {
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
		
		//get popup content (everything that's left):
		this.contents = [];
		var kids = this.element.childNodes;
		for(var i=0; i<kids.length; i++) this.contents[this.contents.length] = this.element.removeChild(kids[i]); //remove from DOM so they can be reused after moving
		
		//create icon, set initial position:
		var icon = this.icon = document.createElement("img");
			icon.alt = this.label;
			icon.src = window.getComputedStyle(this.element,null).getPropertyValue("list-style-image").replace(/^url\("?([^"]*)"?\)$/,"$1"); //get path out of "url(path)" string
			if(icon.src.match(/.png$/) && navigator.userAgent.match(/MSIE (5\.5)|[6789]/) && navigator.platform == "Win32") { //add IE alpha filter if PNG image, to enable alpha transparency:
				icon.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + icon.src + "', sizingMethod='scale')";
				icon.src = "http://microsoft.com/homepage/gif/1ptrans.gif?please_support_PNG_alpha_transparency"; //they make me do hacks like this, I use their bandwidth.
			}
			this.setSizeAndPosition();
			this.parentBar.element.appendChild(icon);

		var thisRef = this;
		icon.addEventListener("mouseover", function(evt){thisRef.onMouseOver(evt);}, false);
		icon.addEventListener("mouseout", function(evt){thisRef.onMouseOut(evt);}, false);
		icon.addEventListener("click", function(evt){thisRef.onPoke(evt);}, false);
		
		//hide original <li>:
		this.element.style.display = "none";
	},

	onMouseOver : function(evt) { 
		//label pops up on hover:
		if(!this.parentBar.scalingLocked && !this.popupSubmenu) this.popupLabel = new OSXBarPopupLabel(this);
		if(this.link) window.status = this.link; //if link, put address in status bar
	},

	onMouseOut : function(evt) {
		if(this.popupLabel) this.popupLabel.destroy(); //remove icon label
		this.popupLabel = null;
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
		this.popupSubmenu = new OSXBarPopupSubmenu(this);
	},
	
	setSizeAndPosition : function(evt) {
		var bar = this.parentBar;
		var isVertical = (bar.edge=="left" || bar.edge=="right");
	
		//calculate icon size:
		var newSize = bar.iconMinSize;
		if(evt) {
			//var scroll = window.scrollY || document.body.scrollTop;
			var mousePos = isVertical ? evt.clientY : evt.clientX;
			var mouseDist = Math.abs(mousePos /*+ scroll*/ - bar.position - this.position - this.size/2) - this.size/2;
			if(mouseDist < 0) mouseDist = 0;
			newSize = bar.iconMaxSize - mouseDist / bar.scaleReach;
			if(newSize < bar.iconMinSize) newSize = bar.iconMinSize; //keep from going below minimum size
		}
		var prevIcon = bar.icons[this.instanceIndex-1];
		var newPos = prevIcon ? (prevIcon.position + prevIcon.size + bar.iconSpacing) : (bar.iconSpacing / 2);
		if(this.size == (newSize = Math.round(newSize)) && this.position == (newPos = Math.round(newPos)) && !this.popupLabel) return; //if already in the right place, stop calculation
			
		var fixPos = (bar.iconSpacing / 2) + "px";
		var varPos = (this.position = newPos) + "px";
		var size   = (this.size = newSize) + "px";
		var l,t,r,b,h,w;
		switch(bar.edge) {
			case "top": l=varPos; t=fixPos; w=size; break;
			case "right": t=varPos; r=fixPos; h=size; break;
			case "bottom": l=varPos; b=fixPos; w=size; break;
			default: t=varPos; l=fixPos; h=size; break;
		}
		var s = this.icon.style;
			s.position = "absolute";
			s.left = l || "auto"; s.top = t || "auto"; s.right = r || "auto"; s.bottom = b || "auto";
			s.height = h || "auto"; s.width = w || "auto";
		
		if(this.popupLabel) this.popupLabel.setPosition(); //move label with icon
	}
};



function OSXBarPopup() {} //used as base class for OSXBarPopupLabel and OSXBarPopupSubmenu
OSXBarPopup.prototype = new PopupObject("osx-bar-popup");
OSXBarPopup.prototype.setPosition = function() {
	var distFromIcon = 12; //distance of popup from its icon
	var icon = this.parentIcon;
	var bar = icon.parentBar;
	var fixPos = (bar.iconMaxSize + bar.iconSpacing + distFromIcon) + "px";
	var varPos = (icon.position + bar.position) + "px";
	var l,t,r,b;
	switch(bar.edge) {
		case "top": l=varPos; t=fixPos; break;
		case "right": t=varPos; r=fixPos; break;
		case "bottom": l=varPos; b=fixPos; break;
		default: t=varPos; l=fixPos; break;
	}
	var s = this.popupNode.style;
		s.position = "absolute";
		s.left = l || "auto"; s.top = t || "auto"; s.right = r || "auto"; s.bottom = b || "auto";
};



function OSXBarPopupLabel(icon) {
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



function OSXBarPopupSubmenu(icon) {
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
	var contents = this.parentIcon.contents
	for(var i=0; i<contents.length; i++) this.popupNode.appendChild(contents[i]);
	
	this.parentIcon.parentBar.scalingLocked = true; // keep icons scaled when popup open
};
OSXBarPopupSubmenu.prototype.destroyBase = OSXBarPopupSubmenu.prototype.destroy;
OSXBarPopupSubmenu.prototype.destroy = function() {
	this.destroyBase();
	this.parentIcon.popupSubmenu = null;
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
