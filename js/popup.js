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
    var CURRENT_VACATION_TIME = 0;
    
	$(function()
	{
		chrome.runtime.sendMessage({method: "isFreeTime"}, 
		function(response) 
		{	
            //{data: response, freetime_type: freeTimeType, visited_count: visitedCount, sec_left: secLeft}
            var freeType = response.freetime_type;
            var vacLeft =  response.sec_left;
            var vacationTime = response.vacation_time;
            var timeType = "productive";
            if(response.data == 1){
                timeType = "schedule_freetime";
                if(freeType == 'vacation'){
                    timeType = "break_freetime";
                }
            }
            console.log("got freetime object ");
            console.log(response);
            refreshPopupUI(timeType, vacationTime);
		});			
		
		$('#owl_option_link').on('click', function()
		{
			console.log("CLICKED THE OPTION LINK");
			
			chrome.runtime.sendMessage({method: "optionsLinkClick"}, 
			function(response) 
			{
				//Background page should create new tab with options page.
			});
		});		
        
        $('#use_break_time').on('click', function(){
            console.log("using break time");
            if(CURRENT_VACATION_TIME <= 0){
                $('#owl_notice').html("You don't have vacation time.  Get back to work.");		
            }
            chrome.runtime.sendMessage({method: "useVacationTime", amount: CURRENT_VACATION_TIME},
            function(response)
            {
                console.log("USING VACATIONTIME response: ");
                console.log(response);
                if(response.data == 1)
                {
                    CURRENT_VACATION_TIME = 0;
                    refreshPopupUI("break_freetime", CURRENT_VACATION_TIME);
                }else{
                    alert("couldnt use vacation time");
                    console.log(response);
                    
                }
                
                //alert("CURRENT VACATION TIME: " + CURRENT_VACATION_TIME);
            });            
        });
        
        $('body').on('click', '#stop_break_time', function(){
            console.log("stopping break time");
            chrome.runtime.sendMessage({method: "stopVacationTime"},
            function(response)
            {
                console.log("STOPPING USING VACATIONTIME: ");
                console.log(response);
                if(response.data == 1)
                {
                    CURRENT_VACATION_TIME = response.new_vacation_time;
                    refreshPopupUI("productive", CURRENT_VACATION_TIME);
                }else{
                    
                }
                
                //alert("CURRENT VACATION TIME: " + CURRENT_VACATION_TIME);
            });                
        });
        
        $('#manage_tasks').on('click', function(){
            chrome.runtime.sendMessage({method: "optionsLinkClick", "navlink" : "#tasks_rewards"}, 
            function(response) 
            {

            });                  
        });
        
        $('#remove_freetime').on('click', function(){
            
        });
        
	});
    
    function refreshPopupUI(displayType, vacLeft){
        CURRENT_VACATION_TIME = vacLeft;
        console.log("displaytype " + displayType);
        console.log("vacation left " + vacLeft);
        //is break time, free time
        if(displayType == 'productive')
        {
            $('#vacationdisplay_inactive').css('display', 'block');
            $('#vacationdisplay_active').css('display', 'none');
            var unixTime = new Date().getTime();
            unixTime = unixTime - 60*60*4*1000;
            //minus 4 hours... so yesterday's day lasts until 4 am today
            var d = new Date(unixTime);         
            var taskStorage = getDateStorageString(d, "taskcomplete");
            var todayTaskCompleted = localStorage[taskStorage];
            var taskAmount = 0;
            if(!todayTaskCompleted){
                taskAmount = 0;
            }else{
                
                todayTaskCompleted = JSON.parse(todayTaskCompleted);
                taskAmount = todayTaskCompleted.length;
            }
            $('#tasks_completed').html("(" + taskAmount + " tasks completed)");
            
            if(vacLeft > 0){
                $('#vacation_time_active').css('display', 'none');
                $('#productive_time_active').css('display', 'inline');
                
                $('#owl_notice').html("You are now being productive.");			
                $('#vacationtime_knob').val(vacLeft);
                $('#use_break_time').show();
                //$('#break_time_none').html('');
                //$('#vacation_time_available').css('display', 'block');
                //$('#no_vacation_time').css('display', 'none');       
            }else{
                $('#vacation_time_active').css('display', 'inline');
                $('#productive_time_active').css('display', 'block');

                $('#owl_notice').html("You are now being productive.");			
                $('#vacationtime_knob').val(0);        
                $('#use_break_time').hide();
                //$('#break_time_none').html('- <a href="#" class="owl_option_link">Do tasks</a> to earn it');

                //$('#vacation_time_available').css('display', 'none');
                //$('#no_vacation_time').css('display', 'block');               
            }
        }        
        else if(displayType == 'schedule_freetime' || displayType == 'break_freetime')
        {
            
            $('#saved_or_description').html('<div id="saved_list"><table id="saved_table"></table></div>');

            $('#vacation_time_active').css('display', 'block');
            $('#productive_time_active').css('display', 'none');
            $('#vacationdisplay_active').css('display', 'block');
            $('#vacationdisplay_inactive').css('display', 'none');

            var vacationTimeLeft = 0;
            var breakMinLeft = 0;
            if(displayType == 'schedule_freetime'){
                $('#owl_notice').html("Take a break, it is scheduled freetime");                
                $('#vacation_time_type').html("You are currently using Scheduled Free Time.");
                $('#stop_break_time').hide();
				vacationTimeLeft = localStorage['vacation_time'];                
                $('#vacationdisplay_active_label').html("You are using Scheduled Free Time, you can turn in off on the scheduler");  

                
            }else if(displayType == 'break_freetime'){
                $('#owl_notice').html("Take a break, it is break time");                
                var breakMinLeft = "";
                
                var startVacationTime = localStorage['start_vacation_time'];
				var startVacationDuration = localStorage['start_vacation_duration'];  //in minutes
                var vacationSecLeft = 0;
                var vacationMinLeft = 0;
                if(startVacationTime)
                {
                    var vacationDate = Date.parse(startVacationTime);
                    var now = new Date(); 
                    var span = new TimeSpan(now - vacationDate);	
                    var totalSec = span.getTotalMilliseconds() / 1000;                    
                    var vacationDurationSec = startVacationDuration * 60; 
                    vacationSecLeft = vacationDurationSec - totalSec;
                    if(vacationSecLeft < 0){
                        vacationSecLeft = 0;
                    }
                    vacationMinLeft = Math.floor(vacationSecLeft / 60);
                }                
                
                var vacLeftDisplay = vacationSecLeft + " sec";
                if(vacationMinLeft > 0){
                    vacLeftDisplay = vacationMinLeft + " min";
                }
                
                $('#vacationdisplay_active_label').html("Using Break Time. You have " + 
                    vacLeftDisplay);            
            }
            
            $('#saved_for_later_list').empty();
            
            
            
            //override all links in the save table, because they won't work as normal links on this page.
            $('body').on('click', 'a.savedlink', function(e)
            {
                e.preventDefault();
                var theUrl = this.href;
                console.log("saved link clicked " + theUrl);
                chrome.runtime.sendMessage({method: "saveLinkClick", url: theUrl}, 
                function(response) 
                {
                    //Background page should create new tab with url of  whatever.
                });

                return false;
            });

            var savedWebsites = localStorage["saved_websites"];
            var saveArr = new Array();		
            saveArr = JSON.parse(savedWebsites);	
            //saveArr.reverse(); //messes up indices

            //go in reverse
            if(saveArr.length > 0){
                $('.savedforlater_display_text').css('display', 'block');
            }
            
            for(var i = (saveArr.length - 1); i >= 0; i--)
            {
                var saveObj = saveArr[i];
                var currUrl = saveObj.saveUrl;	
                var currTime = saveObj.saveTime;
                if(saveObj.saveTime == undefined) //simple array
                {
                    currUrl = saveObj;					
                }

                var shortUrl = currUrl;
                if(shortUrl.length > 70)
                {
                    shortUrl = shortUrl.substring(0, 70) + "... ";
                }

                //alert("Appending: " + currUrl + " and " + currTime);

                 var currHtml = '<a class="savedlink" href="' + currUrl + '">' + shortUrl + '</a>';
                 $('#saved_for_later_list').append(currHtml);	
                 $('#saved_for_later_list').append('<br>');	
            }         
            
            $('body').on('click', '.savedforlater_display_text', function(){
                $('#saved_for_later_list').css('display', 'block');
            });
        }
        else
        {
            console.log("UNKNOWN IF FREETIME");
        }            
    }
    
    function getDateStorageString(d, prefix){
        var month = '' + (d.getMonth() + 1);
        var day = '' + d.getDate();
        var year = d.getFullYear();
        if(month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        var dateString = [year, month, day].join('-');        
        return prefix + dateString;
    }