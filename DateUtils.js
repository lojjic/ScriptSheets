// Formats a Date into the specified format.
//
// Example: new Date().toFormat("MM/DD/YYYY") returns 04/09/2002

Date.prototype.toFormat = function(formStr) {
	var out = "";
	var parts = [];
	for(var c=0; c<formStr.length; c++) {
		var ch = formStr.charAt(c);
		if(ch != formStr.charAt(c-1) || c==0) parts[parts.length] = ch;
		else parts[parts.length - 1] += ch;
	}

	function fillIn(str,chars,crop) {
		if(typeof str != "string") str = str.toString();
		var diff = chars - str.length;
		if(diff > 0) for(var i=0; i<diff; i++) str = "0"+str;
		else if(crop) return str.substring(str.length - chars);
		return str;
	}

	//step through characters, inserting correct values for M, D, and Y:
	for(var i=0; i<parts.length; i++) {
		var first = parts[i].charAt(0); //first character in group
		var len = parts[i].length;
		if(first=="M") out += fillIn(this.getMonth()+1, len);
		else if(first=="D") out += fillIn(this.getDate(), len);
		else if(first=="Y") out += fillIn(this.getFullYear(), len, true);
		else if(first=="h") out += fillIn(this.getHours(), len);
		else if(first=="m") out += fillIn(this.getMinutes(), len);
		else if(first=="s") out += fillIn(this.getSeconds(), len);
		else out += parts[i];
	}
	return out;
}