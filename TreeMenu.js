
/*

TODO:
	* Make keyboard-navigable (insert <a>s around branch labels)

ISSUES:
	* If <li> IDs are different across pages, persistence will be wrong (maybe associate URIs with IDs?)

*/


function TreeMenu(elt) {
	this.element = elt;
	this.create();
}
TreeMenu.prototype = {
	create : function() {
		var i, li;
		this.element.className += " tree-menu";
		this.nodes = [];
		for(i=0; (li=this.element.childNodes[i]); i++)
			if(li.nodeType==1) 
				this.nodes[this.nodes.length] = new TreeMenuNode(li, TreeMenu.getOpenNodes()[li.id]);
	},
	destroy : function() {
		var i, node;
		for(i=0; (node=this.nodes[i]); i++) node.destroy();
		this.element.className = this.element.className.replace("tree-menu","");
	}
};
TreeMenu.getOpenNodes = function() { //returns a hash with id as key and isOpen as value
	var open = TreeMenu.openNodes;
	if(open) return open;
	open = {};
	if(!window.Cookie) return open;
	var c = new Cookie("treeMenuOpenNodes").getValue();
	if(c && typeof c == "object" && c.constructor == Array) {
		for(var i in c) open[c[i]] = true;
	}
	return TreeMenu.openNodes = open;
};
TreeMenu.setOpenNode = function(id, isOpen) {
	if(!window.Cookie) return;
	var cookie = new Cookie("treeMenuOpenNodes");
	var oldNodes = cookie.getValue();
	var newNodes = [];
	if(typeof oldNodes == "object" && oldNodes.constructor == Array) {
		for(i in oldNodes) if(oldNodes[i] != id) newNodes[newNodes.length] = oldNodes[i];
		if(isOpen) newNodes[newNodes.length] = id;
	}
	cookie.setValue(newNodes);
	cookie.setLifespan(60*60*24*365);
	TreeMenu.openNodes[id] = isOpen;
};
TreeMenu.scriptSheetSelector = "ul.navigation";



function TreeMenuNode(elt, open) {
	this.element = elt;
	this.defaultOpen = open;
	this.create();
}
TreeMenuNode.prototype = {
	create : function() {
		var v, h, i, j;
		var elt = this.element;
		this.nodes = [];

		//create dotted lines:
		v = this.outlineVert = document.createElement("span");
			v.className = "tree-menu-outline-vertical";
			var isLast=true; var e=elt; while(e=e.nextSibling) if(e.nodeType==1) {isLast=false; break;} //is it the last node?
			if(isLast) v.className += " last-child-outline";
			else if(v.style.setExpression) v.style.setExpression("height","this.parentNode.offsetHeight"); //hack to make IE set height to 100% of <li>
		h = this.outlineHoriz = document.createElement("span");
			h.className = "tree-menu-outline-horizontal";
		elt.insertBefore(v, elt.firstChild);
		elt.insertBefore(h, elt.firstChild);
		
		var subs = elt.getElementsByTagName("ul");
		if(subs.length) {
			var thisRef = this;
			elt.className += " tree-menu-node-branch";
			elt.addEventListener("click", this.clickHandler=function(evt){thisRef.onClick(evt);}, false);

			//create plus-minus icon:
			this.collapser = document.createElement("span");
				this.collapser.className="tree-menu-collapser";
				this.collapser.appendChild(document.createTextNode(""));
			elt.insertBefore(this.collapser, elt.firstChild);

			if(this.defaultOpen) this.expand();
			else this.collapse();
		} else {
			elt.className += " tree-menu-node-leaf";
		}

		//create icon from list-style-image:
		var lsImg = window.getComputedStyle(elt,null).getPropertyValue("list-style-image");
		if(lsImg && lsImg.indexOf("url(") == 0) {
			this.icon = document.createElement("img");
			this.icon.src = lsImg.replace(/^url\("?([^"]*)"?\)$/,"$1");
			elt.insertBefore(this.icon, elt.firstChild);
		}
	},
	
	onClick : function(evt) {
		//check that it's not a submenu that got clicked:
		var it = evt.currentTarget;
		var tmp = evt.target;
		while(tmp && tmp.nodeName.toLowerCase() != "ul" && tmp != evt.currentTarget) tmp=tmp.parentNode;
		if(tmp != it) return;

		if(this.collapsed) this.expand();
		else this.collapse();
	},
	
	expand : function() {
		var i, j, c, li;
		this.collapsed = false;
		
		//show children:
		var kids = this.element.childNodes;
		for(i=0; i<kids.length; i++) {
			if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") {
				kids[i].style.display="";
				for(j=0; (li=kids[i].childNodes[j]); j++) {
					if(li.nodeType==1 && !li.treeMenuNode) this.nodes[this.nodes.length] = li.treeMenuNode = new TreeMenuNode(li, TreeMenu.getOpenNodes()[li.id]);
				}
			}
		}

		//change icon:
		c = this.collapser;
			c.firstChild.nodeValue = "-"; 
			c.title = "Collapse"; 
			c.className = c.className.replace(/\bcollapsed\b/,"");
		
		//persist state:
		var id = this.element.getAttribute("id");
		if(id) TreeMenu.setOpenNode(id, true);
	},
	
	collapse : function() {
		var i, c;
		this.collapsed = true;
		
		//hide children:
		var kids = this.element.childNodes;
		for(i=0; i<kids.length; i++) if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") kids[i].style.display="none";
			
		//change icon:
		c = this.collapser;
		c.firstChild.nodeValue = "+"; 
		c.title = "Expand"; 
		c.className += " collapsed";

		//persist state:
		var id = this.element.getAttribute("id");
		if(id) TreeMenu.setOpenNode(id, false);
	},
	
	destroy : function() {
		var i;
		var elt = this.element;
		delete elt.treeMenuNode;
		elt.className = elt.className.replace(/\btree-menu-node-(branch|leaf)\b/g, "");
		var uls = this.element.getElementsByTagName("ul");
			for(i=0; i<uls.length; i++) uls[i].style.display="";
		elt.removeChild(this.outlineVert);
		elt.removeChild(this.outlineHoriz);
		if(this.collapser) elt.removeChild(this.collapser);
		if(this.icon) elt.removeChild(this.icon);
		elt.removeEventListener("click", this.clickHandler, false);
		for(i in this.nodes) this.nodes[i].destroy();
	}
}
