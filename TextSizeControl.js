/*

TODO:
	* Allow some sort of placeholder element in document (className, etc.) for control to be automatically inserted on load
	* Better error reporting, esp. for DOM insertion methods
	* Make min/max/increment size parameters to the constructor?
	* Allow creating of object instance and/or setting of size before document is fully loaded, to avoid reflow
	* Allow multiple instances of control that don't step on each others' toes
	* Fix IE so that the initial getTextSize() returns a pixel value instead of 1em

*/

function TextSizeControl() {
	this.defaultSize = 12;
	this.minSize = 8;
	this.maxSize = 24;
	this.create();
	var i = TextSizeControl.instances;
	i[i.length] = this;
}
TextSizeControl.prototype = {
	create : function() {
		var thisRef = this;
		var elt = this.element = document.createElement("span"); //inline container
			elt.className = "text-size-control";
		
		//get initial text size:
		var size = this.defaultSize;
		if(window.Cookie) {
			var cook = new Cookie("fontSize").getValue();
			if(cook) size = cook;
		}
		
		//create text field:
		var txtFld = this.textField = document.createElement("input");
			txtFld.size = 2;
			txtFld.value = size;
			txtFld.onInput = function(evt){
				if(evt.type=="keypress" && evt.keyCode != 13) return; //skip if any key other than enter
				thisRef.setTextSize(this.value);
			}
			txtFld.addEventListener("change", txtFld.onInput, false);
			txtFld.addEventListener("keypress", txtFld.onInput, false);
		
		//create buttons:
		var decBtn = this.decreaseButton = document.createElement("button");
			decBtn.className = "text-size-decrease";
			decBtn.title = "Decrease Text Size";
			decBtn.appendChild(document.createTextNode("-"));
			decBtn.addEventListener("click", function(){thisRef.adjustTextSizeBy(-1);}, false);
		var incBtn = this.increaseButton = document.createElement("button");
			incBtn.className = "text-size-increase";
			incBtn.title = "Increase Text Size";
			incBtn.appendChild(document.createTextNode("+"));
			incBtn.addEventListener("click", function(){thisRef.adjustTextSizeBy(1);}, false);
			
		elt.appendChild(decBtn);
		elt.appendChild(txtFld);
		elt.appendChild(incBtn);
		
		this.setTextSize(size);
	},
	
	// Get/set text size:
	adjustTextSizeBy : function(offset) {
		if(!offset || !(offset = parseFloat(offset))) return;
		this.setTextSize(this.getTextSize() + offset);
	},
	getTextSize : function() {
		var size = getComputedStyle(document.body,null).getPropertyValue("font-size");
		return parseFloat(size) || this.defaultSize; //fallback to something reasonable
	},
	setTextSize : function(size) {
		if(!size || !(size = parseFloat(size))) return;
		if(size < this.minSize) size = this.minSize;
		if(size > this.maxSize) size = this.maxSize;
		
		// set style:
		var bod = document.body;
		document.body.style.fontSize = size + "px";
		
		// set state of UI controls, in all instances:
		var i, inst;
		for(var i=0; (inst=TextSizeControl.instances[i]); i++) {
			inst.textField.value = size;
			inst.decreaseButton.disabled = (size == inst.minSize);
			inst.increaseButton.disabled = (size == inst.maxSize);
		}
		
		// force refresh:
		document.documentElement.replaceChild(bod, bod);
		
		if(window.Cookie) {
			var cookie = new Cookie("fontSize");
			cookie.setPath("/");
			cookie.setValue(size);
			cookie.setLifespan(60*60*24*365);
		}
	},
	// methods for inserting in DOM:
	appendTo : function(elt) {
		elt.appendChild(this.element);
	},
	insertBefore : function(node) {
		node.parentNode.insertBefore(this.element, node);
	}
};
TextSizeControl.instances = [];

// Write CSS directly to document before final load, to avoid repaint:
var defaultFontSize = null;
if(window.Cookie) defaultFontSize = new Cookie("fontSize").getValue();
document.documentElement.style.fontSize = (defaultFontSize || 12) + 'px';

