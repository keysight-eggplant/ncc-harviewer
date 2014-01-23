/**
 * NCC Web Performance HAR Viewer
 * Requires: jQuery 1.8+, jQueryUI, Highcharts 3+
 * 
 * Version 2.1
 * 
 * http://github.com/brassic-lint/ncc-harviewer
 * 
 */

function SanitiseTimings(input){
	
	if (input < 0) { 
		output = 0; 
	} else {
		output = input;
	}
	
	//convert ms to s
	output = output / 1000;
	output = Math.round(output * 1000) / 1000;
	return output;
}

function SanitiseSize(input){
	
	if (input < 0) { 
		output = 0; 
	} else {
		output = input;
	}
	
	return output;
}

function getViewportWidth() {
	var viewPortWidth;
	
	// the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
	if (typeof window.innerWidth != 'undefined') {
	  viewPortWidth = window.innerWidth;
	}
	// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
	else if (typeof document.documentElement != 'undefined'	&& typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
	   viewPortWidth = document.documentElement.clientWidth;
	}
	// older versions of IE
	else {
		viewPortWidth = document.getElementsByTagName('body')[0].clientWidth;
		}
	return viewPortWidth;
}

function TruncateURL (inputURL) {
	var TruncatedURL ="";
	
	if (inputURL.length > 40){
		TruncatedURL = inputURL.substring(0,15) + "..." + inputURL.slice(-16);
	} else {
		TruncatedURL = inputURL;
	}
	return TruncatedURL;	
}

