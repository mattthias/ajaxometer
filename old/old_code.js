AJAXOmeter.prototype.newTextOnPath               = function (txt, path, config) { /* {{{ */
  if (this.svg == null) return;

  var xlinkns = "http://www.w3.org/1999/xlink";
  this.path_id = this.path_id == undefined ? 0 : this.path_id+1;


  var p = this.newElt("path", {'id':"textPath"+this.path_id, 'd':path});
  var defs = this.newElt("defs", {'id':'defsPath'+this.path_id}, p);
  this.svg.appendChild(defs);


  var data = this.svgDocument.createTextNode(txt);

  var textPath = this.newElt("textPath", {}, data);
  textPath.setAttributeNS(xlinkns, "xlink:href", "#textPath" + this.path_id);

  var textNode = this.newElt("text", config, textPath);
  return textNode;
} /* }}} */
