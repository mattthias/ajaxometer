/** Config **/

/* This controls how long a download should take. */
var AJAXOmeterTestTime     = 100; // in miliseconds (this will only be an aproximation)
var AJAXOmeterViewWidth    = 1600; // you need to change this in the .svg file as well.
var AJAXOmeterViewHeight   = 1200; // you need to change htis in the .svg file as well.
var AJAXOmeterBarWidth     = 40;
var AJAXOmeterBarMaxHeight = AJAXOmeterViewHeight*0.8;
var AJAXOmeterBarSpacing   = 10;


/** Browser Detection **/
var AJAXOmeterBrowser = "";
if (/Opera/.test(navigator.userAgent)) 
  AJAXOmeterBrowser="opera";
else if (/Microsoft Internet Explorer/.test(navigator.appName))
  AJAXOmeterBrowser="ie";
else if (/Adobe/.test(navigator.appName)) // We can also be in the Adobe SVG Viewer ... its probably not really correct to assume ie, but oh well. 
  AJAXOmeterBrowser="ie";
else
  AJAXOmeterBrowser="mozilla";




/** Code **/
function AJAXOmeter(e) { /* {{{ */
  this.status           = "";
  this.latency          = 0;
  this.latency_tot      = 0;
  this.latency_ct       = 0;
  this.up_cps           = 0;
  this.down_cps         = 0;
  this.lastRunTime      = 0;
  this.goodDownloadSize = 0;
  this.goodUploadSize   = 0;
  this.bars             = new Array();

  
  //this.svgDocument = window.svgDocument == null ? e.target.ownerDocument : window.svgDocument;
  this.svgDocument = e.target.ownerDocument;
  this.svg         = this.svgDocument.documentElement;



/*
  this.svg.appendChild(this.newText("Hello World", "M200 1000 L200 0"));
  this.svg.appendChild(this.newText("SALKSfjf", "M300 1000 L300 0"));
  */

  this.updateStats();

  this.speedTest();
} /* }}} */

