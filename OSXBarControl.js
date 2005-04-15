function OSXBarControl(bar) {
	this.bar = bar;
	this.create();
}
OSXBarControl.prototype = {
	create : function() {
		var cE = function(v){return document.createElement(v)};
		var cTN = function(v){return document.createTextNode(v)};
		var fields = [
			["edge","Edge","Edge of the Window","select",["left","bottom","right","top"]],
			["iconMinSize","Min Icon Size","Minimum icon size in pixels","text",3],
			["iconMaxSize","Max Icon Size","Maximum icon size in pixels","text",3],
			["iconSpacing","Icon Spacing","Space between icons in pixels","text",3],
			["scaleReach","Curve","Smoothness of the scaling curve; bigger number is smoother curve","text",3]
		];
		var tbl = this.element = cE("table");
		for(var i=0; i<fields.length; i++) {
			var tr = cE("tr");
			var th = cE("th");
				th.appendChild(cTN(fields[i][1]));
			var td = cE("td");
				var fld;
				if(fields[i][3]=="text") {
					fld = cE("input");
					fld.type="text";
					fld.size=fields[i][4];
					fld.value=this.bar[fields[i][0]];
				} else if(fields[i][3]=="select") {
					fld = cE("select");
					var opts = fields[i][4];
					for(var j=0; j<opts.length; j++) {
						var opt = cE("option");
						opt.appendChild(cTN(opt.value = opts[j]));
						if(opt.value==this.bar[fields[i][0]]) opt.selected=true;
						fld.appendChild(opt);
					}
				}
				fld.title=fields[i][2];
				fld.osxBarProp=fields[i][0];
				var thisRef = this;
				var osxBarChange = function(evt) {
					if(evt.type=="keypress" && evt.keyCode != 13) return; //skip if any key other than enter
					thisRef.bar.setProperty(this.osxBarProp, this.value);
				}
				fld.addEventListener("change",osxBarChange,false);
				fld.addEventListener("keypress",osxBarChange,false);
				td.appendChild(fld);
			tr.appendChild(th);
			tr.appendChild(td);
			tbl.appendChild(tr);
		}
	},
	appendTo : function(elt) {
		elt.appendChild(this.element);
	},
	destroy : function() {
		if(this.parentNode) this.parentNode.removeChild(this.element);
		this.element = this.bar = null;
	}
};