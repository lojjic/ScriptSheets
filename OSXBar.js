/*
**  OSXBar script by Jason Johnston (jj@lojjic.net)
**  Created July 2003.  Use freely, but give me credit.
**
**  This script creates a bar like the Mac OSX dock
**  out of a nested unordered list (<ul>).  For usage
**  and other details see OSXBar-doc.html.
*/


function OSXBar(elt, edge, minSize, maxSize, spacing, reach) { //only elt is required; all others default to values below
	this.element = elt;
	this.setProperty("edge",edge); //one of "top", "right", "bottom", or "left". Defaults to "left".
	this.setProperty("iconMinSize",minSize); // smallest (initial) icon size (pixels).
	this.setProperty("iconMaxSize",maxSize); // largest size when scaled (pixels). For best quality, this should be the natural height of the icon image.
	this.setProperty("iconSpacing",spacing); // space between icons (pixels).
	this.setProperty("scaleReach",reach); // "gradualness" of the scaling - larger number gives smoother curve.
	this.create();
	OSXBar.instances[OSXBar.instances.length] = this;
}
OSXBar.prototype = {
	scaled : false,
	scalingLocked : false,

	create : function() {
		var i,j,k;
		var elt = this.element;
		elt.className += " osx-bar";

		//make <li>s into icons:
		this.icons = [];
		var items = elt.childNodes;
		for(i=0; i<items.length; i++) if(items[i].nodeType == 1 && items[i].tagName.toLowerCase() == "li") new OSXBarIcon(items[i], this);

		this.setSizeAndPosition();
		
		//hookup scaling with mouse position:
		var thisRef = this;
		document.addEventListener("mousemove", this.onMouseMovedHandler=function(evt){thisRef.onMouseMoved(evt);}, false);
		window.addEventListener("scroll", this.onScrollHandler=function(evt){thisRef.setSizeAndPosition();}, false);
	},
	
	setProperty : function(name,value) { // method to set properties - set defaults in here.
		switch(name) {
			case "edge": this.edge = (value && value.match(/^(top|right|bottom|left)$/)) ? value : "left"; break;
			case "iconMinSize": this.iconMinSize = parseInt(value) || 24; break; 
			case "iconMaxSize": this.iconMaxSize = parseInt(value) || 48; break;
			case "iconSpacing": this.iconSpacing = parseInt(value) || 12; break;
			case "scaleReach":  this.scaleReach  = parseInt(value) || 7;  break;
		}
		if(this.icons) this.onUnscale();
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
		for(var i=0; i<this.icons.length; i++) this.icons[i].setSizeAndPosition(); //set all icons back to normal size and position (null event so scaling doesn't occur)
		this.setSizeAndPosition(); //set bar to normal length and position
	},
	
	setSizeAndPosition : function() {
		var isVertical = (this.edge=="left" || this.edge=="right");
		var isTopLeft  = (this.edge=="left" || this.edge=="top");
		
		//find total size of all icons:
		var iconLength = 0;
		for(var i=0; i<this.icons.length; i++) iconLength += this.icons[i].size;
		
		var edgeLen = isVertical ? (window.innerHeight || document.body.clientHeight) : (window.innerWidth || document.body.clientWidth); //width or height of window
		var scrollX = (window.scrollX || document.body.scrollLeft || 0);
		var scrollY = (window.scrollY || document.body.scrollTop  || 0);
		var lngth  = iconLength + this.icons.length * this.iconSpacing;
		var girth  = this.iconMinSize + this.iconSpacing;
		var toSide = (this.position = edgeLen / 2 - lngth / 2 + (isVertical ? scrollY : scrollX)) + "px";
		var toEdge = (this.iconSpacing / 2 + ((isVertical ? scrollX : scrollY) * (isTopLeft ? 1 : -1))) + "px";
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
	},
	
	destroy : function() {
		var j, k, icon, cont;
		this.element.className = this.element.className.replace(/\s*osx-bar\s*/g,""); //reset CSS class
		s = this.element.style; s.position = s.left = s.top = s.right = s.bottom = s.height = s.width = ""; //reset inline styles
		for(j=0; (icon=this.icons[j]); j++) {
			this.element.removeChild(icon.icon);
			for(k=0; (cont=icon.contents[k]); k++) icon.element.appendChild(cont);
			icon.labelNodeParent.insertBefore(icon.labelNode,icon.labelNodeParent.firstChild);
			icon.labelNodeParent.style.display = icon.element.style.display = "";
		}
		this.icons = null;
		document.removeEventListener("mousemove", this.onMouseMovedHandler, false);
		window.removeEventListener("scroll", this.onScrollHandler, false);
	}
};
OSXBar.instances = [];
OSXBar.enableScriptSheet = function() {
	var i, ul;
	for(i=0; (ul = document.getElementsByTagName("ul")[i]); i++) {
		if(ul.className.match(/\s*navigation\s*/)) new OSXBar(ul);
	}
}
OSXBar.disableScriptSheet = function() {
	var i, bar;
	for(i=0; (bar=OSXBar.instances[i]); i++) {
		bar.destroy();
	}
	OSXBar.instances = []; //clear list
}





