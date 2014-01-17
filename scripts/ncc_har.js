/**
 * @author ghughes188
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

function drawWaterfall(hardata,targetdiv)
{
	var harfile = $.parseJSON(hardata);

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
    	
	var basetime = new Date(harfile.log.pages[0].startedDateTime);
	
    options.chart.renderTo = targetdiv;
	options.chart.height = 200 + (harfile.log.entries.length * 25);
	options.chart.width = getViewportWidth() - 100;
	options.title.text = "Component Timing Breakdown<br>" +  harfile.log.entries[0].request.url;
	
	var x = 0;
	
	$.each(harfile.log.entries, function(i, val) {
		if (val.request.url.substring(0,4) != "data" && val.request.url.substring(0,6) != "chrome") {
			
			x++;
			
			options.xAxis.categories.push(TruncateURL(val.request.url));
			
			options.series[0].data.push(SanitiseTimings(val.timings.receive));
			options.series[1].data.push(SanitiseTimings(val.timings.wait));
			options.series[2].data.push(SanitiseTimings(val.timings.send));
			options.series[3].data.push(SanitiseTimings(val.timings.ssl));
			options.series[4].data.push(SanitiseTimings(val.timings.connect));
			options.series[5].data.push(SanitiseTimings(val.timings.dns));
	
			var startTime = new Date(val.startedDateTime);
			var offset = startTime - basetime;
			options.series[6].data.push(SanitiseTimings(offset));
			
			var totalTime = SanitiseTimings(val.timings.receive) + SanitiseTimings(val.timings.wait) + SanitiseTimings(val.timings.send) + SanitiseTimings(val.timings.ssl) + SanitiseTimings(val.timings.connect) + SanitiseTimings(val.timings.dns);
			
			$('#logs').append("<tr><td title='" + val.request.url + "'>" + TruncateURL(val.request.url) + "&nbsp;&nbsp;<a href='"+ val.request.url + "' target='_blank'><img src='./images/openpopup.png' alt='" + val.request.url + "'/></a></td><td>"+ SanitiseSize(val.response.bodySize) + "</td><td>"+ SanitiseSize(val.response.content.size) + "</td><td>" + SanitiseSize(val.request.headersSize) + "</td><td>" + SanitiseSize(val.request.bodySize) + "</td><td>" + SanitiseSize(val.response.headersSize) + "</td><td>" + SanitiseTimings(offset) + "</td><td>" + SanitiseTimings(val.timings.dns) + "</td><td>" + SanitiseTimings(val.timings.connect) + "</td><td>" + SanitiseTimings(val.timings.ssl) + "</td><td>" + SanitiseTimings(val.timings.send) + "</td><td>" + SanitiseTimings(val.timings.wait) + "</td><td>" + SanitiseTimings(val.timings.receive) + "</td><td>" + Math.round(totalTime * 1000) / 1000 + "</td><td>" + val.response.status + "</td><td><a onclick=\"$( '#diag_" + x +"' ).dialog({width:600, maxHeight:600});\"><img src='images/diagnostics_on.gif' alt='Diagnostics'></a></td></tr>");
			
			//Build the diags box...
			var diagsText = "";
			diagsText = diagsText + "<p class='diagsHeader'>Request</p>";
			diagsText = diagsText + "<table>";
			$.each(val.request.headers, function(j, cont) {
				diagsText = diagsText + "<tr><td class='diagsName'>" + cont.name + "</td><td class='diagsValue'>" + cont.value + "</td></tr>";
			});
			diagsText = diagsText + "</table>";
			
			diagsText = diagsText + "<p class='diagsHeader'>Response</p>";
			diagsText = diagsText + "<table>";
			$.each(val.response.headers, function(j, cont) {
				diagsText = diagsText + "<tr><td class='diagsName'>" + cont.name + "</td><td class='diagsValue'>" + cont.value + "</td></tr>";
			});
			diagsText = diagsText + "</table>";
			
			if ("text" in val.response.content){
					
				if(val.response.content.mimeType.substring(0,4) == "text") {
					diagsText = diagsText + "<p class='diagsHeader'>Content</p>";
					HTMLoutput = val.response.content.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
					diagsText = diagsText + "<pre>" + HTMLoutput + "</pre>";
				}
				
				if(val.response.content.mimeType.substring(0,5) == "image") {
					diagsText = diagsText + "<p class='diagsHeader'>Content</p>";
					HTMLoutput = '<img src="data:' + val.response.content.mimeType + ';base64,' + val.response.content.text + '">';
					diagsText = diagsText + "<p>" + HTMLoutput + "</p>"; 	
				}
				
			}
			
			$('body').append('<div id="diag_'+ x + '" title="Diagnostics for ' + val.request.url +'" style="display: none; width=250px;"><p>' + diagsText + '</p></div>');
		
		}
	});
	
	var chart = new Highcharts.Chart(options);
	
	document.getElementById('timingsTable').style.display='block';
}

