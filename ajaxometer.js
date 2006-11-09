/* Copyright (c) 2006, Lobo Internet Services, Ltd.  All rights reserved. */


/** Config **/
/* This controls how long a download should take. */
var AJAXOmeterTestTime           = 1000; // in miliseconds (this will only be an aproximation)
//var AJAXOmeterTestTime           = 10; // in miliseconds (this will only be an aproximation)
var AJAXOmeterViewWidth          = 1600; // you need to change this in the .svg file as well.
var AJAXOmeterViewHeight         = 1200; // you need to change htis in the .svg file as well.
var AJAXOmeterTerminalLineHeight = 40;
var AJAXOmeterNumPingsToRun      = 15;
var AJAXOmeterNumDLsToRun        = 5;
var AJAXOmeterNumULsToRun        = 5;
var AJAXOmeterAvgModemSpeed      = 28800;
var AJAXOmeterAvgWebPageSize     = 130000;
var AJAXOmeterProtocolOverhead   = 1.08; // +8% or there abouts ... 

// all measurements in bits
var AJAXOmeterLineTypes = new Array(
       {name: '14.4k Modem'         , up:14400       , down:14400       } 
     , {name: '28.8k Modem'         , up:28800       , down:28800       } 
     , {name: '56k Modem'           , up:56000       , down:56200       } 
     , {name: '1.5M ADSL'           , up:512000      , down:1500000     } 
     , {name: 'T1'                  , up:1544000     , down:1544000     } 
     , {name: 'E1'                  , up:2048000     , down:2048000     } 
     , {name: 'Dual T1'             , up:3088000     , down:3088000     } 
     , {name: '7M ADSL'             , up:1000000     , down:7000000     } 
     , {name: 'High Speed Wireless' , up:7000000     , down:7000000     } 
     , {name: '10M Ethernet'        , up:10000000    , down:10000000    } 
     , {name: 'T3'                  , up:44736000    , down:44736000    } 
     , {name: 'OC1'                 , up:51800000    , down:51800000    } 
     , {name: '100M Ethernet'       , up:100000000   , down:100000000   } 
     , {name: 'OC3'                 , up:155000000   , down:155000000   } 
     , {name: 'T4'                  , up:274760000   , down:274760000   } 
     , {name: 'OC12'                , up:622000000   , down:622000000   } 
     , {name: '1G Ethernet'         , up:1000000000  , down:1000000000  } 
     , {name: 'OC48'                , up:2500000000  , down:2500000000  } 
     , {name: 'OC192'               , up:9600000000  , down:9600000000  } 
     , {name: '10G Ethernet'        , up:10000000000 , down:10000000000 } 
  );




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
  var self = this;
  this.objId = pushObj(this);
  
  this.status                 = "";
  this.latency_tot            = 0;
  this.latency_ct             = 0;
  this.uploaded               = 0;
  this.uploaded_time          = 0; // in seconds, minus the avg latency.
  this.lastRunTime            = 0;
  this.goodDLSize             = 0;
  this.goodULSize             = 0;

  this.terminalBuffer         = new Array();

  this.numPingsRan            = 0;
  this.numDLCalibration       = 0;
  this.numULCalibration       = 0;
  this.numDLReal              = 0;
  this.numULReal              = 0;
  this.totalDLCalibrationTime = 0;
  this.totalULCalibrationTime = 0;

  this.progressCircle         = null;
  this.progressTriangle       = null;
  this.progressText           = null;

  
  this.svgDocument = e.target.ownerDocument;
  this.svg         = this.svgDocument.documentElement;


  this.results_x              = parseInt(this.elt("results").getAttributeNS(null, "x")) + 20;
  this.results_y              = parseInt(this.elt("results").getAttributeNS(null, "y")) + AJAXOmeterTerminalLineHeight;
  this.summary_x              = parseInt(this.elt("summary").getAttributeNS(null, "x")) + 20;
  this.summary_y              = parseInt(this.elt("summary").getAttributeNS(null, "y")) + AJAXOmeterTerminalLineHeight;


  this.summaryStubText = this.newText("Running Tests...", {x:this.summary_x+230, y:this.summary_y+75} );
  this.svg.appendChild(this.summaryStubText);


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
AJAXOmeter.prototype.newTextOnPath               = function (txt, path, config) { /* {{{ */
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
AJAXOmeter.prototype.newText                     = function (txt, config) { /* {{{ */
  var data = this.svgDocument.createTextNode(txt);

  var textNode = this.newElt("text", config, data);
  return textNode;
} /* }}} */
AJAXOmeter.prototype.updateStats                 = function () { /* {{{ */

  if (this.progressCircle == null) {
    this.progressCircle = this.newElt("path", {'class':"progressCircle", "d":"M 800,400 A 200 200 0 0 1 800 400"});
    this.svg.appendChild(this.progressCircle);

    this.progressTriangle = this.newElt("polygon", {'class':"progressTriangle", "points":"800,400 800,401 800,402"});
    this.svg.appendChild(this.progressTriangle);
  }


  var center_x = 800;
  var center_y = 600;
  var theta = 2*Math.PI*this.percentDone();
  if (theta == 2*Math.PI) theta *= 0.9999;

  /* Progress Circle */

  var progress = this.progressCircle; 

  var progressCircle_radius = 200;

  var x = (Math.sin(theta)*progressCircle_radius+center_x);
  var y = (-Math.cos(theta)*progressCircle_radius+center_y);

  var big = 0;
  if (this.percentDone() > .5) big = 1;

  progress.setAttributeNS(null, "d", "M " + center_x + "," + (center_y-progressCircle_radius) 
    + " A 200 200 0 " + big + " 1 " + x + " " + y);


  /* Triangle */
  var triangle_radius = 250;
  var t_height = 15; // in .. pixels, sort of .. height to end points, not real triangle math here ..
  var t_width  = .05; // in radians
  var tx1 = (Math.sin(theta)            * (triangle_radius-t_height) + center_x);
  var ty1 = (-Math.cos(theta)           * (triangle_radius-t_height) + center_y);
  var tx2 = (Math.sin(theta  - t_width) * (triangle_radius+t_height) + center_x);
  var ty2 = (-Math.cos(theta - t_width) * (triangle_radius+t_height) + center_y);
  var tx3 = (Math.sin(theta  + t_width) * (triangle_radius+t_height) + center_x);
  var ty3 = (-Math.cos(theta + t_width) * (triangle_radius+t_height) + center_y);

  this.progressTriangle.setAttributeNS(null, "points", 
      tx1   + "," + ty1 + " "
      + tx2 + "," + ty2 + " "
      + tx3 + "," + ty3);

  /* Text */
  var text_char_box = 20;

  var text_x = (Math.sin(theta)  * (triangle_radius+t_height+text_char_box) + center_x);
  var text_y = (-Math.cos(theta) * (triangle_radius+t_height+text_char_box) + center_y);

  var align = this.percentDone() > .5 ? "end" : "start";

  if (this.progressText) {
    this.svg.removeChild(this.progressText);
  }


  this.progressText = this.newElt("text", {'x': text_x, 'y': text_y, "text-anchor":align, 'class':'status'}, 
    this.svgDocument.createTextNode(this.status));
  this.svg.appendChild(this.progressText);

} /* }}} */
AJAXOmeter.prototype.elt                         = function (id) { /* {{{ */
  return this.svgDocument.getElementById(id);
} /* }}} */
AJAXOmeter.prototype.ping                        = function (toCallWhenDone) { /* {{{ */
  var self = this;
  var start = new Date();
  self.terminalPrint("ping() -> ");

  pull("ajaxometer.php?len=1", "", function () {
    var end = new Date();
    var latency = end.getTime() - start.getTime();
    self.latency_tot += latency;
    self.latency_ct  += 1;
    self.lastRunTime  = latency;
    self.updateStats();
    self.terminalPrint("ping() -> " + latency + " ms", true);
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.downloadTest                = function (size, toCallWhenDone) { /* {{{ */
  var self = this;

  self.terminalPrint("download("+prettySize(size)+") -> ");

  var start = new Date();
  pull("ajaxometer.php?len="+size,"", function () {
    var end = new Date();
    self.lastRunTime = end.getTime() - start.getTime();
    var downloadTime = (self.lastRunTime - self.getAvgLatency()) * 0.001;
    self.downloaded      += size;
    self.downloaded_time += downloadTime;
    self.terminalPrint("download("+prettySize(size)+") -> " + self.lastRunTime + " ms", true);
    self.updateStats();
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.uploadTest                  = function (size, toCallWhenDone) { /* {{{ */
  var self = this;
  var data = genStr(size);

  self.terminalPrint("upload("+prettySize(size)+") -> ");

  var start = new Date();
  pull("ajaxometer.php","data="+data, function () {
    var end = new Date();
    self.lastRunTime = end.getTime() - start.getTime();
    var uploadTime = (self.lastRunTime - self.getAvgLatency()) * 0.001;
    self.uploaded      += size;
    self.uploaded_time += uploadTime;
    self.terminalPrint("upload("+prettySize(size)+") -> " + self.lastRunTime + " ms", true);
    self.updateStats();
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.calibrate                   = function (toCallWhenDone) { /* {{{ */
  var self = this;
  var total_dl_calib = 0;
  var total_ul_calib = 0;
  var calibration_slack = 0.92;

  function runPingTest(ct, toCallWhenDone) {
    if (ct > 0) {
      self.numPingsRan++;
      self.ping(function () { runPingTest(ct-1, toCallWhenDone); });
    } else {
      self.snapshotProgress("Latency: ~" + self.getAvgLatency() + " ms");
      self.printResults("Request Latency: ~" + self.getAvgLatency() + " ms");
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function runDownloadTest(size, toCallWhenDone) {
    self.totalDLCalibrationTime += self.lastRunTime;
    if (self.lastRunTime < AJAXOmeterTestTime * calibration_slack) {
      if (self.lastRunTime*2 > AJAXOmeterTestTime) 
        size *= (AJAXOmeterTestTime/self.lastRunTime)*0.6;
      self.numDLCalibration++;
      self.downloadTest(size, function () { runDownloadTest(size*2, toCallWhenDone); });
    } else {
      self.goodDLSize = size * .5 * (AJAXOmeterTestTime/self.lastRunTime); 
      self.terminalPrint("DL Size Calibrated: " + prettySize(self.goodDLSize));
      self.printResults("Test Download Size: " + prettySize(self.goodDLSize) + "B");
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function runUploadTest(size, toCallWhenDone) {
    self.totalULCalibrationTime += self.lastRunTime;
    if (self.lastRunTime < AJAXOmeterTestTime * calibration_slack) {
      if (self.lastRunTime*2 > AJAXOmeterTestTime) 
        size *= (AJAXOmeterTestTime/self.lastRunTime)*0.6; 
      self.numULCalibration++;
      self.uploadTest(size, function () { runUploadTest(size*2, toCallWhenDone); });
    } else {
      self.goodULSize = size * .5 * (AJAXOmeterTestTime/self.lastRunTime); 
      self.terminalPrint("UL Size Calibrated: " + prettySize(self.goodULSize));
      self.printResults("Test Upload Size: " + prettySize(self.goodULSize) + "B");
      self.snapshotProgress("Calibration Done");
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }


  runPingTest(AJAXOmeterNumPingsToRun, function () { 
    self.lastRunTime = 0;
    runDownloadTest(1024, function () {
      self.lastRunTime = 0;
      runUploadTest(1024, toCallWhenDone);
    }); 
  });
} /* }}} */
AJAXOmeter.prototype.speedTest                   = function () { /* {{{ */
  var self = this;


  function runDLTest(ct, toCallWhenDone) {
    if (ct > 0) {
      self.downloadTest(self.goodDLSize, function () { 
          self.numDLReal++;
          runDLTest(ct-1, toCallWhenDone); });
    } else {
      self.snapshotProgress("Download: ~" + self.getAvgDLRate());
      self.printResults("Download Speed: " + self.getAvgDLRate());
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }
  function runULTest(ct, toCallWhenDone) {
    if (ct > 0) {
      self.uploadTest(self.goodULSize, function () { 
          self.numULReal++;
          runULTest(ct-1, toCallWhenDone); });
    } else {
      self.snapshotProgress("Upload: ~" + self.getAvgULRate());
      self.printResults("Upload Speed: " + self.getAvgULRate());
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function printSummary() {
    self.printSummary("Estimated Line Type: " + self.estimateLineType());
    self.printSummary("( ~" + (self.getAvgDLbps()/AJAXOmeterAvgModemSpeed).toFixed(1) + " x faster than avg. modem speeds)");
    /*
    self.printSummary("  faster than a 56k modem");
    */
    self.printSummary("Time to load an average web page: ~" + ((AJAXOmeterAvgWebPageSize*8)/self.getAvgDLbps()).toFixed(2) + " s");
    self.printSummary("Time to download 10MB file: ~" + ((10000000*8)/self.getAvgDLbps()).toFixed(0) + " s");
  }

  function RunSpeedTests () {
    self.downloaded      = 0;
    self.downloaded_time = 0;
    self.uploaded        = 0;
    self.uploaded_time   = 0;
    runULTest(AJAXOmeterNumDLsToRun, function () {
      runDLTest(AJAXOmeterNumULsToRun, function () { 
        self.printResults("Speed Test Finished.");
        printSummary();
        self.updateStats();
      });
    });
  }

  this.calibrate(RunSpeedTests);

} /* }}} */
AJAXOmeter.prototype.terminalPrint               = function (str, replaceLastLine) { /* {{{ */
  var line = this.newTextOnPath(str, "M0 200 L1200 200", {'class':'terminal'});
  this.svg.appendChild(line);

  if (replaceLastLine) {
    var last = this.terminalBuffer.pop();
    this.svg.removeChild(this.elt('defsPath'+last.pathId));
    this.svg.removeChild(last.line);
  }

  this.terminalBuffer.push({'str':str, 'line':line, 'pathId':this.path_id});
  
  var ypos = AJAXOmeterTerminalLineHeight;
  for (var i=this.terminalBuffer.length-1; i >= 0; --i) {


    if (ypos > AJAXOmeterViewHeight) {
      if (this.terminalBuffer[i].line != null) {
        this.svg.removeChild(this.elt('defsPath'+this.terminalBuffer[i].pathId));
        this.svg.removeChild(this.terminalBuffer[i].line);
        this.terminalBuffer[i].line = null;
        break;
      }
    } else {
      this.elt('textPath'+this.terminalBuffer[i].pathId).setAttributeNS(null, "d", 
        "M10 " + ypos + " L" + AJAXOmeterViewWidth + " " + ypos);
    }
    ypos += AJAXOmeterTerminalLineHeight;
  }


} /* }}} */
AJAXOmeter.prototype.printResults                = function (str) { /* {{{ */
  this.svg.appendChild(this.newText(str, {x:this.results_x, y:this.results_y}));
  this.results_y += AJAXOmeterTerminalLineHeight;
} /* }}} */
AJAXOmeter.prototype.printSummary                = function (str) { /* {{{ */
  if (this.summaryStubText != null) {
    this.svg.removeChild(this.summaryStubText);
    this.summaryStubText = null;
  }

  this.svg.appendChild(this.newText(str, {x:this.summary_x, y:this.summary_y}));
  this.summary_y += AJAXOmeterTerminalLineHeight;
} /* }}} */
AJAXOmeter.prototype.percentDone                 = function () { /* {{{ */
  var PingsPortion              = 0.125;
  var DLCalibrationPortion      = 0.125;
  var ULCalibrationPortion      = 0.125;
  var DLRealPortion             = 0.3125;
  var ULRealPortion             = 0.3125;

  //var magicCalibrationTimeRatio = 2.7;
  var magicCalibrationTimeRatio = 2.5;
  var magicCalibrationTime      = AJAXOmeterTestTime * magicCalibrationTimeRatio;

  var DLCalibDone               = this.totalDLCalibrationTime / magicCalibrationTime;
  var ULCalibDone               = this.totalULCalibrationTime / magicCalibrationTime;
  DLCalibDone                   = DLCalibDone > 1 ? 1 : DLCalibDone;
  ULCalibDone                   = ULCalibDone > 1 ? 1 : ULCalibDone;
  DLCalibDone                   = this.numDLReal > 0 ? 1 : DLCalibDone;
  ULCalibDone                   = this.numULReal > 0 ? 1 : ULCalibDone;



  return 0.0
    + (this.numPingsRan / AJAXOmeterNumPingsToRun) * PingsPortion 
    + DLCalibDone * DLCalibrationPortion 
    + ULCalibDone * ULCalibrationPortion 
    + (this.numDLReal / AJAXOmeterNumDLsToRun) * DLRealPortion 
    + (this.numULReal / AJAXOmeterNumULsToRun) * ULRealPortion 
    ;
} /* }}} */
AJAXOmeter.prototype.snapshotProgress            = function (txt) { /* {{{ */
  this.status = txt;
  this.updateStats();

  this.progressTriangle = this.progressTriangle.cloneNode(true);
  this.svg.appendChild(this.progressTriangle);

  this.progressText = this.progressText.cloneNode(true);
  this.svg.appendChild(this.progressText);

  this.status = "";

} /* }}} */
AJAXOmeter.prototype.getAvgLatency               = function () { /* {{{ */
  return (this.latency_tot/this.latency_ct).toFixed(1)
} /* }}} */
AJAXOmeter.prototype.getAvgDLRate                = function () { /* {{{ */
  return prettySize((this.downloaded*8)/this.downloaded_time) + "b/s";
} /* }}} */
AJAXOmeter.prototype.getAvgULRate                = function () { /* {{{ */
  return prettySize((this.uploaded*8)/this.uploaded_time) + "b/s";
} /* }}} */
AJAXOmeter.prototype.getAvgDLbps                 = function () { /* {{{ */
  return (this.downloaded*AJAXOmeterProtocolOverhead*8)/this.downloaded_time;
} /* }}} */
AJAXOmeter.prototype.getAvgULbps                 = function () { /* {{{ */
  return (this.downloaded*AJAXOmeterProtocolOverhead*8)/this.downloaded_time;
} /* }}} */
AJAXOmeter.prototype.estimateLineType            = function () { /* {{{ */
  var ubps          = this.getAvgULbps();
  var dbps          = this.getAvgDLbps();
  var minErr        = 99999;
  var name          = "";
  var errThreshold  = 1.1;

  for (var i in AJAXOmeterLineTypes) {
    var line = AJAXOmeterLineTypes[i];

    if (ubps > line.up*errThreshold || dbps > line.down*errThreshold)
      continue;


    var err = Math.abs(1-line.up/ubps) + Math.abs(1-line.down/dbps);
    if (err < minErr) { 
      minErr = err;
      name = line.name;
    }
  }

  return name;
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
     html += size.toFixed(0) + " B";
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


var _Objs = new Array(); /* for _(set|get|push)Obj */
function setObj(id, o) { /* {{{ */
  _Objs[id] = o;
} /* }}} */
function getObj(id) { /* {{{ */
  if (id == null) return null;
  return _Objs[id];
} /* }}} */
function pushObj(o) { /* {{{ */
  _Objs.push(o);
  return _Objs.length-1;
} /* }}} */

/* }}} */
