// Formats a Date into the specified format.
//
// Example: new Date().toFormat("MM/DD/YYYY") returns 04/09/2002

Date.prototype.toFormat = function(formStr) {
	var out = "";
	var parts = [];
	for(var c=0; c<formStr.length; c++) { //split into parts:
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


//XXX - this is a bit ugly and inconsistent; consider rethinking it.
Date.prototype.fromFormat = function(formStr, dateStr) {
	var formParts = [];
	var dateParts = [];
	if(formStr.length != dateStr.length) return; //strings must match length
	
	for(var c=0; c<formStr.length; c++) {
		var formCh = formStr.charAt(c);
		var dateCh = dateStr.charAt(c);
		
		//check that date string matches format string:
		if(formCh.match(/[YMDhms]/)) {
			if(!dateCh.match(/\d/)) return;
		} else if(dateCh != formCh) return;
		
		
		//split into parts:
		if(formCh != formStr.charAt(c-1) || c==0) {
			formParts[formParts.length] = formCh;
			dateParts[dateParts.length] = dateCh;
		}
		else {
			formParts[formParts.length - 1] += formCh;
			dateParts[dateParts.length - 1] += dateCh;
		}
	}

	//step through characters, inserting correct values for M, D, and Y:
	for(var i=0; i<formParts.length; i++) {
		var first = formParts[i].charAt(0); //first character in group
		var len = formParts[i].length;
		if(first=="M") this.setMonth(parseFloat(dateParts[i])-1);
		else if(first=="D") this.setDate(parseFloat(dateParts[i]));
		else if(first=="Y") {
			var yr = parseFloat(dateParts[i]);
			if(len==2) yr += (yr<50)?2000:1900;
			this.setFullYear(yr);
		}
		else if(first=="h") this.setHours(parseFloat(dateParts[i]));
		else if(first=="m") this.setMinutes(parseFloat(dateParts[i]));
		else if(first=="s") this.setSeconds(parseFloat(dateParts[i]));
	}
	
	return this;
}