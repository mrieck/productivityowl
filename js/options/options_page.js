/************************************************
This code is licensed under the Apache v2.0 License
================================================
If you're expecting an organized, modern, easily extensible codebase
then you're looking at the wrong project.  The reason the project is open-source 
is so everyone can be confident the Owl has no trackers or data-harvesting. 
If you're going to read the code I hope you like jQuery.
Copyright Mark Rieck, 2010 - 2020
Github: https://github.com/mrieck/productivityowl
Twitter: https://twitter.com/productivityowl
*************************************************/
    var OPTIONS = OPTIONS || {};
	var FREETIME_CHANGED = false;
    var CURRENT_VACATION_TIME = 0;
	var EXPORT_DATA = null;
    OPTIONS.INTERVENTIONS_ENABLED = true;
    OPTIONS.STATS_ENABLED = true;
    OPTIONS.SNIPCSS_LINK = 'https://www.snipcss.com';
    OPTIONS.SCRAPEHAWK_LINK = 'https://www.scrapehawk.com';
	
	$(function()
	{	             
        /*
        console.log(navigator.userAgent);
        if(navigator.userAgent.indexOf('Edg') >= 0){

        }else{
            OPTIONS.SNIPCSS_LINK = 'https://chrome.google.com/webstore/detail/snipcss/hbdnoadcmapfbngbodpppofgagiclicf';
            OPTIONS.SCRAPEHAWK_LINK = '';            
        }
        */
       
	 	$('#owl_save_options').click(function()
		{
            chrome.runtime.sendMessage({method: "isFreeTime", url: window.location.hostname},
                function(response)                                
                {	
                    var isWorktime = false;
                    if(response.freetime_type == 'worktime'){
                        isWorktime = true;
                    }
                    //if work time - saving by removing is bad
                    save_options(isWorktime);
                });             
		}); 
        
        $('#more_projects_link').on('click', function(){
            //var respectScore = parseFloat(localStorage['respect_score']);                                                
            //var unixTime = new Date().getTime();
            //var test = new Date(unixTime);
            //var respect = RESPECT.Calculator.calculateTaskChange(test, 5.0);
            //console.log("-----------RESPECT");
            //console.log(respect);
            
            //var respect2 = RESPECT.Calculator.calculateInterventionChange(test, 5.0);            
            //console.log("intervention respect");
            //console.log(respect2);
            
            /*
            chrome.runtime.sendMessage({method: "test_respect_calc"}, 
            function(response) 
            {   
                console.log("got response from test resect calc");
                console.log(response);
            });
             */            
            MicroModal.show('modal-more-projects'); // [1] 
            TASKS.MODAL_OPEN_NAME = "modal-more-projects";            
        });
		
		var autoCloseOptions = localStorage["autoclose_options"];
        console.log(autoCloseOptions);
		var antiDesperation = 0;
		var pageCloseTime = 30;
		var inactiveCloseTime = 0;
	    if(autoCloseOptions)
		{
			var optionArr = JSON.parse(localStorage['autoclose_options']);
			pageCloseTime = optionArr[0];
			antiDesperation = optionArr[1];
			if(optionArr.length > 2)
				inactiveCloseTime = optionArr[2];
		
			$('#allowed_seconds').val(pageCloseTime);

			
			if(antiDesperation > 0)
				$('#desperation_mode').prop("checked", true);
			else
				$('#desperation_mode').prop("checked", false);
		}
		else
		{
			var autoArr = new Array();
			autoArr.push(30);
			autoArr.push(1);
			autoArr.push(0);			
			localStorage['autoclose_options'] = JSON.stringify(autoArr);
		}
        
        var disabledInterventions = localStorage['turn_off_interventions'];
        var disabledStats = localStorage['turn_off_stats'];
        if(disabledInterventions && disabledInterventions == 'yes'){
            console.log("interventions off");
            OPTIONS.INTERVENTIONS_ENABLED = false;
            $('#owl_interventions_enabled').prop("checked", false);    
        }else{
            console.log("interv on");            
            $('#owl_interventions_enabled').prop("checked", true);
        }
                                
        if(disabledStats && disabledStats == 'yes'){
            console.log("stats off");
            OPTIONS.STATS_ENABLED = false;            
            $('#browsing_stats_enabled').prop("checked", false);
        }
        else{
            console.log("stats on");            
            $('#browsing_stats_enabled').prop("checked", true);        
        }
            
        
        
		
		var initText = 'Hello, I am the Productivity Owl.  I will give you ' + pageCloseTime + ' seconds to visit a website, then I will close the tab.  You will learn to find the information you need, then get back to work.';		
		setupQtips(initText);
	
		//ALLOWED WEBSITES
		var allowWebsites = localStorage["allowed_websites"];
		var allowArr = new Array();
		if (!allowWebsites) 
		{
			//Defaults
			allowArr.push("localhost");
			allowArr.push("stackoverflow.com");
			allowArr.push("mail.google.com");
			allowArr.push("fontawesome.com");
			localStorage['allowed_websites'] = JSON.stringify(allowArr);
		}	
		else
		{
			allowArr = JSON.parse(allowWebsites);	
		}
		
		var allowHtml = "";
		for(var i = 0; i < allowArr.length; i++)
		{
			allowHtml += allowArr[i] +  '\n';
		}
		$('#allowed_websites').html(allowHtml);
		
		//BLOCK WEBSITES
		var blockWebsites = localStorage["blocked_websites"];
		var blockArr = new Array();
		if (!blockWebsites) 
		{
			//Defaults
			blockArr.push("facebook.com");
			blockArr.push("twitter.com");
            blockArr.push("youtube.com");
			blockArr.push("reddit.com");            
			localStorage['blocked_websites'] = JSON.stringify(blockArr);
		}	
		else
		{
			blockArr = JSON.parse(blockWebsites);	
		}
		
		var blockHtml = "";
		for(var j = 0; j < blockArr.length; j++)
		{
			blockHtml += blockArr[j] +  '\n';
		}
		$('#blocked_websites').html(blockHtml);
		
        CURRENT_VACATION_TIME = localStorage["vacation_time"];
        if(!CURRENT_VACATION_TIME){
            localStorage['vacation_time'] = 0;
            CURRENT_VACATION_TIME = 0;
        }
        
		$('body').on('click', '#navigation ul li', function() 
		{
            var nameArr = new Array("Manage Websites", "Tasks & Rewards", "Timeboxing", "Browsing Stats", "Earn Respect", "Owl Interventions", 'Import/Export Settings');
            var divArr = new Array("manage_websites", "prodowl-tasks_rewards", "timeboxing", "browsing_stats", "earn_respect", 'owl_interventions', 'import_export');

            //Reset all the LI navigation, hide all div in body
            for (var i = 0; i < nameArr.length; i++)
            {
                $("#li_" + divArr[i]).html('<a href="#">' + nameArr[i] + '</a>');
                $("#li_" + divArr[i]).removeClass();
                $("#" + divArr[i]).hide();
            }

            //Select the one clicked
            var divName = this.id.substr(3);
            var divIndex = $.inArray(divName, divArr);
            
            if(divName == "browsing_stats"){
                //render the chart
                STATS.Chart.renderTasks();
                if(OPTIONS.STATS_ENABLED){       
                    STATS.Chart.render();
                    STATS.Chart.renderLimitTable();                        
                }else{
                    $('#browsing_stats_disabled_message').css('display', 'block');
                    $('#browsing_stats_container').css('display', 'none');
                }
                
            }

            if(divIndex >= 0)
            {
                $(this).addClass("active");
                $(this).html('<span><strong>' + nameArr[divIndex] + "</strong></span>");
                    $("#" + divName).show();

                //	alert("divname: " + divName);
                //Change the Owl Message
                owlMessage('', divName);
                if(FREETIME_CHANGED && divName != "Schedule Freetime")
                {
                    var test = confirm('Freetime Schedule was changed.  Do you wish to save?');
                    if(test)
                    {
                        Scheduler.saveSchedule();							
                    }	
                    FREETIME_CHANGED = false;
                }
                localStorage['last_nav'] = divName;
            }				
		});		
        
        $('.newversion_tasklink').on('click', function(){
            $('#li_manage_websites').trigger('click');
        });
        $('.stats_page_link').on('click', function(){
            $('#li_browsing_stats').trigger('click');
        });		
        $('.tasks_page_link').on('click', function(){
            $('#li_prodowl-tasks_rewards').trigger('click');
        });		
		
		
		//var timeStartTimepicker = new Timepicker($('#start_time'));
		
		setupTimeboxing();	
        setupTaskLists();
        setupBrowsingStats();
        
		setupEarnRespect();
		setupInterventions();
		setupExportOptions();
		
        //tab direct links
        chrome.tabs.getCurrent(function(tab){
            //console.log("current url " + tab.url);
            var tabSplit = tab.url.split('#');    
            if(tabSplit.length > 1 && tabSplit[1] != ""){
                var selectedTab = tabSplit[1];
                if(selectedTab == 'tasks_rewards'){
                    selectedTab = 'prodowl-tasks_rewards';
                }
                
                if(selectedTab.length > 4){
                    $('#li_' + selectedTab).trigger('click');
                }
            }else{
                var lastNav = localStorage['last_nav'];
                
                if(!lastNav){
                    $('#li_manage_websites').trigger('click');
                }else{
                    $('#li_' + lastNav).trigger('click');                    
                }
                
            }
        });   		
        
        $('.project-item-container').on('click', function(){
            var projectName = this.id.split('_')[1];
            console.log("project name " + projectName);
            chrome.runtime.sendMessage({method: "projectUrlClick", "project" : projectName}, 
            function(response) 
            {

            });            
        });        


		
	});
	
    
    function owlInterception(message){
        $('#owl_interception_message').html(message);
        MicroModal.show('modal-owl-interception');
    }

	
	function loadMustacheTemplate(htmlFile, insertTag, tData, callbackFunc)
	{
		var req = new XMLHttpRequest();
		req.open("GET", chrome.extension.getURL(htmlFile), true);
		req.onreadystatechange = function() 
		{
			if (req.readyState == 4 && req.status == 200) 
			{
				//var image = chrome.extension.getURL('img/advice_owl_small.png');
				//console.log('Rendering Mustache.js template...');
				var tb = Mustache.to_html(req.responseText, tData);
				$(insertTag).prepend(tb);
				callbackFunc.call();
			}
		};
		req.send(null);		

	}	
    
	function loadMustacheTemplateAppend(htmlFile, insertTag, tData, callbackFunc)
	{
		var req = new XMLHttpRequest();
		req.open("GET", chrome.extension.getURL(htmlFile), true);
		req.onreadystatechange = function() 
		{
			if (req.readyState == 4 && req.status == 200) 
			{
				//var image = chrome.extension.getURL('img/advice_owl_small.png');
				//console.log('Rendering Mustache.js template...');
				var tb = Mustache.to_html(req.responseText, tData);
				$(insertTag).append(tb);
				callbackFunc.call();
			}
		};
		req.send(null);		

	}	    
    
    
    function setupTaskLists(){
        TASKS.Items.init();     
        TASKS.Items.render();

        $('#vacationtime_knob').val(CURRENT_VACATION_TIME);
    }
    
    function setupBrowsingStats(){
        STATS.Chart.init();
        //don't render until switch to page
        //STATS.Chart.render();
    }
	
    /*
	function setupVacationTime()
	{
		var dayArr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		for(var d = 0; d < 7; d++)
		{
			var dayNum = d + 1;
			var dayName = dayArr[d];
			var aCheckButton = new YAHOO.widget.Button("vday_" + dayNum, { label:dayName, container: "days_of_vacation" }); 			
		}
		
		var resetVacationTime = new Timepicker($('#reset_vacation_time'));		
		
	}
	*/
   
   
	function setupTimeboxing()
	{
		//Day Buttons
		var dayArr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		for(var d = 0; d < 7; d++)
		{
			var dayNum = d + 1;
		   var dayName = dayArr[d];
			var aCheckButton = new YAHOO.widget.Button("day_" + dayNum, { label:dayName, container: "days_of_week_div" }); 			

		}
		
		//Time Fields
		//requires timepicker_template script tag
		var startTimepicker = new Timepicker($('#start_time'));
		var endTimepicker = new Timepicker($('#end_time'));
											
		var savedScheduler = localStorage['scheduler_data'];
        var workScheduler = localStorage['scheduler_work_data'];
        //console.log("scheduler work data");
        //console.log(workScheduler);
		if(savedScheduler || workScheduler)
		{	
			//console.log("LOADING EXISTING DATA");
            
            if(savedScheduler){
                var dataArr = jQuery.makeArray(jQuery.parseJSON(savedScheduler));	

                for(var i = 0; i < dataArr.length; i++)
                {
                    var freetimeObj = dataArr[i];
                    //Turn back into dates
                    freetimeObj.sTime = Date.parse(freetimeObj.sTime);
                    freetimeObj.eTime = Date.parse(freetimeObj.eTime);
                }		
                Scheduler.freetimeObjects = dataArr;			
            }
            if(workScheduler){
                var dataArr = jQuery.makeArray(jQuery.parseJSON(workScheduler));	

                for(var i = 0; i < dataArr.length; i++)
                {
                    var worktimeObj = dataArr[i];
                    //Turn back into dates
                    worktimeObj.sTime = Date.parse(worktimeObj.sTime);
                    worktimeObj.eTime = Date.parse(worktimeObj.eTime);
                }		
                Scheduler.worktimeObjects = dataArr;			                
            }
            
			
			Scheduler.rebuildScheduler();
		}
		else
		{
			Scheduler.createUI();
		}
		
		
		
	}
	
	function scheduleDisplayAlert(alertType, alertHeader, alertBody)
	{
		var templateHtml = '<div class="alert ' + alertType + '">' +
			  '<a class="close" data-dismiss="alert" href="#">X</a>' + 
			  '<h4 class="alert-heading">' + alertHeader + '</h4>' + alertBody + 
			'</div>';
		
		$('#scheduler_alert_container').html(templateHtml);
		
	}
	
	function afterDisplayAlert()
	{		
		//empty
		//Maybe set up a timer for the alert to disappear?
	}
	
	
    //not used anymore?
    /*
	function setupSaveForLater(isFreeTime)
	{
		chrome.runtime.sendMessage({method: "isFreeTime", url: "options_page"}, 
		function(response) 
		{	
            console.log("response to is freetime ");
            console.log(response);
            if(!response){
                return;
            }
			if(response.data == 1)
			{
				SaveForLater.init(true);	
			}
			else if(response.data == -1)
			{
				SaveForLater.init(false);
			}
			
		});		        
	}
	*/
	
	
	function setupQtips(initText)
	{
		//localStorage["install_date"];
	
		$("#owl_image").qtip({
		content: 
		{
			text: initText
		},
		width: {
			min: 300,
			max: 600
		},
		position: {
			my: 'top left',  // Position my top left...
			at: 'right top'
		},		
		style: 
		{
			tip: 
			{
				corner: 'left center'
			}
		}
		});
		
		$('#owl_image').qtip('show');		
	}

		// Saves options to localStorage.
		function save_options(isWorktime) 
		{
            var differentMessage = "";
			var origAllowedArr = localStorage['allowed_websites'] ? JSON.parse(localStorage['allowed_websites']) : [];
			var origBlockArr = localStorage['blocked_websites'] ? JSON.parse(localStorage['blocked_websites']) : [];            
            
			//alert($('#allowed_websites').val());		
			///alert($('#blocked_websites').val());	
			//var allOptions = { 
			
			var allowArr = $('#allowed_websites').val().split(/\r\n|\r|\n/);
			var blockArr = $('#blocked_websites').val().split(/\r\n|\r|\n/);	
            if(isWorktime){
                console.log("is work time, being stricter with allowed/blocked");
                if(origBlockArr.length > blockArr.length){
                    owlInterception("During scheduled work time you are not allowed to remove blocked sites.");
                    blockArr = origBlockArr;
                }else{
                    for(var b = 0; b < origBlockArr.length; b++){
                        if($.inArray(origBlockArr[b], blockArr) === -1){
                            if(origBlockArr[b].trim() != "" && origBlockArr[b].length > 1){
                                differentMessage = "Are you trying to trick me?  I said I don't let you remove block sites during work time."
                                blockArr.push(origBlockArr[b]);
                            }
                        }
                    }
                }
            }
            console.log("stringify this array: ");
            console.log(allowArr);
            
			localStorage['allowed_websites'] = JSON.stringify(allowArr);
			localStorage['blocked_websites'] = JSON.stringify(blockArr);
			
			
			/********
			localStorage['autoclose_options'] = [ALLOW_SEC, ANTI_DESP, CLOSE_UNUSED_SEC]
			*********/
			var autoArr = new Array();

            
            var allowedSec = 30;
            allowedSec = parseInt($('#allowed_seconds').val());
            if(allowedSec >= 0){
                if(allowedSec >= 180){
                    allowedSec = 180;
                    differentMessage = "You only get 3 minutes maximum.  Anything over 90 and you're already losing my respect.";
                    $('#allowed_seconds').val(180);
                }
            }else{
                differentMessage = "Invalid number, you get 30 seconds on non-blocked/non-allowed websites.";
                $('#allowed_seconds').val(30);
                allowedSec = 30;
            }
			autoArr.push(allowedSec);
			
			if($('#desperation_mode').is(':checked'))
			{
				autoArr.push(1);
			}
			else
			{
				autoArr.push(0);
			}
			
			if($('#close_unused').is(':checked'))
			{
				var theMin = $('#unused_minutes').val();				
				if(theMin >= 0)
				{
					autoArr.push(theMin);				
				}
				else
				{
					autoArr.push(0);					
				}				
			}
			else
			{
				autoArr.push(0);
			}			
            //console.log("autoclose arr");
            //console.log(autoArr);
			
			localStorage['autoclose_options'] = JSON.stringify(autoArr);
            
            
            var turnOffInterventions = "no";
            var turnOffBrowsingStats = "no";
            if($('#owl_interventions_enabled').is(':checked'))
			{
                console.log("interventions enabled");
				turnOffInterventions = "no";
			}
			else
			{
                console.log("interventions off");                
				turnOffInterventions = "yes";
			}         
            if($('#browsing_stats_enabled').is(':checked'))
			{
				turnOffBrowsingStats = "no";;
                console.log("stats enabled");                
                
			}
			else
			{
				turnOffBrowsingStats = "yes";
                console.log("stats off");                                
			}         
            
            localStorage['turn_off_interventions'] = turnOffInterventions;
            localStorage['turn_off_stats'] = turnOffBrowsingStats;
                        
			if(differentMessage == ""){
    			owlMessage("Your options have been saved.");
            }else{
                owlMessage(differentMessage);
            }
		}
		
		var URL = window.webkitURL || window.URL;
		var url;
		function setupExportOptions()
		{
		
			$('#owl_export_settings').click(function()
			{
				//in case user has saved since opening options page
				initExportData();
		
			    if (url) 
					URL.revokeObjectURL(url);
				var blob = new Blob([EXPORT_DATA], { type: 'text/plain;charset=utf-8;' });
			    url = URL.createObjectURL(blob);
			    $("#export_link").attr("href", url);	
				
			    var evt = document.createEvent('MouseEvents');
			    evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
			    $("a[download]")[0].dispatchEvent(evt);
			}); 
			
			$('#owl_import_settings').click(function()
			{				
				var settingsData = $('#import_settings_text').val();
                /*
                var allowedWebsites = localStorage['allowed_websites'];
                var blockedWebsites = localStorage['blocked_websites'];
                var autocloseOptions = localStorage['autoclose_options'];
                var isFreetime = localStorage['isFreeTime'];
                var taskList = localStorage['task_list'];

                var optionsObj = {
                    allowed_websites: allowedWebsites,
                    blocked_websites: blockedWebsites,
                    autoclose_options: autocloseOptions,
                    isFreeTime: isFreetime,             
                    task_list: taskList
                };
                */
                
				var arrData = JSON.parse(settingsData);
                console.log("the current arrData");
                console.log(arrData[0]);
				localStorage['autoclose_options'] = JSON.stringify(arrData[0]);
				localStorage['allowed_websites'] = JSON.stringify(arrData[1]);
				localStorage['blocked_websites'] = JSON.stringify(arrData[2]);
				localStorage['scheduler_data'] = JSON.stringify(arrData[3]);
				localStorage['saved_websites'] = JSON.stringify(arrData[4]);
                localStorage['tasks'] = JSON.stringify(arrData[5]);
				location.reload(true);	                
			}); 			

			initExportData();
		}
		
		function initExportData()
		{
			var allOptions = new Array();
			var firstArr = localStorage['autoclose_options'] ? JSON.parse(localStorage['autoclose_options']) : [];
			var secondArr = localStorage['allowed_websites'] ? JSON.parse(localStorage['allowed_websites']) : [];
			var thirdArr = localStorage['blocked_websites'] ? JSON.parse(localStorage['blocked_websites']) : [];
			var fourthArr = localStorage['scheduler_data'] ? JSON.parse(localStorage['scheduler_data']) : [];
			var fifthArr = localStorage['saved_websites'] ? JSON.parse(localStorage['saved_websites']) : [];
            var tasks = localStorage['tasks'] ? JSON.parse(localStorage['tasks']) : [];
			
			
			allOptions.push(firstArr);
			allOptions.push(secondArr);
			allOptions.push(thirdArr);
			allOptions.push(fourthArr);
			allOptions.push(fifthArr);
            allOptions.push(tasks);
						
			EXPORT_DATA = JSON.stringify(allOptions);	
		}
		
		
		function changeTimePermission(theNewTime)
		{
			var currentTime = 30;
			if(localStorage['autoclose_options'])
			{
				currentTime = JSON.parse(localStorage['autoclose_options'])[0];
			}
			if(theNewTime == currentTime)
			{
				return currentTime;
			}
			else  //else
			{	
				//Calculate Respect and only allow if has respect
				return theNewTime;
			}			
		}
		
		function owlMessage(theText, messageGroup)
		{
			var theSaying = theText;
			if(messageGroup !== undefined && messageGroup in owlSayings)
			{
				 var sayingArr = owlSayings[messageGroup];
				 var randomSaying = Math.floor(Math.random() * sayingArr.length);
				 var theSaying = sayingArr[0];
				 for(var i = 0; i < sayingArr.length; i++)
				 {
					  if(randomSaying == i)
						{
							theSaying = sayingArr[i];
							//if(theSaying.indexOf("{page_close_time}") >= 0)
							//{
							//	var closeTime = JSON.parse(localStorage['autoclose_options'])[0];
							//	theSaying = theSaying.replace('{page_close_time}', closeTime);
							//}
						}
				 }
				 //alert("the saying: " + theSaying);

			}
			else if(messageGroup !== undefined)
			{
				alert("div no sayings: " + messageGroup);
			}
			
			
			$('#owl_image').qtip('option', 'content.text', theSaying);
			$('#owl_image').qtip('show');
		}
		
		function setupEarnRespect()
		{
            var respectScore = parseFloat(localStorage['respect_score']);
            if(!respectScore){
                respectScore = 0.0;                
            }
            respectScore = Math.floor(respectScore);            
            //top: 14px;
            var minTop = -8;
            
            var totalPixels = 555;
            var percent = respectScore / 100;
            var pixelAmount = totalPixels * percent;
            var topLocation = minTop + pixelAmount;
            
            $('.respectmarker_container').css('top', topLocation + "px");
            $('.respectscore_red').html(respectScore.toString());
            
            $('#respectscore_topscore').val(respectScore.toString() + " / 100");
            var twitterStatus = "I'm trying to earn the owl's respect";
            var encoded = encodeURIComponent(twitterStatus);
            var twitterShare = 'https://twitter.com/intent/tweet?text=' + encoded + '&url=...com';
            if(respectScore < 20){
                $('.respecttext-1 .respect_description').css('display','block');  
                twitterStatus = "@ProductivityOwl is skeptical of my commitment to being productive.  Respect score: " + respectScore + "/100";
                if(respectScore > 10){
                    twitterStatus = "@ProductivityOwl is still skeptical of my commitment although I am trying.  Respect score: " + respectScore + "/100";                    
                }
                encoded = encodeURIComponent(twitterStatus);
                twitterShare = 'https://twitter.com/intent/tweet?text=' + encoded;                
            }
            else if(respectScore >= 20 && respectScore < 40){
                $('#respectimg_2').attr('src', 'img/respectlevel_2.jpg');                
                $('.respecttext-2 .respect_description').css('display','block');            
                twitterStatus = "@ProductivityOwl thinks that I have potential!  Respect score: " + respectScore + "/100";
                if(respectScore > 30){
                    twitterStatus = "@ProductivityOwl is starting to acknowledge my hard work!  Respect score: " + respectScore + "/100";                    
                }
                encoded = encodeURIComponent(twitterStatus);
                twitterShare = 'https://twitter.com/intent/tweet?text=' + encoded;                    
            }
            else if(respectScore >= 40 && respectScore < 60){
                $('#respectimg_2').attr('src', 'img/respectlevel_2.jpg');
                $('#respectimg_3').attr('src', 'img/respectlevel_3.jpg');
                
                $('.respecttext-3 .respect_description').css('display','block');                  
                twitterStatus = "@ProductivityOwl is satisfied with how productive I am!  Respect score: " + respectScore + "/100";
                encoded = encodeURIComponent(twitterStatus);
                twitterShare = 'https://twitter.com/intent/tweet?text=' + encoded;                
            }
            else if(respectScore >= 60 && respectScore < 80){
                $('#respectimg_2').attr('src', 'img/respectlevel_2.jpg');
                $('#respectimg_3').attr('src', 'img/respectlevel_3.jpg');
                $('#respectimg_4').attr('src', 'img/respectlevel_4.jpg');
                
                $('.respecttext-4 .respect_description').css('display','block');  
                twitterStatus = "@ProductivityOwl is impressed by my relentless focus.  Respect score: " + respectScore + "/100";
                encoded = encodeURIComponent(twitterStatus);
                twitterShare = 'https://twitter.com/intent/tweet?text=' + encoded;                    
            }
            else if(respectScore >= 80){
                $('#respectimg_2').attr('src', 'img/respectlevel_2.jpg');
                $('#respectimg_3').attr('src', 'img/respectlevel_3.jpg');
                $('#respectimg_4').attr('src', 'img/respectlevel_4.jpg');
                $('#respectimg_5').attr('src', 'img/respectlevel_5.jpg');
                
                $('.respecttext-5 .respect_description').css('display','block');              
                twitterStatus = "@ProductivityOwl is my life now. All I know is work. Respect score: " + respectScore + "/100";
                if(respectScore > 90){
                    twitterStatus = "@ProductivityOwl **owl screeching noises** Respect score: " + respectScore + "/100";                
                }
                encoded = encodeURIComponent(twitterStatus);
                twitterShare = 'https://twitter.com/intent/tweet?text=' + encoded;                   
            }
            var shareHtml = '<a href="' + twitterShare + '" class="twitter-share-btn twitter-extra-large"><i class="fab fa-twitter"></i>'  + 
                    '&nbsp;Tweet your respect score</a>';
            $('#respectshare').html(shareHtml);                 
                
            var owlPledgeDone = localStorage['owl_pledge_done'];
            if(!owlPledgeDone){
                $('#container_no_pledge').css('display', 'block');
                $('#container_respect_tips').css('display', 'none');                
            }else{
                $('#container_no_pledge').css('display', 'none');
                $('#container_respect_tips').css('display', 'block');                
            }
            
            $('#make_owl_pledge').on('click', function(){
                MicroModal.show('modal-make-the-pledge'); // [1] 
                TASKS.MODAL_OPEN_NAME = "modal-make-the-pledge";                
            });
            
            $('#modal_accept_pledge').on('click', function(){
                var owlPledgeDone2 = localStorage['owl_pledge_done'];
                
                if($('#owl_pledge_checkbox').is(':checked')){
                    if(!owlPledgeDone2){
                        $('#container_no_pledge').html("<h5>Congratulations!  You are now ready to let the owl guide you to high productivity!</h5>")
                        localStorage['owl_pledge_done'] = true;                    
                        localStorage['respect_score'] = parseFloat(localStorage['respect_score']) + 5.0;
                        var amount = Math.floor(localStorage['respect_score']);
                        $('#respectscore_topscore').val(amount.toString() + " / 100");
                        
                    }
                    MicroModal.close("modal-make-the-pledge");                      
                }else{
                    $('#must_check_iagree').css('display', 'block'); 
                }
            });
            var randomRespectTip = function(){
                
            };
            
            var sayingArr = owlSayings['respect_tips'];
            var randomSaying = Math.floor(Math.random() * sayingArr.length);
            var theSaying = sayingArr[0];
            for(var i = 0; i < sayingArr.length; i++)
            {
                if(randomSaying == i)
                {
                    theSaying = sayingArr[i];
                   $('#respect_tips_text').html(theSaying)
                }
            }      
            
            //secret debug of respect calculations last few days
            $('#respect_tip_heading').on('click', function(e){
                alert("clickity");
                console.log("here");
                var unixTime = new Date().getTime();
                for(var x = 0; x < 4; x++){
                    var currdateTime = unixTime - (x * 86400000);
                    var processDate = new Date(currdateTime);
                    var storageString = RESPECT.Calculator.getDateStorageString(processDate, "respectcalc");
                    var respectData = localStorage[storageString];
                    console.log("respect data for " + storageString);
                    console.log(respectData);
                }            
                
            });
            
		}		
		
		function setupInterventions()
		{
            chrome.runtime.sendMessage({method: "get_current_intervention"},
            function(response)
            {
                if(response.data == 1){
                    var intStart = response.intervention_start;
                    var intSec = parseInt(response.intervention_sec);
                    var intType = response.intervention_type;
                    //var intLast = response.intervention_last;
                    
                    var endTime = parseInt(intStart) + (intSec * 1000);
                    var currTime = new Date().getTime();
                    if(endTime > currTime){
                        $('#no_interventions').css('display', 'none');
                        var secLeft = (endTime - currTime) / 1000;
                        var image = chrome.extension.getURL('img/advice_owl_small.png');
                        $('intervention_container').empty();
                        INTV.Intervention.type = intType;
                      
                        loadMustacheTemplate('templates/owl_intervention.html', '#intervention_container', {advice_owl_small : image}, function(){
                            var updateInterventionTimeDisplay = function(secLeft){            
                                var interMin = Math.floor(secLeft / 60);
                                var interSec = (secLeft % 60).toString();

                                if(interSec.toString().length < 2)
                                    interSec = "0" + interSec.toString();        

                                if(INTV.INTERVENTION_COMPLETE){
                                    $('#intervention_timer').html("Complete");
                                    $('#intervention_timer').css("color", 'green');
                                    clearInterval(INTV.INTERVENTION_INTERVAL);
                                    return;
                                }else if(secLeft <= 0 || INTV.INTERVENTION_EXPIRED){
                                    $('#intervention_timer').html("Expired");
                                    clearInterval(INTV.INTERVENTION_INTERVAL);                
                                    return;                
                                }
                                $('#intervention_timer').html(interMin + ":" + interSec);
                            };        
                            INTV.INTERVENTION_TIME_LEFT = parseInt(secLeft.toString().split('.')[0]);
                            INTV.INTERVENTION_INTERVAL = setInterval(function(){
                               INTV.INTERVENTION_TIME_LEFT--;
                               updateInterventionTimeDisplay(INTV.INTERVENTION_TIME_LEFT);
                            }, 1000);            
                            console.log("intervention loaded");
                            $('#owl_intervention_container').css("display", 'none');
                            $('#intervention_' + intType).css('display', 'block');
                            $('#owl_productivity_intervention').on('click', '#create_subtask_link', function(e){
                                e.preventDefault();
                                $('#li_prodowl-tasks_rewards').trigger('click');
                                return false;
                            });
                            console.log("init intervention");
                            INTV.Intervention.init();                            
                            
                        });                        
                    }
                }else{

                }
            });     
            
            chrome.runtime.sendMessage({method: "get_intervention_stats"},
            function(response)
            {
                var allStats = response.data;
                var allCompleted = 0;
                var allTotal = 0;
                for(var x = 0; x < 7; x++){
                    var todayCompleted = allStats[x]['completed'];
                    var todayTotal = allStats[x]['total'];                    
                    allCompleted += parseInt(todayCompleted);
                    allTotal += parseInt(todayTotal);
                    
                }
                $('#intervention_done').html(allCompleted.toString());
                $('#intervention_total').html(allTotal.toString());
                
            });         
            
		}
        
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {        
    if(request.method == 'intervention_status_change'){
        //console.log("intervention status change");
        //console.log(request);
        if(request.status == 'completed'){
            clearInterval(INTV.INTERVENTION_INTERVAL);
            $('#intervention_timer').html("Complete");
            $('#intervention_timer').css("color", 'green');
            /*
            var tableId = 'intervention_' + OWL.INTERVENTION_TYPE + '_table';
            $('#' + tableId).css('display', 'none');
            */
            $('#owl_all_interventions').css('display', 'none');
            $('#owl_intervention_completed').css('display', 'block');
            $('.thispagewillclose').css('display', 'none');
        }
        else if(request.status == 'expired'){
            clearInterval(INTV.INTERVENTION_INTERVAL);
            $('#intervention_timer').html("Expired");
            $('#owl_all_interventions').css('display', 'none');                
            $('#owl_intervention_expired').css('display', 'block');            
            $('.thispagewillclose').css('display', 'none');            
        }
    }        
});
		
 var syncSendTabRequest = (target, params) => new Promise((res, err)=>{
    chrome.tabs.sendMessage( target, params, result=>{
      if (chrome.runtime.lastError) {
        err(chrome.runtime.lastError);
      } else {
        res(result);
      }
      console.log('syncsendrequest', params);
    });
     
 });
 
 var syncSendRequest = (params) => new Promise((res, err)=>{
    chrome.extension.sendRequest(params, result=>{
      if (chrome.runtime.lastError) {
        err(chrome.runtime.lastError);
      } else {
        res(result);
      }
      console.log('syncSendRequest', params);
    });
     
 });
 
 

 
		/************************** TIMESPAN SCHEDULER FUNCTIONS *********************/
		