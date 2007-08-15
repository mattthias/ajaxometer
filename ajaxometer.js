/* Copyright (c) 2007, Akita Noek.  All rights reserved. */


/** Config **/
/* This controls how long a download should take. */
var AJAXOmeterTestTime            = 1000;      // in miliseconds (this will only be an aproximation)
var AJAXOmeterTerminalLineHeight  = 40;
var AJAXOmeterNumPingsToRun       = 15;
var AJAXOmeterNumDLsToRun         = 5;
var AJAXOmeterNumULsToRun         = 5;
var AJAXOmeterAvgModemSpeed       = 28800;
var AJAXOmeterAvgWebPageSize      = 130000;
var AJAXOmeterProtocolOverhead    = 1.08;      // +8% or there abouts ... 
var AJAXOmeterCalibrationSlack    = 0.86;      /* seems like a good magic number?  Decrease this if you are
                                                * on a jittery network or running at high speeds (>=Gb networks). */
var AJAXOmeterInitialDownloadSize = 4096;      /* bytes */
var AJAXOmeterInitialUploadSize   = 4096;      /* bytes */
var AJAXOmeterMaxCalibrationSteps = 20;        /* In most cases we don't need this many and will exit before this, but when 
                                                * we have a lot of jitter we need to limit our selves so we don't attemp to
                                                * sit there and calibrate in a sea of chaos network chaos... */
var AJAXOmeterMinCalibrationSteps = 4;         /* Always calibrate a little bit .. */
var AJAXOmeterMaxUploadSize       = 8388000;   /* 8 MB. This is the default post size limit for 
                                                * most server setups, so more than this is useless. 
                                                * Note: Opera browsers don't seem to let JS allocate 8MB, so
                                                *       in the browser detection code this is again capped to
                                                *       3.5 MB, if you don't it lower here.  */
var AJAXOmeterMaxDownloadSize     = 67108864;  /* 64 MB. Be sure to set this in ajaxometer.php too. */

/* Only change these if you are messing with the .svg file. */
var AJAXOmeterViewWidth           = 1600;      // you need to change this in the .svg file as well.
var AJAXOmeterViewHeight          = 1200;      // you need to change htis in the .svg file as well.



// all measurements in bits
var AJAXOmeterLineTypes = new Array(
       {name: '14.4k Modem'         , up:14400.0       , down:14400.0       } 
     , {name: '28.8k Modem'         , up:28800.0       , down:28800.0       } 
     , {name: '56k Modem'           , up:56000.0       , down:56200.0       } 
     , {name: '1.5M ADSL'           , up:512000.0      , down:1500000.0     } 
     , {name: 'T1'                  , up:1544000.0     , down:1544000.0     } 
     , {name: 'E1'                  , up:2048000.0     , down:2048000.0     } 
     , {name: 'Dual T1'             , up:3088000.0     , down:3088000.0     } 
     , {name: '7M ADSL'             , up:1000000.0     , down:7000000.0     } 
     , {name: 'High Speed Wireless' , up:7000000.0     , down:7000000.0     } 
     , {name: '10M Ethernet'        , up:10000000.0    , down:10000000.0    } 
     , {name: 'T3'                  , up:44736000.0    , down:44736000.0    } 
     , {name: 'OC1'                 , up:51800000.0    , down:51800000.0    } 
     , {name: '100M Ethernet'       , up:100000000.0   , down:100000000.0   } 
     , {name: 'OC3'                 , up:155000000.0   , down:155000000.0   } 
     , {name: 'T4'                  , up:274760000.0   , down:274760000.0   } 
     , {name: 'OC12'                , up:622000000.0   , down:622000000.0   } 
     , {name: '1G Ethernet'         , up:1000000000.0  , down:1000000000.0  } 
     , {name: 'OC48'                , up:2500000000.0  , down:2500000000.0  } 
     , {name: 'OC192'               , up:9600000000.0  , down:9600000000.0  } 
     , {name: '10G Ethernet'        , up:10000000000.0 , down:10000000000.0 } 
  );




/** Browser Detection **/
var AJAXOmeterBrowser = "";
if (/Opera/.test(navigator.userAgent)) {
  AJAXOmeterBrowser="opera";
  if (AJAXOmeterMaxUploadSize > 3670016) 
    AJAXOmeterMaxUploadSize = 3670016.0;   /* 3.5 MB. limit Opera doesn't like to let JS have much memory I guess */
}
else if (/Microsoft Internet Explorer/.test(navigator.appName))
  AJAXOmeterBrowser="ie";
else if (/Adobe/.test(navigator.appName)) // We can also be in the Adobe SVG Viewer ... its probably not really correct to assume ie, but oh well. 
  AJAXOmeterBrowser="ie";
