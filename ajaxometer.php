<?php
/* Copyright (c) 2006, Lobo Internet Services, Ltd.  All rights reserved. */

$ajaxometer_width  = 800;
$ajaxometer_height = 600;

if (isset($_REQUEST['len']))  { die(str_repeat("x", $_REQUEST['len'])); }
if (isset($_REQUEST['data'])) { die ("null"); }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
  <title>AJAXOmeter Speed Test Utility</title>
  <script type="text/javascript" src="ajaxometer.js"></script>
</head>
<body>

<!-- Cut Here (don't forget to set $ajaxometer_width and $ajaxometer_height) -->

<script language="JavaScript" type="text/javascript" src="ajaxometer.js"></script>
<script language="JavaScript">
// Boolean variable to keep track of user's SVG support
var hasSVGSupport = false;

// Boolean to determine if we need to use VB Script method or not to find SVG support
var useVBMethod = false;

/* Internet Explorer returns 0 as the number of MIME types,
   so this code will not be executed by it. This is our indication
  to use VBScript to detect SVG support.  */ 
if (navigator.mimeTypes != null && navigator.mimeTypes.length > 0) {
	if (navigator.mimeTypes["image/svg-xml"] != null)
		hasSVGSupport = true;
} else {
  try {
    new ActiveXObject("Adobe.SVGCtl");
    hasSVGSupport = true;
  } catch (e) {
    hasSVGSupport = false;
  }
}

if (/Firefox\/[2-9]./.test(navigator.userAgent)) {
		hasSVGSupport = true;
}


if (hasSVGSupport) {
  if (/Microsoft Internet Explorer/.test(navigator.appName)) {
    document.write('<embed src="ajaxometer.svg" width="<?= $ajaxometer_width;?>" height="<?= $ajaxometer_height;?>" type="image/svg+xml" />');
  } else {
    document.write('<object type="image/svg+xml" data="ajaxometer.svg" width="<?= $ajaxometer_width; ?>" height="<?= $ajaxometer_height; ?>" />');
  }
} else {
  document.write('No SVG Capabilities detected! That sucks! This speed test is MUCH prettier ');
  document.write('if you have a browser capable of SVG! You can remedy this in any one of three ways: ');
  document.write('<ol>');
  document.write('<li>Download the Adobe SVG plugin from <a href="http://www.adobe.com/svg/viewer/install/main.html">here</a>.</li>');
  document.write('<li> Download the latest version of Mozilla Firefox from <a href="http://getfirefox.com/">here</a>. </li>');
  document.write('<li> Download the latest version of Opera from <a href="http://www.opera.com/">Opera</a>.</li> ');
  document.write('</ol>');
  document.write('<div id="AJAXOmeterPlainOutput">Starting Speed Test...<br></div>');

  new AJAXOmeter(null);
}

</script>
<noscript>
  Unfortunately, your browser either doesn't have support for JavaScript, or 
  its not enabled. This speed test requires both. If you do not feel
  comfortable enabling JavaScript in your current browser for security 
  reasons, try using a more secure browser such as
  Mozilla Firefox (<a href="http://www.getfirefox.com/">http://www.getfirefox.com/</a>) or
  Opera (<a href="http://www.opera.com/">http://www.opera.com/</a>).
</noscript>

<!-- End Paste -->




</body>
</html>