function OSXBarIcon(elt, bar) {
	bar.icons[this.instanceIndex = bar.icons.length] = this;	
	this.element = elt; //original <li>
	this.parentBar = bar; //parent OSXBar	
	this.create();
}
OSXBarIcon.prototype = {
	create : function() {
		//get label (first text node):
		function getFirstTextNode(inNode) {
			if(!inNode) return false; //exit if node not defined
			if(inNode.nodeType == 3) return inNode; //text node! - return the text node
			if(inNode.nodeType == 1) //element - recurse into children, then following siblings
				return getFirstTextNode(inNode.firstChild) || getFirstTextNode(inNode.nextSibling) || false;
			return false;
		}
		this.labelNode = getFirstTextNode(this.element);
		this.labelNodeParent = this.labelNode.parentNode;
		this.label = this.labelNode.nodeValue.replace(/^\s*(.*)\s*$/,"$1"); //strip leading and trailing space
		if(this.labelNodeParent.tagName.toLowerCase() == "a") this.link = this.labelNodeParent.href; //remember label link
		if(this.link) this.labelNodeParent.style.display="none";
		else this.labelNodeParent.removeChild(this.labelNode);
		
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
			var scroll = isVertical ? (window.scrollY || document.body.scrollTop) : (window.scrollX || document.body.scrollLeft);
			var mousePos = isVertical ? evt.clientY : evt.clientX;
			var mouseDist = Math.abs(mousePos + scroll - bar.position - this.position - this.size/2) - this.size/2;
			if(mouseDist < 0) mouseDist = 0;
			newSize = bar.iconMaxSize - mouseDist / bar.scaleReach;
			if(newSize < bar.iconMinSize) newSize = bar.iconMinSize; //keep from going below minimum size
		}
		var prevIcon = bar.icons[this.instanceIndex-1];
		var newPos = prevIcon ? (prevIcon.position + prevIcon.size + bar.iconSpacing) : (bar.iconSpacing / 2);
		if(evt && this.size == (newSize = Math.round(newSize)) && this.position == (newPos = Math.round(newPos)) && !this.popupLabel) return; //if already in the right place, stop calculation
			
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
	var scrollX = (window.scrollX || document.body.scrollLeft || 0);
	var scrollY = (window.scrollY || document.body.scrollTop  || 0);
	var isVertical = (bar.edge=="left" || bar.edge=="right");
	var isTopLeft  = (bar.edge=="left" || bar.edge=="top");
	var fixPos = (bar.iconMaxSize + bar.iconSpacing + distFromIcon + ((isVertical ? scrollX : scrollY) * (isTopLeft ? 1 : -1))) + "px";
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
};
