/*
**  ScriptSheet script by Jason Johnston (jj@lojjic.net)
**  Created July 2003.  Use freely, but give me credit.
**
**  This class provides a way to switch between 
**  "script sheets" much like switching between 
**  CSS style sheets. The preferred style choice
**  is persisted. For usage and details see 
**  ScriptSheet-doc.html.
*/

function ScriptSheet(title, script) {
	this.title = title;
	this.script = window[script];
	var i = ScriptSheet.instances;
	i[i.length] = this;
}
ScriptSheet.prototype = {
	enable : function() {
		this.disable();
		var s = this.script;
		if(!s) return;
		if(!s.enableScriptSheet) s.enableScriptSheet = function() {
			this.disableScriptSheet();
			var sel = this.scriptSheetSelector;
			if(!sel) return;
			var elts;
			if(typeof sel == "function") elts = sel();
			if(typeof sel == "string") elts = ScriptSheet.matchSelector(sel);
			var inst = this.scriptSheetInstances;
			for(var i=0; i<elts.length; i++) inst[inst.length] = new s(elts[i]);
		}
		s.enableScriptSheet();
	},
	disable : function() {
		var s = this.script;
		if(!s) return;
		var inst = this.scriptSheetInstances;
		if(!s.disableScriptSheet) s.disableScriptSheet = function() {
			var inst = this.scriptSheetInstances || [];
			for(var i in inst) if(inst[i].destroy) inst[i].destroy();
			this.scriptSheetInstances = [];
		}
		s.disableScriptSheet();
	}
};
ScriptSheet.instances = [];
ScriptSheet.getPreferredStyle = function() {
	var i, lnk, rel, ttl;
	var lnks = document.getElementsByTagName("link");
	//look for cookie first:
	if(window.Cookie) {
		ttl = new Cookie("preferredStyle").getValue();
		if(ttl=="[basic]" || ttl=="[null]") return ttl;
		if(ttl) { //make sure cookie value is an actual sheet title:
			for(i=0; (lnk=lnks[i]); i++) if(lnk.getAttribute("title") == ttl) return ttl; 
		}
	}
	//else get first titled sheet:
	for(i=0; (lnk=lnks[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		if(rel.match(/\b(style|script)sheet\b/i) && ttl) return ttl;
	}
	return null;
};

// Take a CSS selector string and return all matching elements:
ScriptSheet.matchSelector = function(sel) {
	sel = sel.replace(/\s+/g, " "); //collapse whitespaces to a single space
	sel = sel.replace(/\s*([>\+=])\s*/g, "$1"); //strip extra whitespace around combinators 
	sel = sel.replace(/^\s*(\S*)\s*$/, "$1"); //and at start and end of string
	if(sel.charAt(0) != "#") sel = " "+sel; //initial descendant selector unless starts with #id
	sel = sel.replace(/([ >\+])([\.\[#])/g, "$1*$2"); //insert universal selector where it is optionally omitted
	
	var i, j, p, a, b;
	//var parts = sel.split(/([#\. >\+]|\[[^\]]*\])/); //XXX - need to mimic this bc IE doesn't return paranthesized separators
	var parts = [];
	while(sel.length > 0) {
		switch(sel.charAt(0)) {
			case "#": case ".": case " ": case ">": case "+":
				parts[parts.length] = sel.charAt(0);
				sel = sel.substring(1);
			break;
			case "[":
				i = sel.indexOf("]");
				parts[parts.length] = sel.substring(0,i+1);
				sel = sel.substring(i+2);
			break;
			default:
				a = sel.match(/^([^#\. >\+\[]+)(.*)$/);
				parts[parts.length] = a[1];
				sel = a[2];
		}
	}
	
	var elts = [document];
	
	for(p=0; p<parts.length; p++) {
		a = [];
		switch(parts[p].charAt(0)) {
			case "": break; //ignore blank remnants of split
			case "#":
				p++;
				if(elts[0]==document) { //if no previous context, do it fast:
					a = document.getElementById(parts[p]);
					elts = a ? [a] : [];
				} else {
					for(i=0; i<elts.length; i++) {
						if(elts[i].getAttribute("id") == parts[p]) a[a.length] = elts[i];
					}
					elts = a;
				}
			break;
			case ".": //class
				p++;
				for(i=0; i<elts.length; i++) {
					b = elts[i].className || elts[i].getAttribute("class") || elts[i].getAttribute("className");
					if(b && b.match(new RegExp("\\b" + parts[p] + "\\b"))) a[a.length] = elts[i];
				}
				elts = a;
			break;
			case "[": //attribute
				b = parts[p].match(/^\[([^\]=]+)(=([^\]]*))?\]$/);
				if(b) {
					var attr = b[1]; var val = b[3];
					if(val) val=val.replace(/^(['"])([^\1]*)\1$/,"$2"); //remove quotes
					for(i=0; i<elts.length; i++) {
						if((!val && elts[i].hasAttribute(attr)) || (val && elts[i].getAttribute(attr) == val)) a[a.length] = elts[i];
					}
				}
				elts = a;
			break;
			case " ": //descendant
				p++;
				for(i=0; i<elts.length; i++) {
					b = elts[i].getElementsByTagName(parts[p]);
					for(j=0; j<b.length; j++) a[a.length] = b[j];
				}
				elts = a;
			break;
			case ">": //child
				for(i=0; i<elts.length; i++) {
					b = elts[i].childNodes;
					for(j=0; j<b.length; j++) if(b[j].nodeType==1) a[a.length] = b[j];
				}
				elts = a;
			break;
			case "+": //nextSibling
				for(i=0; i<elts.length; i++) {
					b = elts[i].nextSibling;
					while(b && b.nodeType != 1) b = b.nextSibling;
					if(b) a[a.length] = b;
				}
				elts = a;
			break;
			default: //element:
				for(i=0; i<elts.length; i++) {
					if(parts[p] == "*" || elts[i].nodeName.toLowerCase() == parts[p]) a[a.length] = elts[i];
				}
				elts = a;
		}
	}
	return elts;
};
ScriptSheet.switchTo = function(title) {
	var i, lnk, rel, ttl, hrf, match, c;
	var lnks = document.getElementsByTagName("link")
	var scripts = [];
	for(i=0; (lnk=lnks[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		hrf = lnk.getAttribute("href");
		if(rel && (match=rel.match(/^\s*((alternat(e|ive))\s+)?(script|style)sheet\s*$/i)) && hrf) {
			if(match[4]=="style") lnk.disabled = !(ttl == title || (!ttl && title != "[null]")); //handle stylesheets
			else {
				hrf = hrf.substring(hrf.indexOf("#")+1);
				if(!lnk.scriptSheet) lnk.scriptSheet = new ScriptSheet(ttl, hrf);
				lnk.scriptSheet.disable();
				if(ttl == title || (!ttl && title != "[null]")) scripts[scripts.length] = lnk.scriptSheet; //add to list
			}
		}
	}
	//enable all matching scripts:
	for(i=0; i<scripts.length; i++) scripts[i].enable();
	//remember choice:
	if(window.Cookie) {
		c = new Cookie("preferredStyle");
		c.setLifespan(60*60*24*365);
		c.setValue(title || "");
	}
};
ScriptSheet.onLoad = function() {
	var pref = ScriptSheet.getPreferredStyle();
	ScriptSheet.switchTo(pref);
}
window.addEventListener("load",ScriptSheet.onLoad,false);



function StyleChooser() {
	this.create();
	var i = StyleChooser.instances;
	i[this.index = i.length] = this;
}
StyleChooser.prototype = {
	create : function() {
		var sel, i, lnk, rel, ttl, opt;
		sel = this.chooser = document.createElement("select");
		var styles = {};
		for(i=0; (lnk=document.getElementsByTagName("link")[i]); i++) {
			rel = lnk.getAttribute("rel");
			ttl = lnk.getAttribute("title");
			if(rel && rel.match(/\b(script|style)sheet\b/i) && ttl) styles[ttl] = ttl;
		}
		styles["Basic Style"] = "[basic]"; //add basic style (only untitled sheets)
		styles["No Style"] = "[null]"; //add null style (no sheets)
		var pref = ScriptSheet.getPreferredStyle();
		for(i in styles) {
			opt = document.createElement("option");
			opt.appendChild(document.createTextNode(i));
			opt.setAttribute("value",styles[i]);
			if(styles[i]==pref) opt.selected=true;
			sel.appendChild(opt);
		}
		sel.addEventListener("change", function(evt){StyleChooser.switchTo(this.value);}, false);
	},
	appendTo : function(elt) {
		elt.appendChild(this.chooser);
	},
	insertBefore : function(node) {
		node.parentNode.insertBefore(this.chooser, node);
	}
};
StyleChooser.instances = [];
StyleChooser.switchTo = function(title) {
	var i, j, a, b;
	//update all StyleChoosers:
	for(i=0; (a=StyleChooser.instances[i]); i++)
		for(j=0; (b=a.chooser.options[j]); j++)
			if(b.value == title) a.chooser.selectedIndex = j;
	//switch the style:
	ScriptSheet.switchTo(title);
};