else
  AJAXOmeterBrowser="mozilla";




/** Code **/
function AJAXOmeter(e) { /* {{{ */
  var self = this;
  
  this.status                 = "";
  this.latency                = new Array();
  this.downbps                = new Array();
  this.upbps                  = new Array();
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

  
  if (e) {
    this.svgDocument            = e.target.ownerDocument;
    this.svg                    = this.svgDocument.documentElement;


    this.results_x              = parseInt(this.elt("results").getAttributeNS(null, "x")) + 20;
    this.results_y              = parseInt(this.elt("results").getAttributeNS(null, "y")) + AJAXOmeterTerminalLineHeight;
    this.summary_x              = parseInt(this.elt("summary").getAttributeNS(null, "x")) + 20;
    this.summary_y              = parseInt(this.elt("summary").getAttributeNS(null, "y")) + AJAXOmeterTerminalLineHeight;


    this.summaryStubText = this.newText("Running Tests...", {x:this.summary_x+230, y:this.summary_y+75} );
    this.svg.appendChild(this.summaryStubText);
  } else {
    this.svg         = null;
    this.svgDocument = null;
  }


  this.updateStats();
  this.speedTest();
} /* }}} */

AJAXOmeter.prototype.newElt                      = function (type) { /* {{{ */
  if (this.svg == null) return;
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
AJAXOmeter.prototype.newText                     = function (txt, config) { /* {{{ */
  if (this.svg == null) return;

  var data = this.svgDocument.createTextNode(txt);

  var textNode = this.newElt("text", config, data);
  return textNode;
} /* }}} */
AJAXOmeter.prototype.updateStats                 = function () { /* {{{ */
  if (this.svg == null) return;

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
  if (this.svg == null) return null;

  return this.svgDocument.getElementById(id);
} /* }}} */
AJAXOmeter.prototype.ping                        = function (toCallWhenDone) { /* {{{ */
  var self = this;
  self.terminalPrint("ping() -> ");

  var start = new Date();
  //pull("ajaxometer.php?len=1", "", function () {
  pull("ajaxometer.ping", "", function () {
    var end = new Date();
    var latency = end.getTime() - start.getTime();
    self.latency.push(latency);
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
    self.downbps.push(size/downloadTime);
    self.terminalPrint("download("+prettySize(size)+") -> " + self.lastRunTime + " ms", true);
    self.updateStats();
    if (toCallWhenDone) { toCallWhenDone(); }
  });

} /* }}} */
AJAXOmeter.prototype.uploadTest                  = function (size, toCallWhenDone) { /* {{{ */
  var self = this;

  if (this.data_size == null || this.data_size != size)
    this.data = "data="+genStr(size); /* When we kick it into high gear on fast networks, lets not eat up all our ram. */
  this.data_size = size;

  self.terminalPrint("upload("+prettySize(size)+") -> ");

  var start = new Date();
  pull("ajaxometer.php", this.data, function () {
    var end = new Date();
    self.lastRunTime = end.getTime() - start.getTime();
    var uploadTime = (self.lastRunTime - self.getAvgLatency()) * 0.001;
    self.upbps.push(size/uploadTime);
    self.terminalPrint("upload("+prettySize(size)+") -> " + self.lastRunTime + " ms", true);
    self.updateStats();
    if (toCallWhenDone) { toCallWhenDone(); }
  });
} /* }}} */
AJAXOmeter.prototype.calibrate                   = function (toCallWhenDone) { /* {{{ */
  var self = this;
  var total_dl_calib = 0;
  var total_ul_calib = 0;

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
    if (self.numDLCalibration < AJAXOmeterMinCalibrationSteps ||
        (self.numDLCalibration < AJAXOmeterMaxCalibrationSteps &&
         ((self.lastRunTime < AJAXOmeterTestTime * AJAXOmeterCalibrationSlack) ||
          (self.lastRunTime > (AJAXOmeterTestTime*2))))) 
    {
      var oldSize = size;
      if (self.lastRunTime*2 > AJAXOmeterTestTime) 
        size *= (AJAXOmeterTestTime/self.lastRunTime)*0.6;
      if (size == Infinity) {
        size = oldSize;
        self.numDLCalibration = AJAXOmeterMaxCalibrationSteps;
      } else if (size > AJAXOmeterMaxDownloadSize) {
        size = AJAXOmeterMaxDownloadSize/2;
        self.numDLCalibration = AJAXOmeterMaxCalibrationSteps;
      }
      self.numDLCalibration++;
      self.downloadTest(size, function () { runDownloadTest(size*2, toCallWhenDone); });
    } else {
      self.goodDLSize = size * .5 * (AJAXOmeterTestTime/self.lastRunTime); 
      if (self.goodDLSize > AJAXOmeterMaxDownloadSize) {
        self.goodDLSize = AJAXOmeterMaxDownloadSize;
      }
      self.terminalPrint("DL Size Calibrated: " + prettySize(self.goodDLSize));
      self.printResults("Test Download Size: " + prettySize(self.goodDLSize));
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function runUploadTest(size, toCallWhenDone) {
    self.totalULCalibrationTime += self.lastRunTime;
    //if (self.lastRunTime < AJAXOmeterTestTime * AJAXOmeterCalibrationSlack) {
    if (self.numULCalibration < AJAXOmeterMinCalibrationSteps ||
        (self.numULCalibration < AJAXOmeterMaxCalibrationSteps &&
         ((self.lastRunTime < AJAXOmeterTestTime * AJAXOmeterCalibrationSlack) ||
          (self.lastRunTime > (AJAXOmeterTestTime*2))))) 
    {
      var oldSize = size;
      if (self.lastRunTime*2 > AJAXOmeterTestTime) 
        size *= (AJAXOmeterTestTime/self.lastRunTime)*0.6; 
      if (size == Infinity) {
        size = oldSize;
        self.numULCalibration = AJAXOmeterMaxCalibrationSteps;
      } else if (size > AJAXOmeterMaxUploadSize) {
        size = AJAXOmeterMaxUploadSize/2;
        self.numULCalibration = AJAXOmeterMaxCalibrationSteps;
      }
      self.numULCalibration++;
      self.uploadTest(size, function () { runUploadTest(size*2, toCallWhenDone); });
    } else {
      self.goodULSize = size * .5 * (AJAXOmeterTestTime/self.lastRunTime); 
      if (self.goodULSize > AJAXOmeterMaxUploadSize) {
        self.goodULSize = AJAXOmeterMaxUploadSize;
      }
      self.terminalPrint("UL Size Calibrated: " + prettySize(self.goodULSize));
      self.printResults("Test Upload Size: " + prettySize(self.goodULSize));
      self.snapshotProgress("Calibration Done");
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }


  runPingTest(AJAXOmeterNumPingsToRun, function () { 
    self.lastRunTime = 0;
    runDownloadTest(AJAXOmeterInitialDownloadSize, function () {
      self.lastRunTime = 0;
      runUploadTest(AJAXOmeterInitialUploadSize, toCallWhenDone);
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
      self.snapshotProgress("Download: " + self.getAvgDLRate());
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
      self.snapshotProgress("Upload: " + self.getAvgULRate());
      self.printResults("Upload Speed: " + self.getAvgULRate());
      if (toCallWhenDone != null) toCallWhenDone();
    }
  }

  function printSummary() {
    self.printSummary("Estimated Line Type: " + self.estimateLineType());
    self.printSummary("( ~" + (self.getAvgDLbps()/AJAXOmeterAvgModemSpeed).toFixed(1) + " x faster than avg. modem speeds)");
    self.printSummary("Time to load an average web page: ~" + ((AJAXOmeterAvgWebPageSize*8)/self.getAvgDLbps()).toFixed(2) + " s");
    self.printSummary("Time to download 10MB file: ~" + ((10000000*8)/self.getAvgDLbps()).toFixed(0) + " s");
  }

  function RunSpeedTests () {
    self.upbps   = new Array();
    self.downbps = new Array();
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
  if (this.svg == null) return;
  var line = this.newText(str, {'class':'terminal', "x":10, "y":200});
  this.svg.appendChild(line);

  if (replaceLastLine) {
    var last = this.terminalBuffer.pop();
    this.svg.removeChild(last.line);
  }

  this.terminalBuffer.push({'str':str, 'line':line});
  
  var ypos = AJAXOmeterTerminalLineHeight;
  for (var i=this.terminalBuffer.length-1; i >= 0; --i) {


    if (ypos > AJAXOmeterViewHeight) {
      if (this.terminalBuffer[i].line != null) {
        this.svg.removeChild(this.terminalBuffer[i].line);
        this.terminalBuffer[i].line = null;
        break;
      }
    } else {
      this.terminalBuffer[i].line.setAttributeNS(null, "y", ypos);
    }
    ypos += AJAXOmeterTerminalLineHeight;
  }
} /* }}} */
AJAXOmeter.prototype.printResults                = function (str) { /* {{{ */
  if (this.svg == null) {
    document.getElementById("AJAXOmeterPlainOutput").innerHTML += str + "<br>";
  } else {
    this.svg.appendChild(this.newText(str, {x:this.results_x, y:this.results_y}));
    this.results_y += AJAXOmeterTerminalLineHeight;
  }
} /* }}} */
AJAXOmeter.prototype.printSummary                = function (str) { /* {{{ */
  if (this.svg == null) {
    document.getElementById("AJAXOmeterPlainOutput").innerHTML += str + "<br>";
  } else {
    if (this.summaryStubText != null) {
      this.svg.removeChild(this.summaryStubText);
      this.summaryStubText = null;
    }

    this.svg.appendChild(this.newText(str, {x:this.summary_x, y:this.summary_y}));
    this.summary_y += AJAXOmeterTerminalLineHeight;
  }
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
  if (this.svg == null) return;

  this.status = txt;
  this.updateStats();

  this.progressTriangle = this.progressTriangle.cloneNode(true);
  this.svg.appendChild(this.progressTriangle);

  this.progressText = this.progressText.cloneNode(true);
  this.svg.appendChild(this.progressText);

  this.status = "";

} /* }}} */
AJAXOmeter.prototype.getAvgLatency               = function () { /* {{{ */
  this.latency.filterMin();
  return (this.latency.sum()/this.latency.length).toFixed(1);
} /* }}} */
AJAXOmeter.prototype.getAvgDLRate                = function () { /* {{{ */
  this.downbps.filterMax();
  return prettyRate(this.downbps.avg()*8);
} /* }}} */
AJAXOmeter.prototype.getAvgULRate                = function () { /* {{{ */
  this.upbps.filterMax();
  return prettyRate(this.upbps.avg()*8);
} /* }}} */
AJAXOmeter.prototype.getAvgDLbps                 = function () { /* {{{ */
  this.downbps.filterMax();
  return this.downbps.avg()*8*AJAXOmeterProtocolOverhead;
} /* }}} */
AJAXOmeter.prototype.getAvgULbps                 = function () { /* {{{ */
  this.upbps.filterMax();
  return this.upbps.avg()*8*AJAXOmeterProtocolOverhead;
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
function pull(src, post, callback, opt_method) { /* {{{ */
  //try {
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
    /*
  } catch (e) {
    if (opt_method != null) {
      if (!callback[opt_method]) {
        alert(opt_method + " was not found within class");
      }

      callback[opt_method]();
    } else if (callback) {
      callback();
    } 
  }
  */
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
function prettySize(size) { /* {{{ */
  var html = "";

  if (typeof(size) == "string") {
    size = parseFloat(size);
  }
  if (size > 1073741824) {
     html += (size/1073741824).toFixed(1) + " GB";
  } else if (size > 1048576) {
     html += (size/1048576).toFixed(1) + " MB";
  } else if (size > 1024) {
     html += (size/1024).toFixed(1) + " KB";
  } else {
     html += size.toFixed(0) + " B";
  }

  return html;
} /* }}} */
function prettyRate(bps) { /* {{{ */
  var rate = prettySize(bps);
  rate = rate.substring(0,rate.length-1) + 'b/s';
  return rate;
} /* }}} */
var n_genStr = 0;
function genStr(len) { /* {{{ */
    n_genStr = (n_genStr+1)%10;
    var ret = n_genStr+"";

    while (1) {
      if (ret.length > len) {
        return ret.substr(0, len);
      }
      if (ret.length*2 >= len) {
        return ret+ret.substr(0, len-ret.length);
      }
      ret += ret;
    }

  /* IE has issues creating 'big' arrays, so we need to work around it .. and not do something like this :( */
  /* 
    n_genStr = (n_genStr+1)%10;
    var seg_size = parseInt((parseInt(len+"")/100)+"");
    var rem_size = parseInt((parseInt(len+"")%100)+"");

    return new Array(100).join(new Array(seg_size).join(n_genStr+""))+new Array(rem_size).join(n_genStr);
  */
} /* }}} */

Array.prototype.sum                              = function() { /* {{{ */
	for(var i=0,sum=0;i<this.length;sum+=this[i++]);
	return sum;
} /* }}} */
Array.prototype.filterMin                        = function() { /* {{{ */
  var min = this.min();
  for (var i=0; i < this.length; ++i) {
    if (this[i] > (min*2)) {
      this.splice(i, 1);
      i-=1;
    }
  }
} /* }}} */
Array.prototype.filterMax                        = function() { /* {{{ */
  var max = this.max();
  for (var i=0; i < this.length; ++i) {
    if (this[i] < (max/2)) {
      this.splice(i, 1);
      i-=1;
    }
  }
} /* }}} */
Array.prototype.avg                              = function(){ /* {{{ */
  return this.sum()/this.length;
} /* }}} */
Array.prototype.min                              = function(){ /* {{{ */
	return Math.min.apply({},this)
} /* }}} */
Array.prototype.max                              = function(){ /* {{{ */
	return Math.max.apply({},this)
} /* }}} */

/* }}} */
