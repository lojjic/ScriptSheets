
/*

This class provides a way to switch between 
"script sheets" much like switching between 
CSS style sheets. The preferred style choice
is persisted in a cookie.

Example:
<link rel="scriptsheet" type="text/javascript" href="OSXBar" title="Mac OS X Style" />
<link rel="alternate scriptsheet" type="text/javascript" href="MenuBar" title="Windows Style" />

*/



function ScriptSheet(title, script, enabled) {
	this.title = title;
	this.script = window[script];
	if(enabled) this.enable();
	ScriptSheet.instances[ScriptSheet.instances.length] = this;
}
ScriptSheet.prototype = {
	enable : function() {
		if(this.script && this.script.enableScriptSheet) this.script.enableScriptSheet();
	},
	disable : function() {
		if(this.script && this.script.disableScriptSheet) this.script.disableScriptSheet();
	}
};
ScriptSheet.instances = [];
ScriptSheet.getPreferredStyle = function() {
	var i, lnk, rel, ttl;
	//look for cookie first:
	if(typeof Cookie == "function") {
		ttl = new Cookie("preferredStyle").getValue();
		if(ttl) return ttl;
	}
	
	//else get first titled sheet:
	for(i=0; (lnk=document.getElementsByTagName("link")[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		if(rel.match(/^\s*(style|script)sheet\s*$/i) && ttl) return ttl;
	}
	return null;
};
ScriptSheet.switchTo = function(title) {
	var inst, i; 
	for(i=0; (inst=ScriptSheet.instances[i]); i++) {
		if(inst.title == title || !title) inst.enable();
		else inst.disable();
	}
	if(typeof Cookie == "function") {
		var cook = new Cookie("preferredStyle");
		cook.setLifespan(60*60*24*365); //1 year
		cook.setValue(title);
	}
};


function onScriptSheetDocLoaded() {
	var i, lnk, rel, ttl, scr;
	var pref = ScriptSheet.getPreferredStyle();
	// XXX - move this all into .switchTo() and have it handle stylesheets too
	for(var i=0; (lnk=document.getElementsByTagName("link")[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		scr = lnk.getAttribute("href");
		if(rel && rel.match(/^\s*(alternate\s+)?scriptsheet\s*$/i) && scr) {
			new ScriptSheet(ttl, scr, (ttl == pref || !ttl));
		}
	}
}
window.addEventListener("load",onScriptSheetDocLoaded,false);
