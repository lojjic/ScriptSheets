
/*

TODO:
	* Make keyboard-navigable (insert <a>s around branch labels

ISSUES:
	* If <li> IDs are different across pages, persistence will be wrong (maybe associate URIs with IDs?)

*/


function TreeMenu(elt) {
	this.element = elt;
	this.create();
	TreeMenu.instances[TreeMenu.instances.length] = this;
}
TreeMenu.prototype = {
	create : function() {
		var i, li;
		this.element.className += " tree-menu";
		this.menuNodes = [];
		for(i=0; (li=this.element.getElementsByTagName("li")[i]); i++) {
			if(li.getElementsByTagName("ul")) this.menuNodes[this.menuNodes.length] = new TreeMenuNode(li);
		}
	},
	
	destroy : function() {
		var i, node;
		for(i=0; (node=this.menuNodes[i]); i++) {
			node.destroy();
		}
		this.element.className = this.element.className.replace("tree-menu","");
	}
};
TreeMenu.instances = [];
TreeMenu.enableScriptSheet = function() {
	TreeMenu.disableScriptSheet();
	var uls = document.getElementsByTagName("ul");
	for(i=0; i<uls.length; i++) {
		if(uls[i].className.match(/\s*navigation\s*/)) new TreeMenu(uls[i]);
	}
};
TreeMenu.disableScriptSheet = function() {
	var i, menu;
	for(i=0; (menu=TreeMenu.instances[i]); i++) {
		menu.destroy();
	}
	TreeMenu.instances = [];
};



function TreeMenuNode(elt,open) {
	this.element = elt;
	this.collapsed = !open;
	this.create();
}
TreeMenuNode.prototype = {
	create : function() {
		var s, v, h, i;
		s = this.element.style;
			s.position="relative"; s.display="block"; s.listStyleType="none";
		
		//create dotted lines:
		v = this.outlineVert = document.createElement("div");
			s = v.style; s.position="absolute"; s.top="0"; s.left="6px"; s.height="100%"; s.borderLeft="1px dotted";
			var isLast=true; var e=this.element; while(e=e.nextSibling) if(e.nodeType==1) isLast=false; //is it the last node?
			if(isLast) s.height="8px";
		h = this.outlineHoriz = document.createElement("div");
			s = h.style; s.position="absolute"; s.top="8px"; s.left="8px"; s.width="8px"; s.borderTop="1px dotted";
		this.element.appendChild(v);
		this.element.appendChild(h);
		
		//create icon from list-style-image:
		var lsImg = window.getComputedStyle(this.element,null).getPropertyValue("list-style-image");
		this.element.style.listStyleImage = "none";
		if(lsImg.indexOf("url(") == 0) {
			this.icon = document.createElement("img");
			this.icon.src = lsImg.replace(/^url\("?([^"]*)"?\)$/,"$1");
			this.element.insertBefore(this.icon, this.element.firstChild);
		}

		
		var subs = this.element.getElementsByTagName("ul");
		if(subs.length) {
			var thisRef = this;
			this.element.addEventListener("click", this.clickHandler=function(evt){thisRef.onClick(evt);}, false);
			
			//create plus-minus icon:
			this.collapser = document.createElement("img");
				s = this.collapser.style; s.position="absolute"; s.top="4px"; s.left="2px";
			this.element.appendChild(this.collapser);
	
			this.collapse();
			
			if(typeof Cookie == "function") {
				this.cookie = new Cookie("treeMenuOpenNodes");
				this.cookie.setLifespan(60*60*24*365);
				var id = this.element.getAttribute("id");
				if(id && this.cookie.getValue().match(new RegExp("^(.+,)?" + id + "(,.*)?$"))) this.expand();
			}
		}
	},
	
	onClick : function(evt) {
		//check that it's not a submenu that got clicked:
		var it = evt.currentTarget;
		var tmp = evt.target;
		while(tmp.nodeName.toLowerCase() != "ul" && tmp != evt.currentTarget) tmp=tmp.parentNode;
		if(tmp != it) return;

		if(this.collapsed) this.expand();
		else this.collapse();
	},
	
	expand : function() {
		this.collapsed = false;
		
		//show children:
		var kids = this.element.childNodes;
			for(var i=0; i<kids.length; i++) if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") kids[i].style.display="";
		
		//change icon:
		var c = this.collapser;
			c.src = "assets/minus.gif"; c.alt = "-"; c.title="Collapse";
		
		//persist state:
		var id = this.element.getAttribute("id");
		if(id && this.cookie) {
			var cookVal = this.cookie.getValue();
			if(!cookVal.match(new RegExp("^(.+,)?" + id + "(,.*)?$"))) this.cookie.setValue((cookVal ? cookVal + "," : "") + id);
		}
	},
	
	collapse : function() {
		this.collapsed = true;
		
		//hide children:
		var kids = this.element.childNodes;
			for(var i=0; i<kids.length; i++) if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") kids[i].style.display="none";
		
		//change icon:
		var c = this.collapser;
			c.src = "assets/plus.gif"; c.alt = "+"; c.title="Expand";
		
		//persist state:
		var id = this.element.getAttribute("id");
		if(id && this.cookie) {
			var cookVal = this.cookie.getValue();
			cookVal = cookVal.replace(id,"").replace(/,+/g, ",");
			this.cookie.setValue(cookVal.replace(id,"").replace(/,+/g, ","));
		}
	},
	
	destroy : function() {
		var s = this.element.style;
			s.position = s.display = s.listStyleType = s.listStyleImage = "";
			
		var uls = this.element.getElementsByTagName("ul");
			for(var i=0; i<uls.length; i++) uls[i].style.display="";
		this.element.removeChild(this.outlineVert);
		this.element.removeChild(this.outlineHoriz);
		if(this.collapser) this.element.removeChild(this.collapser);
		if(this.icon) this.element.removeChild(this.icon);
		this.element.removeEventListener("click", this.clickHandler, false);
	}
}
