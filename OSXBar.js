

/*

<ul class="OSX-bar">
	<li id="item-one">Label</li>
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

*/

var iconMinSize = 24;
var iconMaxSize = 48;
var iconSpacing = 12;

function OSXBar(elt) {
	this.create(elt);
}
OSXBar.prototype = {
	expanded : false,

	create : function(elt) {
		var i,j,k;
		this.icons = [];
		this.element = elt;

		// hookup the icons:
		var items = elt.childNodes;
		for(i=0; i<items.length; i++) { 
			if(items[i].nodeType == 1 && items[i].tagName.toLowerCase() == "li") {
				this.icons[this.icons.length] = new OSXBarIcon(items[i], this); //make <li>s into icons
			}
		}

		//hookup initial bar position, style:
		with(elt.style) {
			position = "absolute";
			left = (iconSpacing / 2) + "px";
			top = ((window.innerHeight || document.body.clientHeight) / 2 - this.icons.length * (iconMinSize + iconSpacing) / 2) + "px";
			height = (this.icons.length * (iconMinSize + iconSpacing)) + "px";
			width = (iconMinSize + iconSpacing) + "px";
			background = "#EEE";
			border = "1px solid #999";
			margin = "0"; padding = "0";
		}

		//hookup scaling with mouse position:
		var thisRef = this;
		document.addEventListener("mousemove", function(evt){thisRef.onMouseMoved(evt);}, false);
	},
	
	onMouseMoved : function(evt) {
		//reduce scaling to larger time intervals (makes smoother with fast mouse movement);
		var now = new Date();
		if(this.lastScaledTime && now - this.lastScaledTime < 100) return;
		this.lastScaledTime = now;
		
		if(evt.clientX > (iconMinSize + iconSpacing) * 2) this.onMouseOutsideRegion(evt);
		else this.onMouseInsideRegion(evt);
	},
	
	onMouseInsideRegion : function(evt) {
		// XXX - will eventually want this to move smoothly (several steps)
		//set all icons to scaled size and position:
		var iconHeight = 0; //keep track of icon heights
		for(var i=0; i<this.icons.length; i++) {
			 this.icons[i].onScale(evt);
			 iconHeight += parseFloat(this.icons[i].icon.style.height);
		}
		//set expanded bar height and position:
		with(this.element.style) {			
			height = (iconHeight + this.icons.length * iconSpacing) + "px";
			top = ((window.innerHeight || document.body.clientHeight) / 2 - parseFloat(this.element.style.height)/2) + "px";
		}
		this.expanded = true;
	},
	
	onMouseOutsideRegion : function(evt) {
		if(!this.expanded) return; //only once when exiting region
		// XXX - will eventually want this to move smoothly (several steps)
		//set all icons back to normal size and position:
		for(var i=0; i<this.icons.length; i++) this.icons[i].onUnscale(evt);
		//set back to normal bar height and position:
		with(this.element.style) {
			height = (this.icons.length * (iconMinSize + iconSpacing)) + "px";
			top = ((window.innerHeight || document.body.clientHeight) / 2 - this.icons.length * (iconMinSize + iconSpacing) / 2) + "px";
		}
		this.expanded = false;
	}
};





function OSXBarIcon(elt, bar) {
	this.instanceIndex = OSXBarIcon.instances.length;
	OSXBarIcon.instances[this.instanceIndex] = this;
	this.parentBar = bar;
	this.create(elt);
}
OSXBarIcon.prototype = {
	create : function(elt) {
		this.element = elt; //original <li>
		
		//hide original <li>:
		elt.style.display = "none";
		
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
		this.label = getFirstTextNode(this.element).nodeValue.replace(/^\s*(.*)\s*$/,"$1"); //strip leading and trailing space
		
		//create icon, set initial position:
		var icon = this.icon = document.createElement("img");
			//alert(elt.currentStyle.listStyleImage);
			icon.src = window.getComputedStyle(elt,null).getPropertyValue("list-style-image").replace(/^url\("?([^"]*)"?\)$/,"$1");
			icon.alt = this.label;
			with (icon.style) {
				position = "absolute";
				left = (iconSpacing / 2) + "px";
			}
			this.onUnscale();
			this.parentBar.element.appendChild(icon);
		
		var thisRef = this;
		icon.addEventListener("mouseover", function(evt){thisRef.onMouseOver(evt);}, false);
		icon.addEventListener("mouseout", function(evt){thisRef.onMouseOut(evt);}, false);

		//children pop up on click:
	},
		
	onMouseOver : function(evt) { //label pops up on hover:
		var labelNode = this.labelNode = document.createElement("div");
			labelNode.appendChild(document.createTextNode(this.label));
			with(labelNode.style) {
				position = "absolute";
				top = (parseFloat(this.icon.style.top) + parseFloat(this.icon.style.height)/3) + "px";
				left = (iconMaxSize + iconSpacing) + "px";
				// whiteSpace = "nowrap"; //should be in CSS
			}
		this.parentBar.element.appendChild(labelNode);
	},
	
	onMouseOut : function(evt) {
		if(this.labelNode) //this.parentBar.element.removeChild(this.labelNode); //remove icon label
			this.labelNode.parentNode.removeChild(this.labelNode);
	},
	
	onScale : function(evt) {	
		//set icon size:
		var mouseDist = evt.clientY - parseFloat(this.parentBar.element.style.top) - parseFloat(this.icon.style.top) - parseFloat(this.icon.style.height)/2;
		var newHeight = iconMaxSize - Math.abs(mouseDist)/4;
		if(newHeight < iconMinSize) newHeight = iconMinSize; //keep from going below minimum size
		this.icon.style.height = newHeight + "px";
		
		//set icon position:
		var iconAbove = OSXBarIcon.instances[this.instanceIndex-1];
		this.icon.style.top = ((iconAbove ? parseFloat(iconAbove.icon.style.top) + parseFloat(iconAbove.icon.style.height) + iconSpacing : iconSpacing / 2) ) + "px";
	},
	
	onUnscale : function(evt) {
		with(this.icon.style) {
			top = ((iconMinSize + iconSpacing) * this.instanceIndex + iconSpacing/2) + "px";
			height = iconMinSize + "px";
			width = "auto"; //I assume the icon will be roughly square.	
		}
	}
};
OSXBarIcon.instances = [];





function onOSXBarLoaded(evt) {
	var ULs = document.getElementsByTagName("ul");
	for(var i=0; i<ULs.length; i++) {
		if(ULs[i].className.match("OSX-bar")) new OSXBar(ULs[i]);
	}
}

window.addEventListener("load",onOSXBarLoaded,false);
