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

function ColorPicker(evt,position,tgtField) { //CONSTRUCTOR
	// Freaks out Mac IE: // if(!(this instanceof ColorPicker)) return new ColorPicker(evt,position,tgtField,dateRange);
	
	this.field = tgtField; //field for output
	
	this.create(evt);
	
	this.buildSwatches();

	this.setPosition(evt,position);
}

ColorPicker.prototype = new PopupObject("color-picker"); //inherit from base PopupObject class

//extend the prototype:

ColorPicker.prototype.buildSwatches = function() {
	var i, j, k;
	var columns = 18;
	var hex = ["0","3","6","9","C","F"];
	var colors = [];
	for(i=0; i<hex.length; i++) {
		for(j=0; j<hex.length; j++) {
			for(k=0; k<hex.length; k++) {
				colors[colors.length] = hex[i] + hex[i] + hex[j] + hex[j] + hex[k] + hex[k];
			}
		}
	}
	
	var thisRef = this;
	var table = document.createElement("table");
	for(i=0; i<colors.length; i+=columns) {
		var row = document.createElement("tr");
		for(j=i; j<i+columns; j++) {
			var cell = document.createElement("td");
			cell.style.backgroundColor = cell.color = colors[j];
			if(cell.color == this.field.value) cell.className = "color-picker-selected";
			cell.addEventListener("mouseover", function(evt){window.status = "#"+this.color;}, false);
			cell.addEventListener("click", function(evt){thisRef.field.value = this.color; thisRef.destroy();}, false);
			row.appendChild(cell);
		}
		table.appendChild(row);
	}
	this.popupNode.appendChild(table);
};







function onColorPickerDocLoaded() {
	//put button on each color field:
	var flds = document.getElementsByTagName("input");
	for(i=0; i<flds.length; i++) {
		var fld = flds[i];
		if(fld.className.match(/^(.*\s)?color(\s.*)?$/)) {
			//create icon:
			var img = document.createElement("img");
			img.src = "assets/colorpicker.png";
			img.className = "color-picker-button";
			fld.parentNode.insertBefore(img,fld.nextSibling);
			img.addEventListener("click", function(evt) {
				new ColorPicker(evt,"topleft",this.previousSibling,null);
			},false);
		}
	}
}
if(window.addEventListener) window.addEventListener("load",onColorPickerDocLoaded,false);