function renderHAR(harfile){
	
	//Parse HAR file
	var parsedHAR = $.parseJSON(harfile);

	//declare HARpages obj
	var HARpages = {pages: []};

	//Loop log.pages -> array for each page (URL, timings, diags)
	$.each(parsedHAR.log.pages, function(i,pagesdata) {
		//initialise page object
		var pages = { 
			id: pagesdata.id,
			objects: []
		};
		
		//onload
		if ("onLoad" in pagesdata.pageTimings){
			pages.onLoadTime = SanitiseTimings(pagesdata.pageTimings.onLoad);
		}
		
		//renderstart (WPT)
		if ("_startRender" in pagesdata.pageTimings){
			pages.RenderStartTime = SanitiseTimings(pagesdata.pageTimings._startRender);
		}
	
		//get base time
		var basetime = new Date(pagesdata.startedDateTime);
		
		//foreach log.entries in parsedHAR
		$.each(parsedHAR.log.entries, function(j,entries) {		
			//if log.entries.pageref == log.pages.id
			if(entries.pageref == pagesdata.id){
				
				//calculate offset
				var startTime = new Date(entries.startedDateTime);
				var offset = startTime - basetime;
				
				//Correct Connect time value
				if("ssl" in entries.timings) {
					var NewConnectTime = SanitiseTimings(entries.timings.connect) - SanitiseTimings(entries.timings.ssl);
				} else{
					var NewConnectTime = SanitiseTimings(entries.timings.connect);
				}
				
				NewConnectTime = Math.round(NewConnectTime * 1000) / 1000;
				
				
				//calculate totaltime & round it
				var totalTime = SanitiseTimings(entries.timings.receive) + SanitiseTimings(entries.timings.wait) + SanitiseTimings(entries.timings.send) + SanitiseTimings(entries.timings.ssl) + SanitiseTimings(entries.timings.connect) + SanitiseTimings(entries.timings.dns);
				totalTime = Math.round(totalTime*1000) / 1000;
				
				
				//build diags text
				var diagsText = "";
				diagsText = diagsText + "<p class='diagsHeader'>Request</p>";
				diagsText = diagsText + "<table>";
				$.each(entries.request.headers, function(j, cont) {
					diagsText = diagsText + "<tr><td class='diagsName'>" + cont.name + "</td><td class='diagsValue'>" + cont.value + "</td></tr>";
				});
				diagsText = diagsText + "</table>";
				
				diagsText = diagsText + "<p class='diagsHeader'>Response</p>";
				diagsText = diagsText + "<table>";
				$.each(entries.response.headers, function(j, cont) {
					diagsText = diagsText + "<tr><td class='diagsName'>" + cont.name + "</td><td class='diagsValue'>" + cont.value + "</td></tr>";
				});
				diagsText = diagsText + "</table>";
				
				if ("text" in entries.response.content){
						
					if(entries.response.content.mimeType.substring(0,4) == "text") {
						diagsText = diagsText + "<p class='diagsHeader'>Content</p>";
						HTMLoutput = entries.response.content.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
						diagsText = diagsText + "<pre>" + HTMLoutput + "</pre>";
					}
					
					if(entries.response.content.mimeType.substring(0,5) == "image") {
						diagsText = diagsText + "<p class='diagsHeader'>Content</p>";
						HTMLoutput = '<img src="data:' + entries.response.content.mimeType + ';base64,' + entries.response.content.text + '">';
						diagsText = diagsText + "<p>" + HTMLoutput + "</p>"; 	
					}
					
				}
				
				//create object array
				var entryData = { 
					URL: entries.request.url,
					TransSize: SanitiseSize(entries.response.bodySize),	
					UncompSize: SanitiseSize(entries.response.content.size),
					ReqHeaderSize: SanitiseSize(entries.request.headersSize),
					ReqContentSize: SanitiseSize(entries.request.bodySize),	
					RespHeaderSize: SanitiseSize(entries.response.headersSize),	
					OffsetTime: SanitiseTimings(offset),
					DNSTime: SanitiseTimings(entries.timings.dns),
					ConnectTime: NewConnectTime,	
					SSLConnTime: SanitiseTimings(entries.timings.ssl),
					ReqSentTime: SanitiseTimings(entries.timings.send),	
					DataStartTime: SanitiseTimings(entries.timings.wait),	
					ContentTime: SanitiseTimings(entries.timings.receive),
					TotalTime: totalTime,	
					HTTPStatus: entries.response.status,
					DiagHTML: diagsText,
					StartTime: entries.startedDateTime
				};
				
				//push objects into pages
				pages.objects.push(entryData);
			//
			}
		//
		});
		
		//sort objects by offset ascending
		pages.objects.sort(function(a,b) { return parseFloat(a.OffsetTime) - parseFloat(b.OffsetTime) } );
		
		//push page into main object	
		HARpages.pages.push(pages);

	});

	
    
	//Loop each page to draw Waterfall & table (tabs??)
	x = 0;
	
	
	$.each(HARpages.pages, function(i,val) {
		
		x++;
		
		//Set up the draw area
		var ChartDIV = 'chart_' + x;
		var tableID = 'logs_' + x;
		hashtableID = '#' + tableID;
		hashtabsID = '#tabs_' + x;
		
		$('body').append('<div class="page_collapsible" id="section' + x + '"><span></span>Step ' + x + '</div><div class="container"><div class="content"><div id="tabs_' + x + '"><ul><li><a href="#tabs-1">Waterfall</a></li><li><a href="#tabs-2">Table</a></li></ul><div id="tabs-1"><div id="'+ChartDIV+'"></div></div><div id="tabs-2"><div id="timingsTable"><table id="' + tableID +'" border="1"><thead><tr><th>Object URL</th><th>Trans.</th><th>Uncomp.</th><th>Req. Header</th><th>Req. Content</th><th>Resp. Header</th><th>Offset</th><th>DNS</th><th>Connect</th><th>SSL Conn.</th><th>Req. Sent</th><th>Data Start</th><th>Content</th><th>Total</th><th>Status</th><th>Diag</th></tr></thead></table></div></div></div></div></div>');
		
		
		//draw waterfall
		var options = {
	    	'chart':{
				'zoomType':'xy',
				'defaultSeriesType':'bar',
				},
			'exporting':{
				'enabled':true
				},
			'title':{
				'margin':60
				},
			'subtitle':{
				'text':'',
				'margin':10
				},   
			'legend':{
				'align':'center',
				'backgroundColor':'#FFFFFF',
				'layout':'horizontal',
				'reversed':true,
				'y':-5
				},
			'credits':{
				'enabled':true,
				'href':'',
				'position':{
					'x':-15
					},
				'text':'Copyright NCC Group Website Performance'
				},
			'plotOptions':{
				'series':{
					'stacking':'normal',
					'shadow':false,
					'borderWidth':0,
					'animation':false,
					'pointPadding':0
					}
				},
			'yAxis':{
				'title':{
					'text':'Seconds'
					},
				'plotLines': [
					{
			            'color': 'red',
			            'width': 1,
			            'label':{}
			        },
		            {
		            	'color': 'green',
			            'width': 1,
			            'label':{}	
		            	
		            }] 
			},
			'xAxis':{
				'title':{
					'text':'Objects'
					},
				'categories': [],
				'opposite':true
			},
			
			'series':[
				{
			 	'name':'Content Download',
	         	'color':'#FF8500',
	         	'data':[]
	        },
			{
				'name':'Data Start',
				'color':'#66B3FF',
				'data':[]
	        },
	      	{
	        	'name':'Request Sent',
	        	'color':'#00FF00',
	         	'data':[]
	       	},
	        {
	         	'name':'SSL Connect',
	         	'color':'#FFCC33',
	         	'data':[]
	        },
	        {
	         	'name':'Connect',
	         	'color':'#995500',
	         	'data':[]
	        },
	        {
	         	'name':'DNS',
	         	'color':'#005CBB',
	         	'data':[]
	        },
	      	{
	         	'name':'Offset',
	         	'pointWidth':0,
	         	'color':'#FFFFFF',
	         	'data':[]
	        }
	        ]
	    };
		
		options.chart.renderTo = ChartDIV;
		options.chart.height = 200 + (val.objects.length * 20);
		options.chart.width = getViewportWidth() - 100;
		options.title.text = "Component Timing Breakdown<br>" +  val.objects[0].URL;
		
		//onload
		options.yAxis.plotLines[0].value = val.onLoadTime;
		options.yAxis.plotLines[0].label.text = "onLoad (" + val.onLoadTime + ")";
		
		
		//renderstart (WPT)
		options.yAxis.plotLines[1].value = val.RenderStartTime;
		options.yAxis.plotLines[1].label.text = "Render Start (" + val.RenderStartTime + ")";
			
		$.each(val.objects, function(j,objects) {
			if (objects.URL.substring(0,4) != "data" && objects.URL.substring(0,6) != "chrome") {
					
				options.xAxis.categories.push(TruncateURL(objects.URL));
				
				options.series[0].data.push(objects.ContentTime);
				options.series[1].data.push(objects.DataStartTime);
				options.series[2].data.push(objects.ReqSentTime);
				options.series[3].data.push(objects.SSLConnTime);
				options.series[4].data.push(objects.ConnectTime);
				options.series[5].data.push(objects.DNSTime);
				options.series[6].data.push(objects.OffsetTime);
			}
		});
		
		var chart = new Highcharts.Chart(options);
		
		//write table

		y=0;
		$.each(val.objects, function(j,objects) {
			y++;
			if (objects.HTTPStatus > 399) {
				trFormat = '<tr class="non200">';
			} else {
				trFormat = '<tr>';
			}		
			$(hashtableID).append(trFormat + "<td title='" + objects.URL + "'>" + TruncateURL(objects.URL) + "&nbsp;&nbsp;<a href='"+ objects.URL + "' target='_blank'><img src='./images/openpopup.png' alt='" + objects.URL + "'/></a></td><td>"+ objects.TransSize + "</td><td>"+ objects.UncompSize + "</td><td>" + objects.ReqHeaderSize + "</td><td>" + objects.ReqContentSize + "</td><td>" + objects.RespHeaderSize + "</td><td>" + objects.OffsetTime + "</td><td>" + objects.DNSTime + "</td><td>" + objects.ConnectTime + "</td><td>" + objects.SSLConnTime + "</td><td>" + objects.ReqSentTime + "</td><td>" + objects.DataStartTime + "</td><td>" + objects.ContentTime + "</td><td>" + objects.TotalTime + "</td><td>" + objects.HTTPStatus + "</td><td><a onclick=\"$( '#" + tableID + '_diag_'+ y + "' ).dialog({width:600, maxHeight:600});\"><img src='images/diagnostics_on.gif' alt='Diagnostics'></a></td></tr>");
			$('body').append('<div id="' + tableID + '_diag_'+ y + '" title="Diagnostics for ' + objects.URL +'" style="display: none; width=250px;"><p>' + objects.DiagHTML + '</p></div>');
		});
		$( hashtabsID ).tabs();
	});
	$(function() {
		$( ".page_collapsible" ).collapsible();
		$("#instructions").hide();
		
	});
}