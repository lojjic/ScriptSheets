/*
**  ColorPicker script by Jason Johnston (jj@lojjic.net)
**  Created July 2002.  Use freely, but give me credit.
**
**  Use this script to create a popup calendar widget
**  for picking a date. If a text field is specified, the
**  chosen date will be put in that field.
*/

/*
TODO:

*/


function ColorPicker(elt) {
	this.element = elt;
	this.create();
	ColorPicker.instances[ColorPicker.instances.length] = this;
}
ColorPicker.prototype = {
	create : function() {
		var fld = this.element;
		//create icon:
		var btn = this.button = document.createElement("img");
		btn.src = "assets/colorpicker.png";
		btn.className = "color-picker-button";
		fld.parentNode.insertBefore(btn, fld.nextSibling);
		btn.addEventListener("click", function(evt) {
			new ColorPickerPopup(evt,"topleft",this.previousSibling);
		}, false);
	},
	destroy : function() {
		this.button.parentNode.removeChild(this.button);
	}
};
ColorPicker.instances = [];
ColorPicker.enableScriptSheet = function() {
	ColorPicker.disableScriptSheet(); //prevent double-enabling
	var flds = document.getElementsByTagName("input");
	for(var i=0; i<flds.length; i++) {
		if(flds[i].type=="text" && flds[i].className.match(/\bcolor\b/)) {
			new ColorPicker(flds[i]);
		}
	}
};
ColorPicker.disableScriptSheet = function() {
	var i, inst;
	for(i=0; (inst=ColorPicker.instances[i]); i++) {
		inst.destroy();
	}
	ColorPicker.instances = [];
};





// The Popup Widget:
function ColorPickerPopup(evt,position,tgtField) {
	// Freaks out Mac IE: // if(!(this instanceof ColorPickerPopup)) return new ColorPickerPopup(evt,position,tgtField);	
	this.field = tgtField; //field for output
	this.create(evt);
	this.buildSwatches();
	this.setPosition(evt,position);
}
ColorPickerPopup.prototype = new PopupObject("color-picker"); //inherit from base PopupObject class
//extend the prototype:
ColorPickerPopup.prototype.buildSwatches = function() {
	var i, j, k, table, tbody, row;
	var columns = 18;
	
	//Build list of colors:
	var hex = ["0","3","6","9","C","F"];
	var colors = [];
	for(i=0; i<hex.length; i++) {
		for(j=0; j<hex.length; j++) {
			for(k=0; k<hex.length; k++) {
				colors[colors.length] = hex[i] + hex[i] + hex[j] + hex[j] + hex[k] + hex[k];
			}
		}
	}
	
	//Build color table:
	table = document.createElement("table");
	tbody = document.createElement("tbody");
	for(i=0; i<colors.length; i+=columns) {
		row = document.createElement("tr");
		for(j=i; j<i+columns; j++) {
			var swatch = new ColorPickerSwatch(colors[j],this);
			swatch.appendTo(row);
		}
		tbody.appendChild(row);
	}
	table.appendChild(tbody);
	this.popupNode.appendChild(table);
};


//A single swatch:
function ColorPickerSwatch(color, picker) {
	this.color = color;
	this.picker = picker;
	this.create();
}
ColorPickerSwatch.prototype = {
	create : function() {
		var thisRef = this;
		var cell = this.cell = document.createElement("td");
		cell.title = "#" + (cell.style.backgroundColor = this.color);
		if(this.color==this.picker.field.value) cell.className = "color-picker-selected";
		cell.addEventListener("click", function(evt){thisRef.onClick(evt);}, false);
		if(typeof TitleTip == "function") new TitleTip(cell);
	},
	onClick : function(evt) {
		this.picker.field.value = this.color; 
		this.picker.destroy();
	},
	appendTo : function(elt) {
		elt.appendChild(this.cell);
	}
};
