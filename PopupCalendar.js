/*
**  PopupCalendar script by Jason Johnston (jj@lojjic.net)
**  Created July 2002.  Use freely, but give me credit.
**
**  Use this script to create a popup calendar widget
**  for picking a date. If a text field is specified, the
**  chosen date will be put in that field.
*/

/*
TODO:
  - Modify to use Date.toFormat() functionality to automatically adapt to format
  - Pull CSS into this file, or some other way of easily packaging style
  - Make prev/next month buttons have content (currently empty elements with CSS background-image)
*/

function PopupCalendar(evt,position,tgtField,dateRange) { //CONSTRUCTOR
	// Freaks out Mac IE: // if(!(this instanceof PopupCalendar)) return new PopupCalendar(evt,position,tgtField,dateRange);
	
	this.curDate = new Date;
	this.actualDate = new Date;
	this.tgtField=tgtField; //field for output
	this.create(evt);

	if(dateRange && this.parseDateRange) this.parseDateRange(dateRange); //init active range of dates
	if(tgtField && this.parseFieldValue) this.parseFieldValue(); //if value in field, init calendar to that date
	this.buildHead(); //create main framework
	this.buildDates(); //populate tbody with dates

	this.setPosition(evt,position);
}

PopupCalendar.prototype = new PopupObject("popup-calendar"); //inherit from base PopupObject class

//extend the prototype:
PopupCalendar.prototype.buildHead = function() {
	var d=document;
	var thisRef = this;

	this.head=d.createElement("div");
	this.head.className="calendar-head";

		this.prevArrow=d.createElement("div");
		this.prevArrow.setAttribute("title","Previous Month");
		this.prevArrow.className="calendar-prev-arrow";
		this.prevArrow.addEventListener("click",function(){thisRef.changeMonth(-1)},false);

		this.nextArrow=d.createElement("div");
		this.nextArrow.setAttribute("title","Next Month");
		this.nextArrow.className="calendar-next-arrow";
		this.nextArrow.addEventListener("click",function(){thisRef.changeMonth(1)},false);

		this.monthName=d.createTextNode("...");

	this.head.appendChild(this.prevArrow);
	this.head.appendChild(this.nextArrow);
	this.head.appendChild(this.monthName);

	this.table=d.createElement("table");

		this.thead=d.createElement("thead");
			this.theadRow=d.createElement("tr");
			var daysOfWeek=new Array("Su","Mo","Tu","We","Th","Fr","Sa");
			for(var i=0;i<7;i++) {
				var cell=d.createElement("th");
				var txt=d.createTextNode(daysOfWeek[i]);
				cell.appendChild(txt);
				this.theadRow.appendChild(cell);
			}
		this.thead.appendChild(this.theadRow);
		this.tbody=d.createElement("tbody");

	this.table.appendChild(this.thead);
	this.table.appendChild(this.tbody);

	this.popupNode.appendChild(this.head);
	this.popupNode.appendChild(this.table);

};


PopupCalendar.prototype.buildDates = function() {
	var d=document;
	var thisRef = this;
	var monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
	var curYear=this.curDate.getFullYear();
	var curMonth=this.curDate.getMonth();
	var febDays=((curYear % 4 == 0 && curYear % 100 != 0) || curYear % 400 == 0)?29:28;
	this.daysInMonth=[31,febDays,31,30,31,30,31,31,30,31,30,31];

	this.monthName.nodeValue=monthNames[curMonth] + " " + curYear;

	this.curDate.setDate(1);
	var date=this.curDate.getDate();
	while(date <= this.daysInMonth[curMonth]) {
		var row=d.createElement("tr");

		for(var i=0;i<7;i++) {
			var cell=d.createElement("td");
			cell.className="calendar-date";

			if(this.curDate.getDay()==i && date <= this.daysInMonth[curMonth]) {
				cell.addEventListener("mouseover",thisRef.mouseOverDate,false);
				cell.addEventListener("mouseout",thisRef.mouseOutDate,false);
				cell.addEventListener("click",this.dateClickHandler=function(evt){thisRef.chooseDate(evt)},false);
				cell.dateString=this.curDate.getDateString();

				if(this.compareDateRange) this.compareDateRange(cell); //check if date within specified range
				if(this.compareFieldDate) this.compareFieldDate(cell); //check if date is same as that in field

				//today cell:
				if(cell.dateString == this.actualDate.getDateString()) {
					cell.isToday=true;
					cell.className+=" calendar-date-today";
				}

				var txt=d.createTextNode((date<10)?"0"+date:date);
				cell.appendChild(txt);
				date++;
				this.curDate.setDate(date);
			}
			row.appendChild(cell);
		}
		this.tbody.appendChild(row);
	}
	this.curDate.setMonth(curMonth);
	this.curDate.setYear(curYear);
};

