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
		var h; if(this.script && (h = this.script.enableScriptSheet)) h();
	},
	disable : function() {
		var h; if(this.script && (h = this.script.disableScriptSheet)) h();
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