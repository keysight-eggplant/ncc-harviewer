ncc-harviewer
=============

A HAR viewer to display waterfall charts in the same format as the NCC Group Web Performance portal.

TODO:
* Styling for multi-page HARs
* Styling on Diagnostics popup
* Add NavTiming marks, e.g. Render Start to waterfall

CHANGELOG:
17/1/2014
* Diagnostics implemented

22/1/2014
v2.0 - Complete re-write
* Now supports multi-page HAR files
* Fixed SSL Timing Bug
* Fixed Ordering of requests

ISSUES:
* Diagnostics doesn't display content of JS files
* Offset bars on waterfall are visible since upgrade to latest Highcharts JS
* Must re-load page before dropping another HAR