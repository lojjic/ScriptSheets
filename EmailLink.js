/*
**  EmailLink script by Jason Johnston (jj@lojjic.net)
**  Created August 2003.  Use freely, but give me credit.
**
**  This script will allow you to obfuscate email addresses
**  in web pages so spam harvesters will not see them.  The
**  email address is entered in plain text with abnormal
**  characters, and the script decodes and creates a 
**  mailto: link from it. See EmailLink-doc.html for details.
*/

function EmailLink(elt) {
	this.element = elt;
	this.create();
}
EmailLink.prototype = {
	create : function() {
		var elt = this.element;
		if(elt.firstChild.nodeType != 3) return; //first node must be text
		var addr = elt.firstChild.nodeValue;
		addr = addr.replace(/[ \[\{\(\|\/\\]at[ \]\}\)\|\/\\]/i, "@");
		addr = addr.replace(/[ \[\{\(\|\/\\](dot|period)[ \]\}\)\|\/\\]/gi, ".");

		var lnk = this.EmailLinkLink = (document.createElementNS) ? document.createElementNS("http://www.w3.org/1999/xhtml","a") : document.createElement("a");
		lnk.setAttribute("href","mailto:"+addr);
		lnk.appendChild(document.createTextNode(elt.getAttribute("title") || addr));
		elt.replaceChild(lnk, (this.EmailLinkTextNode = elt.firstChild));
	},
	destroy : function() {
		this.element.replaceChild(this.EmailLinkTextNode, this.EmailLinkLink);
		this.EmailLinkTextNode = this.EmailLinkLink = null;
	}
}
EmailLink.scriptSheetSelector = ".electronic-mail";
