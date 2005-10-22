// Adding this file to a page will cause form fields with certain 
// classNames to be automatically formatted to that type.

//TO DO:
	// Make date transform go to a format specified using Date.toFormat() method

function hasClass(elt,cls) { //check if elt has cls as a className
	if(!elt.className) return false;
	return (elt.className.indexOf(cls)>=0);
}

function checkCharFamily(str,validChars) {  //checks that all chars in str are in validChars.
	for(var i=0;i<str.length;i++) if(validChars.indexOf(str.charAt(i))<0) return false;
	return true;
}

function parseDollars(num) {  //converts string to money format (#.##) - returns null if invalid
	var str=num.toString();
	if(!checkCharFamily(str,"0123456789.-")) return null;
	if(str.lastIndexOf("-")>0) return null; //only allow "-" as first char
	if(str=="" || str=="0") return "0.00"; //empty or 0 becomes 0.00

	//strip leading 0's:
	if(str.indexOf("-")==0) {
		while(str.charAt(1)=="0") str="-"+str.substring(2);
	} else {
		while(str.charAt(0)=="0") str=str.substring(1);
	}

	//str = Math.round(str * 100) / 100; //round to nearest 0.01

	var parts=str.split(".");
	if(parts.length==1) return str+".00"; // 4 -> 4.00
	if(parts.length>2) return null; // can't have >1 decimal.
	if(parts[0].length==0) parts[0]="0"; // .45 -> 0.45
	if(parts[1].length==0) parts[1]="00"; // 4. -> 4.00
	if(parts[1].length==1) parts[1]=parts[1]+"0"; // 4.5 -> 4.50
	if(parts[1].length>2) { //round to nearest 0.01
		var rounded = Math.round(("."+parts[1]) * 100);
		if(rounded < 10) rounded = "0" + rounded;
		parts[1] = rounded;
	}

	return parts.join("."); //put Humpty together again.
}

function parseTime(str) {  //converts string to time format (##:##xm), returns null if invalid
/* Required Transformations:
1015a -> 10:15am
101p -> 1:01pm
1p -> 1:00pm
01:01pm -> 1:01pm
a,A,am,AM,aM,Am -> am

(hour > 12 or hour < 1) -> error
(minutes > 59 or minutes < 0) -> error
a.m., a.m, etc. -> error
1015 (no am/pm) -> error
*/
	str=str.toLowerCase();
	var formatted = str;
	var alphaIdx = (str.indexOf("a")<0) ? str.indexOf("p") : str.indexOf("a");
	if(alphaIdx<0) return null;

	var parts = [str.substring(0,alphaIdx),str.substring(alphaIdx)];
	var hrs="";
	var mins="";

	//time check:
	var time=parts[0];
	if(time.indexOf(":")<0) { //if no colon
		if(!checkCharFamily(time,"0123456789") || time.length<1 || time.length>4) return null;
		if(time.length<=2) { //if only hours specified
			hrs = parseFloat(time);
			mins = "00";
		} else { //else if minutes too
			var minIdx = time.length - 2; //index of first minutes character (2 from end)
			hrs = parseFloat(time.substring(0,minIdx));
			mins = parseFloat(time.substring(minIdx));
		}
	} else { //else if colon
		var timeParts = time.split(":");
		if(timeParts.length!=2 || timeParts[0].length<1 || timeParts[0].length>2 || timeParts[1].length!=2 || !checkCharFamily(timeParts.join(""),"0123456789")) return null;
		hrs = parseFloat(timeParts[0]);
		mins = parseFloat(timeParts[1]);
	}
	if(hrs<1 || hrs>12) return null;
	if(mins<0 || mins>59) return null;
	if(mins.toString().length==1) mins = "0" + mins;
	formatted = hrs + ":" + mins;

	//am/pm check:
	var ap = parts[1];
	if(ap!="a" && ap!="am" && ap!="p" && ap!="pm") return null; //only allow these few formats
	formatted += (ap.indexOf("a")>=0) ? "am" : "pm"; //add am or pm to end of formatted string

	return formatted;
}


function parseDuration(str) {  //converts string to duration format (##:##), returns false if invalid
	var hrs="";
	var mins="";

	//time check:
	if(str.indexOf(":")<0) { //if no colon
		if(!checkCharFamily(str,"0123456789") || str.length<1 || str.length>4) return null;
		if(str.length<=2) { //if only hours specified
			hrs = parseFloat(str);
			mins = "00";
		} else { //else if minutes too
			var minIdx = str.length - 2; //index of first minutes character (2 from end)
			hrs = parseFloat(str.substring(0,minIdx));
			mins = parseFloat(str.substring(minIdx));
		}
	} else { //else if colon
		var timeParts = str.split(":");
		if(timeParts.length!=2 || timeParts[0].length<1 || timeParts[0].length>2 || timeParts[1].length!=2 || !checkCharFamily(timeParts.join(""),"0123456789")) return null;
		hrs = parseFloat(timeParts[0]);
		mins = parseFloat(timeParts[1]);
	}
	if(hrs<0 || hrs>23) return null; //23:59 largest allowed duration
	if(mins<0 || mins>59) return null;
	if(mins.toString().length==1) mins = "0" + mins;

	return hrs + ":" + mins;
}





function onAutoFormatCurrencyFieldChanged(evt) {
	var fld=evt.currentTarget;
	if(fld.value=="") return; //don't check if empty
	var money = parseDollars(fld.value);
	if(money) {
		fld.value = money;
	} else {
		evt.stopPropagation(); evt.preventDefault();
		alert("Please enter a valid monetary value.");
		setTimeout(function(){ fld.focus(); fld.select(); },0); //wait to focus until after tabbing to next field
	}
}

function onAutoFormatTimeFieldChanged(evt) {
	var fld = evt.currentTarget;
	if(fld.value=="") return; //don't check if empty
	var time = parseTime(fld.value);
	if(time) {
		fld.value = time;
	} else {
		alert("Please enter a valid time in proper format.")
		setTimeout(function(){ fld.focus(); fld.select(); },0); //wait to focus until after tabbing to next field
	}
}

function onAutoFormatPhoneFieldChanged(evt) {  //auto-formats ########## to ###-###-####
	var fld = evt.currentTarget;
	var str = fld.value;
	if(str.length==10 && checkCharFamily(str,"0123456789")) {
		var parts=[str.substring(0,3),str.substring(3,6),str.substring(6)];
		str = parts.join("-");
	}
	fld.value = str;
}

function onAutoFormatDateFieldChanged(evt) {
	var fld = evt.currentTarget;
	var str = fld.value;
	if(str.length == 6 && checkCharFamily(str,"0123456789")) {
		var parts=[str.substring(0,2),str.substring(2,4),str.substring(4)];
		str = parts.join("/");
	}
	fld.value = str;
}


function onAutoFormatFieldChanged(evt) {
	//perform actions depending on specific type of field:
	if(hasClass(this,"money")) onAutoFormatCurrencyFieldChanged(evt);
	if(hasClass(this,"phone")) onAutoFormatPhoneFieldChanged(evt);
	if(hasClass(this,"time")) onAutoFormatTimeFieldChanged(evt);
	if(hasClass(this,"date")) onAutoFormatDateFieldChanged(evt);
}


function onAutoFormatDocLoaded() { //initializes all listeners and default states on forms, according to class names
	var inputs = document.getElementsByTagName("input");
	for(var i=0;i<inputs.length;i++) {
		inputs[i].addEventListener("change",onAutoFormatFieldChanged,false);
	}
}

//set it all off on load:
if(window.addEventListener) window.addEventListener("load",onAutoFormatDocLoaded,false);