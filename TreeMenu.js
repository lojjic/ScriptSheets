
/*

TODO:
	* Make keyboard-navigable (insert <a>s around branch labels
	* Find way to render tree outlines (as CSS style, need appropriate classes)

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
		var subs = this.element.getElementsByTagName("ul");		
		if(subs.length) {
			var thisRef = this;
			this.element.addEventListener("click", this.clickHandler=function(evt){thisRef.onClick(evt);}, false);
			
			this.element.className += " tree-menu-node";
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
		this.element.className = this.element.className.replace("tree-menu-collapsed","");
		
		//persist state:
		var id = this.element.getAttribute("id");
		if(id && this.cookie) {
			var cookVal = this.cookie.getValue();
			if(!cookVal.match(new RegExp("^(.+,)?" + id + "(,.*)?$"))) this.cookie.setValue((cookVal ? cookVal + "," : "") + id);
		}
	},
	
	collapse : function() {
		this.collapsed = true;
		this.element.className += " tree-menu-collapsed";
		
		//persist state:
		var id = this.element.getAttribute("id");
		if(id && this.cookie) {
			var cookVal = this.cookie.getValue();
			cookVal = cookVal.replace(id,"").replace(/,+/g, ",");
			this.cookie.setValue(cookVal.replace(id,"").replace(/,+/g, ","));
		}
	},
	
	destroy : function() {
		this.expand();
		this.element.className = this.element.className.replace("tree-menu-node","");
		this.element.removeEventListener("click", this.clickHandler, false);
	}
}