AJAXOmeter.prototype.newElt                      = function (type) { /* {{{ */
/* Takes a variable number of arguments. 
 * The first argument should be a string of the type of dom object
 * you want to create. The second argument is an associative array
 * with property:value pairs. The remaining arguments, if they exist,
 * are any children you want to append to the element.

 * All properties are applied with a null attribute name space, so if you need
 * a namespace (for example, for xlink:href's), then you need to apply the attribute
 * after you have created it with this function. 

 * Eg. this.newElt('rect', {width: 200, height: 100, x: 400, y: 500}, child1, child2);

 */


  var svgns = "http://www.w3.org/2000/svg";


  var elt = this.svgDocument.createElementNS(svgns, type);
  if (arguments.length >= 2 && typeof arguments[1] == "object") {
    for (var j in arguments[1])
      if (arguments[1][j] != null) {
        if (AJAXOmeterBrowser == "ie") {
          switch (j.toLowerCase()) {
            case "onclick":
            case "onkeyup":
            case "onkeydown":
              elt[j.toLowerCase()] = new Function(arguments[1][j]); /* gay special cases for IE 6 */
            break;
            case "class":
              elt.setAttributeNS(null, "className", arguments[1][j]); /* ie needs this instead.. */
            elt.setAttributeNS(null, "class", arguments[1][j]);
            break;
            default:
            elt.setAttributeNS(null, j, arguments[1][j]);
            break;
          }
        } else {
          elt.setAttributeNS(null, j, arguments[1][j]);
        }
      }
  }
  for (var i=2; i < arguments.length; ++i ) {
    if (arguments[i] != null) {
      if (isArray(arguments[i])) {
        for (var j in arguments[i]) {
          elt.appendChild(arguments[i][j]);
        }
      } else {
        elt.appendChild(arguments[i]);
      }
    }
  }
  return elt;
} /* }}} */
AJAXOmeter.prototype.newText                     = function (txt, path, config) { /* {{{ */
  var xlinkns = "http://www.w3.org/1999/xlink";
  this.path_id = this.path_id == undefined ? 0 : this.path_id+1;


  var p = this.newElt("path", {'id':"textPath"+this.path_id, 'd':path});
  var defs = this.newElt("defs", {}, p);
  this.svg.appendChild(defs);


  var data = this.svgDocument.createTextNode(txt);

  var textPath = this.newElt("textPath", {}, data);
  textPath.setAttributeNS(xlinkns, "xlink:href", "#textPath" + this.path_id);

  var textNode = this.newElt("text", config, textPath);
  return textNode;
} /* }}} */
AJAXOmeter.prototype.updateStats                 = function () { /* {{{ */
  this.elt("latency").firstChild.data="~" + (this.latency_tot/this.latency_ct).toFixed(1) + " ms";
  this.elt("status").firstChild.data=this.status;
  this.elt("up_cps").firstChild.data=prettySize(this.up_cps) + "/s";
  this.elt("down_cps").firstChild.data=prettySize(this.down_cps) + "/s";
} /* }}} */
AJAXOmeter.prototype.elt                         = function (id) { /* {{{ */
  return this.svgDocument.getElementById(id);
} /* }}} */
AJAXOmeter.prototype.ping                        = function (toCallWhenDone) { /* {{{ */
  var self = this;
  var start = new Date();
  pull("ajaxometer.php?len=1", "", function () {
    var end = new Date();
    self.latency      = end.getTime() - start.getTime();
    self.latency_tot += end.getTime() - start.getTime();
    self.latency_ct  += 1;
    self.lastRunTime  = end.getTime() - start.getTime();
    self.updateStats();
    //self.pushBar(self.latency + " ms", self.latency, "#fdd");
    self.pushBar(self.latency + " ms", self.latency, "ping");
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.downloadTest                = function (size, toCallWhenDone) { /* {{{ */
  var self = this;

  self.status = "Testing download ["+prettySize(size)+"]";

  var start = new Date();
  pull("ajaxometer.php?len="+size,"", function () {
    var end = new Date();
    self.lastRunTime = end.getTime() - start.getTime();
    var downloadTime = (self.lastRunTime - self.latency) * 0.001;
    self.down_cps    = size / downloadTime;
    self.updateStats();
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.uploadTest                  = function (size, toCallWhenDone) { /* {{{ */
  var self = this;
  var data = genStr(size);

  self.status = "Testing upload ["+prettySize(size)+"]";

  var start = new Date();
  pull("ajaxometer.php","data="+data, function () {
    var end = new Date();
    self.lastRunTime = end.getTime() - start.getTime();
    var uploadTime = (self.lastRunTime - self.latency) * 0.001;
    self.up_cps    = size / uploadTime;
    self.updateStats();
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.calibrate                   = function (toCallWhenDone) { /* {{{ */
  var self = this;

  function runPingTest(ct, toCallWhenDone) {
    if (ct > 0) {
      self.status = "Calculating Latency " + ct + "...";
      self.ping(function () { runPingTest(ct-1, toCallWhenDone); });
    } else {
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function runDownloadTest(size, toCallWhenDone) {
    if (self.lastRunTime < AJAXOmeterTestTime) {
      if (self.lastRunTime*2 > AJAXOmeterTestTime) 
        size *= (AJAXOmeterTestTime/self.lastRunTime)*0.6;
      self.downloadTest(size, function () { runDownloadTest(size*2, toCallWhenDone); });
    } else {
      self.goodDownloadSize = size * (AJAXOmeterTestTime/self.lastRunTime); 
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function runUploadTest(size, toCallWhenDone) {
    if (self.lastRunTime < AJAXOmeterTestTime) {
      if (self.lastRunTime*2 > AJAXOmeterTestTime) 
        size *= (AJAXOmeterTestTime/self.lastRunTime)*0.6; 
      self.uploadTest(size, function () { runUploadTest(size*2, toCallWhenDone); });
    } else {
      self.goodUploadSize = size * (AJAXOmeterTestTime/self.lastRunTime); 
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }


  runPingTest(10, function () { 
    self.lastRunTime = 0;
    runDownloadTest(1024, function () {
      self.lastRunTime = 0;
      runUploadTest(1024, toCallWhenDone);
    }); 
  });
} /* }}} */
AJAXOmeter.prototype.pushBar                     = function (label, height, cls) { /* {{{ */
  var self = this;

  var x = (this.bars.length) * (AJAXOmeterBarWidth+AJAXOmeterBarSpacing);

  var rect = this.newElt("rect", {'class': cls, 'x':x, 
    'width':AJAXOmeterBarWidth, y:100, height:AJAXOmeterViewHeight});

  var tx = x + AJAXOmeterBarWidth-2;
  var text = this.newText(label, "M"+tx+" "+AJAXOmeterViewHeight+" L"+tx+" 0", {'class':cls});

  this.svg.appendChild(rect);
  this.svg.appendChild(text);

  var bar = {'label':label, 'height':height, 'cls':cls, 
    'rect':rect, 'text':text};

  this.bars.push(bar);

  var heights = {ping: 100, download: 56000, upload: 56000};
  for (var i in this.bars) {
    var bar = this.bars[i];
    if (heights[bar.cls] == undefined) heights[bar.cls] = 0;

    if (bar.height > heights[bar.cls]) {
      heights[bar.cls] = bar.height;
    }
  }

  for (var i in this.bars) {
    var bar = this.bars[i];
    bar.rect.setAttributeNS(null, "height", ((bar.height/heights[bar.cls])*AJAXOmeterBarMaxHeight));
    bar.rect.setAttributeNS(null, "y", AJAXOmeterViewHeight-((bar.height/heights[bar.cls])*AJAXOmeterBarMaxHeight));
  }

} /* }}} */

AJAXOmeter.prototype.speedTest                   = function () { /* {{{ */
  var self = this;

  function RunSpeedTests () {
  }

  this.calibrate(RunSpeedTests);
} /* }}} */


/** Utility Functions {{{ **/

function pull(src, post, callback, opt_method) { /* {{{ */
  if (src) {
    var X = getHttpRequester();

    if (X) {
      X.open("POST", src,true);
      X.onreadystatechange=function() {
        if (X.readyState==4) {
          if (opt_method != null) {
            if (!callback[opt_method]) {
              alert(opt_method + " was not found within class");
            }

            callback[opt_method]();
          } else if (callback) {
            callback();
          } else {
            eval();
          }
        } 
      };
      X.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      X.send(post);
    } else {
      alert("pull called but the browser doesn't seem to support the XMLHttpRequest object.");
    }
  } else {
    alert("pull called with an invalid source = null");
  }
} /* }}} */

function isArray(obj) { /* {{{ */
  return (obj &&
      obj.splice &&
      obj.reverse &&
      obj.push &&
      obj.pop &&
      obj.sort &&
      obj.slice &&
      obj.shift &&
      obj.unshift) ? true : false;
} /* }}} */
function getHttpRequester() { /* {{{ */
  var xmlhttp=false;
  /*@cc_on @*/
  /*@if (@_jscript_version >= 5)
   try {
    xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
   } catch (e) {
     try {
       xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
     } catch (E) {
       xmlhttp = false;
    }
   }
  @end @*/
  if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
    xmlhttp = new XMLHttpRequest();
  }

  return xmlhttp;
} /* }}} */
function prettySize(size) { /* {{{ */
  var html = "";

  if (typeof(size) == "string") {
    size = parseFloat(size);
  }
  if (size > 1073741824) {
     html += (size/1073741824).toFixed(1) + " G";
  } else if (size > 1048576) {
     html += (size/1048576).toFixed(1) + " M";
  } else if (size > 1024) {
     html += (size/1024).toFixed(1) + " K";
  } else {
     html += size + " B";
  }

  return html;
} /* }}} */
function genStr(len) { /* {{{ */
  var ret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  while (1) {
    if (ret.length > len) {
      return ret.substr(0, len);
    }
    if (ret.length*2 >= len) {
      return ret+ret.substr(0, len-ret.length);
    }
    ret += ret;
  }
} /* }}} */

/* }}} */