PopupCalendar.prototype.destroyDates = function() {
	while(this.tbody.firstChild) this.tbody.removeChild(this.tbody.firstChild);
};


/*===Remove following 2 methods if don't need to init to field value===*/
PopupCalendar.prototype.parseFieldValue = function() {
	if(!this.tgtField) return; //only run if field associated
	var fieldVal = this.tgtField.value;
	var parts = fieldVal.split("/");

	//check format:
	if(parts.length!=3 || parts[0].length!=2 || parts[1].length!=2 || parts[2].length!=4) return;
	var joined = parts.join("");
	for(var i=0;i<joined.length;i++) if(("0123456789").indexOf(joined.charAt(i))<0) return; //only numerals

	//set initial view to month of current field value:
	var year = parseFloat(parts[2]);
	this.curDate.setYear(year);
	this.curDate.setMonth(parseFloat(parts[0]) - 1);

	this.fieldDateString = "" + year + parts[0] + parts[1];
};
PopupCalendar.prototype.compareFieldDate = function(cell) {
	if(!this.fieldDateString) return;
	if(this.fieldDateString == cell.dateString) {
		cell.className+=" calendar-date-current";
	}
};
/*===End field parsing/comparison===*/


/*===Remove following 2 methods if don't need date ranges===*/
PopupCalendar.prototype.parseDateRange = function(str) {
	var strs=str.split("-");
	if(strs.length!=2) return;
	this.dateRangeFrom=strs[0];
	this.dateRangeTo=strs[1];

	//figure out which is closer to current date:
	var actDateStr = this.actualDate.getDateString();
	var diffToStart = Math.abs(strs[0] - actDateStr);
	var diffToEnd = Math.abs(strs[1] - actDateStr);
	var initDate = (diffToEnd > diffToStart) ? strs[0] : strs[1];

	//set initial month to closer end of range:
	this.curDate.setYear(parseFloat(initDate.substring(0,4)));
	this.curDate.setMonth(parseFloat(initDate.substring(4,6))-1);
};
PopupCalendar.prototype.compareDateRange = function(cell) {
	if(!this.dateRangeFrom || !this.dateRangeTo) return;
	var cur = cell.dateString;
	var from = this.dateRangeFrom;
	var to = this.dateRangeTo;

	if(from <= cur && cur <= to) {
		cell.className+=" in-range";
		var day = cur.substring(6,8);
		if(from==cur || day=="01") cell.className+=" start-range";
		if(to==cur || day==this.daysInMonth[this.curDate.getMonth()]) cell.className+=" end-range";
	}
	else { //if not in range, make inactive
		cell.removeEventListener("mouseover",this.dateOverHandler,false);
		cell.removeEventListener("mouseout",this.dateOutHandler,false);
		cell.removeEventListener("click",this.dateClickHandler,false);
	}
};
/*===End date range methods===*/


PopupCalendar.prototype.changeMonth = function(offset) {
	this.destroyDates();
	this.curDate.setMonth(this.curDate.getMonth() + offset);
	this.buildDates();
};

//Script the hover effect pending hierarchical CSS :hover:
PopupCalendar.prototype.mouseOverDate = function(evt) {
	this.origClass=this.className;
	this.className=this.className+" hover";
};
PopupCalendar.prototype.mouseOutDate = function(evt) {
	this.className=this.origClass;
};

PopupCalendar.prototype.chooseDate = function(evt) { //output date to field
	var cell=evt.currentTarget;
	var str=cell.dateString;
	if(this.tgtField && !this.tgtField.disabled && !this.tgtField.readonly) {
		var dateParts=[str.substring(4,6),str.substring(6,8),str.substring(0,4)];
		this.tgtField.value = dateParts.join("/");

		//force onchange event on field:
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent("change",true,true);
		this.tgtField.dispatchEvent(evt);
	}
	this.destroy();
};

Date.prototype.getDateString = function() {
	var year=this.getFullYear();
	var month=this.getMonth()+1;
	if(month<10) month="0"+month;
	var day=this.getDate();
	if(day<10) day="0"+day;
	return ("" + year + month + day);
}






function onPopupCalendarDocLoaded() {
	//put calendar icons on each date field:
	var flds = document.getElementsByTagName("input");
	for(i=0; i<flds.length; i++) {
		var fld = flds[i];
		if(fld.className.indexOf("date")!=-1) {
			//create icon:
			var img = document.createElement("img");
			img.src = "assets/calendar.gif";
			img.className = "calendar-button";
			fld.parentNode.insertBefore(img,fld.nextSibling);
			img.addEventListener("click", function(evt) {
				new PopupCalendar(evt,"topleft",this.previousSibling,null);
			},false);
		}
	}
}
if(window.addEventListener) window.addEventListener("load",onPopupCalendarDocLoaded,false);
