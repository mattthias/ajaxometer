<?php
$ajaxometer_width  = 400;
$ajaxometer_height = 300;

if (isset($_REQUEST['len']))  { die(str_repeat("x", $_REQUEST['len'])); }
if (isset($_REQUEST['data'])) { die ("null"); }
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
  <title>AJAXOmeter Speed Test Utility</title>
</head>
<body>

<!-- Cut Here (don't forget to set $ajaxometer_width and $ajaxometer_height) -->

<?php if (preg_match("/MSIE/", $_SERVER['HTTP_USER_AGENT'])) { ?>
<script type="text/javascript">
  try {
    new ActiveXObject("Adobe.SVGCtl");
    document.write('<embed src="ajaxometer.svg" width="<?= $ajaxometer_width;?>" height="<?= $ajaxometer_height;?>" type="image/svg+xml" />');
  } catch (e) {
    document.write('No SVG Capabilities detected!<br> Unfortunatly you need this to run the speed test. You can download Adobe\'s SVG plugin for free from <a href="http://www.adobe.com/svg/viewer/install/main.html">here</a>. Alternativly, more advanced browsers such as <a href="http://getfirefox.com/">Mozilla Firefox</a> and <a href="http://www.opera.com/">Opera</a> have SVG capability built in and will allow you to use the AJAXOmeter.');
  }
</script>
<?php } else { ?>
<embed src="ajaxometer.svg" width="<?= $ajaxometer_width;?>" height="<?= $ajaxometer_height;?>" type="image/svg+xml" />
<?php } ?>

<!-- End Paste -->

</body>
</html>
