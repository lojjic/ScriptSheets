/*
TODO:
	* Make date-sort more flexible; use changeable "MM/DD/YYYY" string var to specify format in column
*/

function SortableTableColumn(elt) { //elt is <th> within <thead>
	this.element = elt;
	this.create();
	SortableTableColumn.instances[SortableTableColumn.instances.length] = this;
}
SortableTableColumn.prototype = {
	create : function() {
		var thisRef = this;
		this.element.addEventListener("click", this.clickHandler=function(evt){thisRef.onClick(evt);}, false);
		
		//disable selection of header text:
		//this.element.addEventListener("selectstart", this.selectHandler=function(evt){evt.preventDefault();}, false); //IE
		//this.element.style.MozUserSelect = "none"; //Moz
	},
	onClick : function() {
		var beginSort=new Date(); //for testing total time
		var thElt = this.element;

		function stripWhitespaceNodes(parentElt) {  //strips non-element nodes from between elements
			var elts=parentElt.childNodes;
			for(var i=0;i<elts.length;i++) {
				if(elts[i].nodeType!=1) {
					parentElt.removeChild(elts[i]);
					i--; //child is gone, so length is one less
				}
			}
			parentElt._textNodesStripped=true;
		}

		function getElementIndex(elt) {  //returns the index placement of an element in its parentNode.
			var place=0;
			while(elt.previousSibling) {
				elt=elt.previousSibling;
				if(elt.nodeType==1) {
					if(elt.getAttribute("colspan")) place=place + parseInt(elt.getAttribute("colspan"));
					else place++;
				}
			}
			return place;
		}

		//get following tbody:
		var tbody=thElt.parentNode.parentNode;
		while((!tbody.localName || tbody.localName.toLowerCase()!="tbody") && tbody.nextSibling) tbody=tbody.nextSibling;
		var table=tbody.parentNode;

		//don't allow clicking to build up:
		window.addEventListener("click",SortableTableColumn._cancelEvent,true);

		//remove sort status from previous column
		var prev=table._sortColumnHeader;
		if(prev && prev!=thElt) {
			prev.className=prev.origClass || "";
			prev.sortDir=(prev.sortDir=='up')?'down':'up';
		}
		table._sortColumnHeader=thElt;

		//set sort direction:
		thElt.sortDir=(thElt.sortDir=='up')?'down':'up';
		if(thElt.origClass) thElt.className=thElt.origClass;
		else thElt.origClass=thElt.className || " ";
		thElt.className+=" sortable-table-column-sorted-"+thElt.sortDir;

		var columnNum=getElementIndex(thElt);

		//remove whitespace between rows:
		if(!tbody._textNodesStripped) stripWhitespaceNodes(tbody);

		//sort rows within array:
		var allRows=tbody.childNodes;
		var sortCells=[];
		for(var i=0;i<allRows.length;i++) {
			//remove whitespace between cells:
			if(!allRows[i]._textNodesStripped) stripWhitespaceNodes(allRows[i]);

			var thisCell=allRows[i].childNodes[columnNum];
			if (!thisCell.row) thisCell.row=allRows[i]; //cache row as prop of text node (perf)
			if (!thisCell.val) {
				var txtNode=thisCell;
				while(txtNode.firstChild) txtNode=txtNode.firstChild; //get deepest firstChild node
				thisCell.val = (txtNode.nodeValue) ? txtNode.nodeValue.replace(/^[\s]*/,"").toUpperCase() : ""; //cache text value (perf)
				if(thElt.className.indexOf("numeric-sort")!=-1) {
					thisCell.val = parseFloat(thisCell.val);
					if(isNaN(thisCell.val)) thisCell.val = -999999999;
				}
				if(thElt.className.indexOf("date-sort")!=-1) {
					var parts = thisCell.val.split("/");
					if(parts.length == 3) thisCell.val = parts[2] + parts[0] + parts[1];
					else thisCell.val = "99/99/9999";
				}
			}
			sortCells[sortCells.length]=thisCell;
		}

		function byValProp(a,b) {  //sorts elements by .val property
			return (a.val>b.val) ? 1 : (a.val<b.val) ? -1 : 0;
		}	
		sortCells.sort(byValProp); //Sort it!

		//write sorted rows:
		for(var i=0;i<sortCells.length;i++) {
			if(thElt.sortDir=='down') tbody.insertBefore(sortCells[i].row,tbody.firstChild);
			else tbody.appendChild(sortCells[i].row);
		}

		var endSort=new Date();
		window.status="Sorting completed on " + allRows.length + " rows.  (" + (endSort - beginSort)/1000 + " sec.)";

		//wait a bit before allowing clicks:
		setTimeout('window.removeEventListener("click",SortableTableColumn._cancelEvent,true)',1);
	
	},
	destroy : function() {
		var elt = this.element;
		elt.removeEventListener("click", this.clickHandler, false);
		elt.className = elt.className.replace(/^(?:.*\s)?sortable-table-column-sorted-(up|down)(?:\s.*)?$/g, " ");
	}
};
SortableTableColumn.instances = [];
SortableTableColumn._cancelEvent = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}
SortableTableColumn.enableScriptSheet = function() {
	SortableTableColumn.disableScriptSheet();
	var hdrs = document.getElementsByTagName("th");
	for(var h=0;h<hdrs.length;h++) {
		if(hdrs[h].className.match(/^(.*\s+)?sortable(\s+.*)?$/)) {
			new SortableTableColumn(hdrs[h]);
		}
	}
};
SortableTableColumn.disableScriptSheet = function() {
	var i, inst;
	for(i=0; (inst=SortableTableColumn.instances[i]); i++) {
		inst.destroy();
	}
	SortableTableColumn.instances = [];
};
