/*
**  OSXBar script by Jason Johnston (jj@lojjic.net) created July 2003.
**
**  This script creates a bar like the Mac OS X dock out of a 
**  nested unordered list (<ul>). For usage and other details see 
**  http://lojjic.net/script-library/OSXBar-doc.html
**
**  This work is licensed for use under the Creative Commons
**  Attribution-NonCommercial-ShareAlike license. In summary, you
**  may freely use, modify, and distribute this work as long as:
**    - You give me (Jason Johnston) credit,
**    - You do not use this work for commercial purposes, and
**    - Any redistribution of this or derivative works is made
**      available under a license identical to this one.
**  Before using this work please read the full license at 
**  http://creativecommons.org/licenses/by-nc-sa/1.0/legalcode
*/


function OSXBar(elt, edge, minSize, maxSize, spacing, reach) { //only elt is required; all others default to values below
	this.element = elt;
	this.setProperty("edge", edge); //one of "top", "right", "bottom", or "left". Defaults to "left".
	this.setProperty("iconMinSize", minSize); // smallest (initial) icon size (pixels).
	this.setProperty("iconMaxSize", maxSize); // largest size when scaled (pixels). For best quality, this should be the natural height of the icon image.
	this.setProperty("iconSpacing", spacing); // space between icons (pixels).
	this.setProperty("scaleReach", reach); // "gradualness" of the scaling - larger number gives smoother curve.
	this.create();
	OSXBar.instances[OSXBar.instances.length] = this;
}
OSXBar.prototype = {
	scaled : false,
	scalingLocked : false,
	pos : 0,

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
			case "iconMinSize": this[name] = parseInt(value) || 32; break; 
			case "iconMaxSize": this[name] = parseInt(value) || 64; break;
			case "iconSpacing": this[name] = parseInt(value) || 8;  break;
			case "scaleReach":  this[name] = parseInt(value) || 4;  break;
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
		for(var i=0; i<this.icons.length; i++) {
			this.icons[i].setSizeAndPosition(); //set all icons back to normal size and position (null event so scaling doesn't occur)
			if(this.icons[i].popupSubmenu) this.icons[i].popupSubmenu.hide(); //remove icon label
		}
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
		var toSide = (this.pos = edgeLen / 2 - lngth / 2 + (isVertical ? scrollY : scrollX)) + "px";
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
		for(j=0; (icon=this.icons[j]); j++) icon.destroy();
		this.icons = null;
		document.removeEventListener("mousemove", this.onMouseMovedHandler, false);
		window.removeEventListener("scroll", this.onScrollHandler, false);
	}
};
OSXBar.instances = [];
OSXBar.scriptSheetSelector = "ul.navigation, #navigation";





function OSXBarIcon(elt, bar) {
	bar.icons[this.instanceIndex = bar.icons.length] = this;	
	this.element = elt; //original <li>
	this.parentBar = bar; //parent OSXBar	
	this.create();
}
OSXBarIcon.prototype = {
	pos : 0,
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
		
		//create label and submenu:
		this.popupLabel = new OSXBarLabel(this);
		this.popupSubmenu = new OSXBarSubmenu(this);

		//create icon, set initial position:
		var liImg = document.defaultView.getComputedStyle(this.element,null).getPropertyValue("list-style-image") || OSXBar.defaultIcon;
		var icon = this.icon = document.createElement(liImg ? "img" : "span");
			icon.alt = this.label;
			icon.className = "osx-bar-icon";
			if(liImg && liImg != "none") {
				icon.src = liImg.replace(/^url\("?([^"]*)"?\)$/,"$1"); //get path out of "url(path)" string
				if(icon.src.match(/.png$/) && icon.runtimeStyle && navigator.userAgent.match(/MSIE (5\.5|[6789])/) && navigator.platform == "Win32") { //add IE alpha filter if PNG image, to enable alpha transparency:
					icon.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + icon.src + "', sizingMethod='scale')";
					icon.src = "http://www.microsoft.com/homepage/gif/1ptrans.gif?please_support_PNG_alpha_transparency"; //they make me do hacks like this, I use their bandwidth.
				}
			} else {
				icon.appendChild(document.createTextNode(this.label));
				icon.style.border = "1px dotted";
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
		if(!this.parentBar.scalingLocked) this.popupLabel.show();
		window.status = this.link || "Show Menu for " + this.label;
	},

	onMouseOut : function(evt) {
		if(!this.popupLabel.hidden) this.popupLabel.hide();
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
		
		this.popupLabel.hide();

		// if submenu, create popup:
		// XXX - only if has child nodes...
		this.popupSubmenu.show();
		this.parentBar.scalingLocked = true;
	},
	
	setSizeAndPosition : function(evt) {
		var bar = this.parentBar;
		var isVertical = (bar.edge=="left" || bar.edge=="right");
	
		//calculate icon size:
		var newSize = bar.iconMinSize;
		if(evt) {
			var scroll = isVertical ? (window.scrollY || document.body.scrollTop) : (window.scrollX || document.body.scrollLeft);
			var mousePos = isVertical ? evt.clientY : evt.clientX;
			var mouseDist = Math.abs(mousePos + scroll - bar.pos - this.pos - this.size/2) - this.size/2;
			if(mouseDist < 0) mouseDist = 0;
			newSize = bar.iconMaxSize - mouseDist / bar.scaleReach;
			if(newSize < bar.iconMinSize) newSize = bar.iconMinSize; //keep from going below minimum size
		}
		var prevIcon = bar.icons[this.instanceIndex-1];
		var newPos = prevIcon ? (prevIcon.pos + prevIcon.size + bar.iconSpacing) : (bar.iconSpacing / 2);
		if(evt && this.size == (newSize = Math.round(newSize)) && this.pos == (newPos = Math.round(newPos)) && !this.popupLabel) return; //if already in the right place, stop calculation
			
		var fixPos = (bar.iconSpacing / 2) + "px";
		var varPos = (this.pos = newPos) + "px";
		var size   = (this.size = newSize) + "px";
		var l,t,r,b,h,w,s,p,i;
		switch(bar.edge) {
			case "top": l=varPos; t=fixPos; break;
			case "right": t=varPos; r=fixPos; break;
			case "bottom": l=varPos; b=fixPos; break;
			default: t=varPos; l=fixPos; break;
		}
		s = this.icon.style;
			s.position = "absolute";
			s.left = l || "auto"; s.top = t || "auto"; s.right = r || "auto"; s.bottom = b || "auto";
			s.height = s.width = size;
		
		if(!this.popupLabel.hidden) this.popupLabel.setPosition(); //move label with icon
		if(!this.popupSubmenu.hidden) this.popupSubmenu.setPosition(); //move submenu with icon
	},
	
	destroy : function() {
		this.icon.parentNode.removeChild(this.icon);
		if(this.popupLabel) this.popupLabel.destroy();
		if(this.popupSubmenu) this.popupSubmenu.destroy();
		for(var i=0; (cont=this.contents[i]); i++) this.element.appendChild(cont);
		if(!this.link) this.labelNodeParent.insertBefore(this.labelNode,this.labelNodeParent.firstChild);
		this.labelNodeParent.style.display = this.element.style.display = "";
	}
};



function OSXBarPopup() {} //base class for OSXBarLabel and OSXBarSubmenu
OSXBarPopup.prototype = {
	create : function() {
		var p = this.popupNode = document.createElement("div");
		var b = document.getElementsByTagName("body").item(0);
		if(b) b.appendChild(p);
		this.hide();
		
		var thisRef = this;
		document.addEventListener("mousedown",this.docMousedownHandler=function(){thisRef.hide();},false);
		this.popupNode.addEventListener("mousedown",function(e){e.stopPropagation()},false);
	},
	setPosition : function() {
		var distFromIcon = 12; //distance of popup from its icon
		var icon = this.parentIcon;
		var bar = icon.parentBar;
		var scrollX = (window.scrollX || document.body.scrollLeft || 0);
		var scrollY = (window.scrollY || document.body.scrollTop  || 0);
		var isVertical = (bar.edge=="left" || bar.edge=="right");
		var isTopLeft  = (bar.edge=="left" || bar.edge=="top");
		var fixPos = (bar.iconMaxSize + bar.iconSpacing + distFromIcon + ((isVertical ? scrollX : scrollY) * (isTopLeft ? 1 : -1))) + "px";
		var varPos = (icon.pos + bar.pos) + "px";
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
	},
	hide : function() {
		this.popupNode.style.display = "none";
		this.hidden = true;
		this.parentIcon.parentBar.scalingLocked = false;
	},
	show : function() {
		this.setPosition();
		this.popupNode.style.display = "block";
		this.hidden = false;
	},
	destroy : function() {
		var b = document.getElementsByTagName("body").item(0);
		if(b && this.popupNode) b.removeChild(this.popupNode);
		document.removeEventListener("mousedown",this.docMousedownHandler,false);
	}
};



function OSXBarLabel(icon) {
	this.parentIcon = icon;
	this.create();
	this.addContent();
	this.setPosition();
}
OSXBarLabel.prototype = new OSXBarPopup();
OSXBarLabel.prototype.addContent = function() {
	this.popupNode.className = "osx-bar-popup-label";
	this.popupNode.appendChild(document.createTextNode(this.parentIcon.label)); // add label as content
};




function OSXBarSubmenu(icon) {
	this.parentIcon = icon;
	this.create();
	this.addContent();
	this.setPosition();
}
OSXBarSubmenu.prototype = new OSXBarPopup();
OSXBarSubmenu.prototype.addContent = function() {
	this.popupNode.className = "osx-bar-popup-submenu";

	// add popup label:
	var label = document.createElement("div");
		label.className = "osx-bar-popup-submenu-label";
		label.appendChild(document.createTextNode(this.parentIcon.label));
	this.popupNode.appendChild(label);
	
	// add <li> children to the popup:	
	var contents = this.parentIcon.contents;
	for(var i=0; i<contents.length; i++) {
		this.popupNode.appendChild(contents[i]);
		/*
		//create icon from list-style-image:
		var lis = contents[i].getElementsByTagName("li");
		for(var j=0; j<lis.length; j++) {
			var lnk = lis[j].firstChild;
			var li = (lnk.nodeName.toLowerCase()=="a") ? lnk : lis[j];
			var lsImg = window.getComputedStyle(lis[j],null).getPropertyValue("list-style-image");
			if(lsImg && lsImg.indexOf("url(") == 0) {
				lis[j].icon = document.createElement("img");
				lis[j].icon.src = lsImg.replace(/^url\("?([^"]*)"?\)$/,"$1");
				li.insertBefore(lis[j].icon, li.firstChild);
			}
			li.style.listStyleImage = "none";
		}
		*/
	}
};
