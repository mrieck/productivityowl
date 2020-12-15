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

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        
        console.log("chrome runtime request is ");
        console.log(request);
        if(request.method == 'get_all_options'){
            var allowedWebsites = localStorage['allowed_websites'];
            var blockedWebsites = localStorage['blocked_websites'];
            var autocloseOptions = localStorage['autoclose_options'];
            var tasks = localStorage['tasks'];
            var vacationTime = localStorage['vacation_time'];
            var timeLimitDomains = localStorage['time_limit_domains'];
            var interventionsDisabled = localStorage['turn_off_interventions'];
            var statsDisabled = localStorage['turn_off_stats'];
            var owlSide = localStorage['owl_side'];            
            
            //if empty 
            if(!interventionsDisabled){
                interventionsDisabled = "no";
            }
            if(!statsDisabled){
                statsDisabled = "no";
            }
            if(!owlSide){
                owlSide = "right";
            }
            
            if(!timeLimitDomains){
                timeLimitDomains = new Array();
            }else{
                timeLimitDomains = $.makeArray($.parseJSON(timeLimitDomains));
            }          
            if(!allowedWebsites){
                allowedWebsites = new Array();
            }
            if(!blockedWebsites){
                blockedWebsites = new Array();
            }
            if(!tasks){
                tasks = new Array();
            }            
            if(!vacationTime){
                vacationTime = 0;
            }
            
            
            var optionsObj = {
                allowed_websites: allowedWebsites,
                blocked_websites: blockedWebsites,
                autoclose_options: autocloseOptions,
                tasks: tasks,
                vacation_time: vacationTime,
                time_limit_domains: timeLimitDomains,
                interventions_disabled: interventionsDisabled,
                stats_disabled: statsDisabled,
                owl_side: owlSide
            };
            //var theResponse = JSON.stringify(optionsObj);
            console.log("sending get_all_options response");
            console.log(optionsObj);
            sendResponse({data: optionsObj});
        }   
        else if(request.method == 'get_tasks'){
            var theTasks = localStorage['tasks'];
            sendResponse({data: theTasks});            
        }
        else if(request.method == 'save_tasks'){
           var theTasks = request.tasks;
           if(theTasks){
               var jsonEncoded = JSON.stringify(theTasks);
               //console.log(jsonEncoded);
               localStorage['tasks'] = jsonEncoded;                                 
           }
        }
        else if(request.method == 'save_owl_side'){
           var theSide = request.side;
           console.log("the side " + theSide);
           if(theSide != 'right' && theSide != "left"){
               theSide = "right";
           }
           console.log("now set to " + theSide);
           localStorage['owl_side'] = theSide;                                 
        }
		else if(request.method == "saveLinkClick")
		{
			chrome.tabs.create({
					  url: request.url
			});		
		} 
        else if(request.method == 'test_respect_calc'){
            var processArr = respectCalc();
            sendResponse({data: processArr});       
        }
        else if(request.method == 'get_domain_current_time'){
            //get amount of time spent on current domain
            var theDomain = request.domain;
            var unixTime = new Date().getTime();
            unixTime = unixTime - 60*60*4*1000;
            //minus 4 hours... so yesterday's day lasts until 4 am today
            var d = new Date(unixTime);                    
            var dateString = getDateStorageString("bstats", d);     
            var allPastUrls = localStorage[dateString];
            if(!allPastUrls){
                allPastUrls = {};
            }else{
                allPastUrls = JSON.parse(allPastUrls);
            }
            var currCount = 0;
            if(theDomain in allPastUrls){
                currCount = allPastUrls[theDomain];
            }        
            
            /*
			var lastThreeUrls =  localStorage['last_visited_urls'];	
            if(!lastThreeUrls){
                lastThreeUrls = new Array();
            }else{
                lastThreeUrls = JSON.parse(lastThreeUrls);
            }
            console.log("lastThreeUrls ");
            console.log(lastThreeUrls);
            var currDate = new Date().toString("F");

            lastThreeUrls.unshift({url: theDomain, visit_date: currDate});
            if(lastThreeUrls.length > 3){
                lastThreeUrls = lastThreeUrls.slice(0, 3);
            }
            
            localStorage['last_visited_urls'] = JSON.stringify(lastThreeUrls);     
            */
           
            //also record latest domain and time visited
            //use that to check if someone uninstalled the extension
            localStorage['lasturl_visited_time'] = currDate;            
            
            sendResponse({data: currCount});      
        }
		else if(request.method == "isFreeTime")
		{
			var currDate = Date.today().setTimeToNow();
			//request.url
			
			//get local storage urls which each have a time that they occured
			//clean out any urls that are older than 1 hour
			//
			var currDomain = "";
			if(request.url)
			{
				currDomain = request.url;
			}
			
			//We store all urls so we can calcuate visited count.  
            //If Anti-Desperation mode is active we use this, different than browser stats            
			var allPastUrls =  localStorage['url_history'];	
			var allPastUrlsCopy = new Array();
			if(!allPastUrls)
			{
				allPastUrls = new Array();
			}
			else
			{
				allPastUrls = $.makeArray($.parseJSON(allPastUrls));
			}
			
            //very old code - maybe rewrite...
			var visitedCount = 0;
			for(var u = 0; u < allPastUrls.length; u++)
			{
			
				var urlObj = allPastUrls[u];
				var pastDate = Date.parse(urlObj.date);
				var pastDomain = urlObj.url;								
                                              
				var withinLastHour = true;
				if(pastDate == null)
				{
					withinLastHour = false;
				}
				else if((currDate.getHours() - pastDate.getHours()) > 1)
				{
					withinLastHour = false;					
				}
				
				
				if(withinLastHour)
				{
					allPastUrlsCopy.push({url: urlObj.url, date: pastDate.toString("M/d/yyyy HH:mm:ss")});				
				}
				
				if(pastDomain == currDomain)
				{
					visitedCount++;
				}
				
			}
			console.log("This page: " + currDomain + " was already visited: " + visitedCount);

			
			if(currDomain != "")
			{
				//console.log("Pushing url: " + request.url);
				//toString() produces this: 2014-01-28T20:18:28.369Z ...
				//which cannot be parsed by Date.js?  wtf... so currDate.toString("M/d/yyyy HH:mm:ss")
				allPastUrlsCopy.push({url: request.url, date: currDate.toString("M/d/yyyy HH:mm:ss")});
				localStorage['url_history'] = JSON.stringify(allPastUrlsCopy);
			}
			
			if(visitedCount > 50)
			{
				localStorage['url_history'] = JSON.stringify(new Array());
				localStorage['allowed_history'] = JSON.stringify(new Array());
				
			}			
		
			//returns negative number if in current freetime... number of hours and minutes left
			//returns positive number if not in freetime... hours and minutes until next freetime

			var dayIndex = -1;
			var dayName = currDate.toString("ddd");
			var dayArr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
			for(var d = 0; d < dayArr.length; d++)
			{
				if(dayName == dayArr[d])
				{
					dayIndex = d;
				}
			}
			if(dayIndex == -1) //Should never happen
			{
				console.log("Should not happen.  Day not found");
				return -99999999999999;
			}
			
			var todayTime = currDate.getHours() + (currDate.getMinutes() * 0.01);
			var scheduleData = localStorage['scheduler_data'];
            var workScheduleData = localStorage['scheduler_work_data'];

            //console.log("schedule data");
            //console.log(scheduleData);
            var timespans = new Array();
            var timespansWork = new Array();
            if(scheduleData){
                console.log("has some");
                timespans = jQuery.makeArray(jQuery.parseJSON(scheduleData));	                            
            }
            if(workScheduleData){
                console.log("has some");
                timespansWork = jQuery.makeArray(jQuery.parseJSON(workScheduleData));	                            
            }

            
			for(var i = 0; i < timespans.length; i++)
			{
				var freetimeObj = timespans[i];
				//Turn back into dates
				freetimeObj.sTime = Date.parse(freetimeObj.sTime);
				freetimeObj.eTime = Date.parse(freetimeObj.eTime);							
			}	
			for(var j = 0; j < timespansWork.length; j++)
			{
				var freetimeObj = timespansWork[j];
				//Turn back into dates
				freetimeObj.sTime = Date.parse(freetimeObj.sTime);
				freetimeObj.eTime = Date.parse(freetimeObj.eTime);							
			}	            
			
			var nextFreeTime = -1;
			var response = -1;
			var freeTimeType = "none";
			
			for(var y = 0; y < timespans.length; y++)
			{
				var anObj = timespans[y];
				var freeDayArr = anObj.dayArr;
				for(var z = 0; z < freeDayArr.length; z++)
				{
					var currDayIndex = freeDayArr[z];
					if(dayIndex == currDayIndex)
					{
						//On the same day in scheduler, check the times
						var currStart = anObj.sTime.getHours() + (anObj.sTime.getMinutes() * 0.01);
						var currEnd = anObj.eTime.getHours() + (anObj.eTime.getMinutes() * 0.01);

						console.log("----Is " + todayTime + " inbetween " + currStart + " and " + currEnd);	
						
						if(todayTime >= currStart && todayTime <= currEnd) //inside FREE TIME
						{
							console.log("WE ARE INSIDE FREETIME");
							//inbetween... calculate it
							
							response = 1;
							freeTimeType = "scheduler";
							break;
						}
					}
				}
			}
            
			for(var e = 0; e < timespansWork.length; e++)
			{
				var anObj = timespansWork[e];
				var workDayArr = anObj.dayArr;
				for(var f = 0; f < workDayArr.length; f++)
				{
					var currDayIndex = workDayArr[f];
					if(dayIndex == currDayIndex)
					{
						//On the same day in scheduler, check the times
						var currStart = anObj.sTime.getHours() + (anObj.sTime.getMinutes() * 0.01);
						var currEnd = anObj.eTime.getHours() + (anObj.eTime.getMinutes() * 0.01);

						console.log("----Is " + todayTime + " inbetween " + currStart + " and " + currEnd);	
						
						if(todayTime >= currStart && todayTime <= currEnd) //inside FREE TIME
						{
							console.log("WE ARE INSIDE WORKTIME");
							freeTimeType = "worktime";
							break;
						}
					}
				}
			}            
            
            
            
			var secLeft = 0;
			var vacationStart = localStorage['start_vacation_time'];
            var vacationDuration = localStorage['start_vacation_duration'];
            //vacationDuration in minutes
			var vacationMinutes = vacationDuration;
			if(vacationStart)
			{
                vacationDuration = parseInt(vacationDuration);
				console.log("VacationStart is: " + vacationStart);
				var vacationDate = Date.parse(vacationStart);
				//var vacationEnd = vacationStart.clone().addMinutes(vacationMinutes);
				
				var now = new Date(); 
				//now = Date.parse(now.toString("F"));
				var span = new TimeSpan(now - vacationDate);	
				//console.log("SPan hours min sec:")
				//console.log(span.getHours());
				//console.log(span.getMinutes());
				//console.log(span.getSeconds());
							
				var totalSec = span.getTotalMilliseconds() / 1000;
				
				//console.log("totalSec is: " + totalSec);
				if(totalSec < (vacationDuration * 60))
				{
					//We are in vacation_time
					response = 1;
					freeTimeType = "vacation";
					secLeft = (vacationMinutes * 60) - totalSec;
					
				}
			}
            var vacationTimeLeft = parseInt(localStorage['vacation_time']);
            vacationTimeLeft = vacationTimeLeft + Math.floor(secLeft / 60);
			
				
			sendResponse({data: response, freetime_type: freeTimeType, visited_count: visitedCount, sec_left: secLeft, vacation_time: vacationTimeLeft}); 					
		}        
		else if(request.method == "addVacationTime")
		{
			var vacationTime = localStorage['vacation_time'];	
			if(!vacationTime)
			{
				vacationTime = 0;
			}
			else
			{
				vacationTime = parseInt(vacationTime);
				if(vacationTime > 10000)
					vacationTime = 0;
			}
			
			var timeAmount = parseInt(request.time);
			
			vacationTime = vacationTime + timeAmount;
			localStorage['vacation_time'] = vacationTime;
			//localStorage[]
			
			
            //minus 4 hours... so yesterday's day lasts until 4 am today
            var unixTime = new Date().getTime();
            var origTime = unixTime;
            unixTime = unixTime - 60*60*4*1000;
            var d = new Date(unixTime);
            var taskDateString = getDateStorageString("taskcomplete", d);  
            console.log("date string");
            console.log(taskDateString);

			var allTodayTasksDone =  localStorage[taskDateString];	
            if(!allTodayTasksDone){
                console.log("create new today tasks done");
                allTodayTasksDone = new Array();
            }else{
                allTodayTasksDone = JSON.parse(allTodayTasksDone);
            }
            console.log("all tasks before ");
            console.log(allTodayTasksDone);

            allTodayTasksDone.push({task_text: request.task_text, credits_earned: vacationTime, complete_time: origTime, subtask: request.subtask});

            if(request.subtask == 'no'){
                if(request.subtask_count){
                    for(var s = 0; s < request.subtask_count; s++){
                        allTodayTasksDone.push({task_text: "subtask", credits_earned: 0, complete_time: origTime, subtask: "yes"});                        
                    }
                }
            }

            console.log("all tasks after ");
            console.log(JSON.stringify(allTodayTasksDone));
            localStorage[taskDateString] = JSON.stringify(allTodayTasksDone);     
            
            var responseTime = vacationTime;
            console.log("response time: " + responseTime);
            sendResponse({data: responseTime}); 	
		}      
		else if(request.method == "useVacationTime")
		{
			var response = 0;
			var vacationTime = localStorage['vacation_time'];	
			if(!vacationTime)
			{
				vacationTime = 0;
			}
			else
			{
				vacationTime = parseInt(vacationTime);
			}
            var timeAmount = 1;
            if(request.amount == 'all'){
                timeAmount = vacationTime;
            }else{
                timeAmount = parseInt(request.amount);
            }
            
			console.log("Comparing: " + timeAmount + " and " + vacationTime);
			if(vacationTime >= timeAmount)
			{				
				response = 1;
				var currDate = new Date().toString("F");
				console.log("saving curr date: " + currDate);
				localStorage['start_vacation_time'] = currDate;
				localStorage['start_vacation_duration'] = request.amount;
				
				localStorage['vacation_time'] = vacationTime - request.amount;
			}
			else
			{
				response = 0;
			}
            chrome.tabs.query({},function(tabs){     
               tabs.forEach(function(tab){
                 chrome.tabs.sendMessage(tab.id, {method: "vacation_started", vacation_min: timeAmount}, null);
                    
               });
            });                      
            
			
			sendResponse({data: response}); 	
		}	
		else if(request.method == "stopVacationTime")
		{
			var vacationTime = localStorage['vacation_time'];	
			if(!vacationTime)
			{
				vacationTime = 0;
			}
			else
			{
				vacationTime = parseInt(vacationTime);
			}
            var newVacationTime = vacationTime;
            var startVacationTime = localStorage['start_vacation_time'];
            var startVacationDuration = localStorage['start_vacation_duration'];  //in minutes
            localStorage.removeItem("start_vacation_time");
            localStorage.removeItem("start_vacation_duration");
            
            var vacationSecLeft = 0;
            if(startVacationTime)
            {
                var vacationDate = Date.parse(startVacationTime);
                var now = new Date(); 
                var span = new TimeSpan(now - vacationDate);	
                var totalSec = span.getTotalMilliseconds() / 1000;                    
                var vacationDurationSec = startVacationDuration * 60; 
                vacationSecLeft = vacationDurationSec - totalSec;
                var minLeft = 0;
                minLeft = Math.floor(vacationSecLeft / 60);
                if(vacationSecLeft < 0){
                    minLeft = 0;
                }
                newVacationTime = vacationTime + minLeft;
                localStorage['vacation_time'] = newVacationTime;
            }                
            sendResponse({data: 1, new_vacation_time: newVacationTime}); 	
        }         
		else if(request.method == "optionsLinkClick")
		{
            console.log("options link click");
            var navLink = request.navlink;
            var extraHash = "";
            if(navLink){
                extraHash = navLink;
            }
			var fullUrl = chrome.extension.getURL("options.html" + extraHash);
			chrome.tabs.create({
                url: fullUrl
			});
		}		     
		else if(request.method == "projectUrlClick")
		{            
            console.log("project url click with " + request.project);
			var fullUrl = "";
            if(request.project == 'snipcss'){
                fullUrl = "https://www.snipcss.com";
            }
            if(request.project == 'superanimo'){
                fullUrl = "https://www.superanimo.com";
            }
            if(request.project == 'scrapehawk'){
                fullUrl = "https://www.scrapehawk.com";
            }
            if(fullUrl != ""){
                chrome.tabs.create({
                    url: fullUrl
                });
            }
		}	  
        else if(request.method == 'start_intervention'){
            var currTime = new Date().getTime();
            var iType = request.intervention_type;
            var retSec = 180;
            if(iType == 'intention'){
                retSec = 240;
            }
            else if(iType == 'feelings'){
                retSec = 240;
            }
            else if(iType == 'costbenefit'){
                retSec = 240;
            }
            localStorage['intervention_active'] = 'yes';
            localStorage['intervention_start'] = currTime;
            localStorage['intervention_sec'] = retSec;
            localStorage['intervention_type'] = iType;
            //var d = new Date(currTime);     
            //var dateString = getDateStorageString("interventions", d);               
            
            //subtasks,costbenefit,feelings,intention
            sendResponse({data: 1, time_left: retSec}); 	
        }
        else if(request.method == 'complete_intervention'){
            var activeIntervention = localStorage['intervention_active'];
            if(!activeIntervention || activeIntervention != 'yes'){
                //another process already completed or expired this intervention... 
                sendResponse({data: 0}); 	
            }
            
            var iData = request['intervention_data'];
            var iType = localStorage['intervention_type'];
            var iStart = localStorage['intervention_start'];
            var iSec = localStorage['intervention_sec'];            
            
            var unixTime = new Date().getTime();
            var origTime = unixTime;
            unixTime = unixTime - 60*60*4*1000;
            var d = new Date(unixTime);
            var dateString = getDateStorageString("interventions", d);  
            console.log("date string");
            console.log(dateString);

			var allTodayInterventions =  localStorage[dateString];	
            if(!allTodayInterventions){
                console.log("create new today tasks done");
                allTodayInterventions = new Array();
            }else{
                allTodayInterventions = JSON.parse(allTodayInterventions);
            }
            console.log("all interventions before ");
            console.log(allTodayInterventions);

            allTodayInterventions.push({intervention_type: iType, intervention_start: iStart, intervention_sec: iSec, 
                intervention_data: iData, status: 'completed'});
            
            
            console.log("all interventions after ");
            console.log(allTodayInterventions);
            
            localStorage[dateString] = JSON.stringify(allTodayInterventions);            
            localStorage['intervention_last_completed'] = origTime;
            
            localStorage.removeItem("intervention_start");
            localStorage.removeItem("intervention_sec");
            localStorage.removeItem("intervention_type");
            localStorage.removeItem("intervention_active");
            
            chrome.tabs.query({},function(tabs){     
               tabs.forEach(function(tab){
                   //intervention could either be completed or expired
                   chrome.tabs.sendMessage(tab.id, {method: "intervention_status_change", status: "completed"}, null);                    
               });
            });               
            
            sendResponse({data: 1}); 	
        }
        else if(request.method == 'expired_intervention'){
            //just let the minute alarm do this...
        }        
        else if(request.method == 'get_current_intervention'){
            var activeIntervention = localStorage['intervention_active'];
            var intLast = localStorage['intervention_last_completed'];
            if(!activeIntervention || activeIntervention != 'yes'){
                sendResponse({data: 0, intervention_last: intLast}); 	
            }
            var intStart = localStorage['intervention_start'];
            var intSec = localStorage['intervention_sec'];
            var intType = localStorage['intervention_type'];     

            
            sendResponse({data: 1, intervention_start: intStart, intervention_sec: intSec, intervention_type: intType, intervention_last : intLast}); 	
        }
        else if(request.method == 'get_intervention_stats'){
            var unixTime = new Date().getTime();
            var dayArr = new Array();
            var allStats = new Array();
            for(var x = 0; x < 21; x++){
                var currdateTime = unixTime - (x * 86400000);
                var currdate = new Date(currdateTime);
                var storageString = getDateStorageString("interventions", currdate);
                //dayArr.push(storageString);

                var dateInterventions =  localStorage[storageString];	
                if(!dateInterventions){
                    console.log("create new today tasks done");
                    dateInterventions = new Array();
                }else{
                    dateInterventions = JSON.parse(dateInterventions);
                }                
                
                var completeCount = 0;
                var expiredCount = 0;                
                var totalCount = 0;
                
                for(var m = 0; m < dateInterventions.length; m++){
                    var dInter = dateInterventions[m];
                    var theStatus = dInter['status'];
                    if(theStatus == "complete" || theStatus == "completed"){
                        completeCount++;
                    }else if(theStatus == 'expired'){
                        expiredCount++;
                    }
                    totalCount++;
                }
                var displayDate = currdate.toString("M/d/yyyy")
                
                var aStat = {display_date: displayDate, completed: completeCount, expired: expiredCount, total: totalCount, data: dateInterventions};
                allStats.push(aStat);
                
                
            }
            sendResponse({data: allStats}); 	            
        }
		else if(request.method == "closeMyTab")
		{	            
			var tabId = sender.tab.id;
			var windowId = sender.tab.windowId;
			//console.log("window id: " + windowId);
			
			//We only remove if there is more than 1 tab in the window...
			//We dont want to close chrome completely... so if there is only one tab, we go to google
			//Thats why we need getAllInWindow
			chrome.tabs.getAllInWindow(windowId, function(tabs)
			{
				//console.log("There are a total # of tabs: " + tabs.length);
				if(tabs.length > 1)  //Remove if the more than one tab... 
				{
					chrome.tabs.remove(sender.tab.id);
				}
				else   //Redirect if the only tab left (we dont want to close window)
				{
					var theUrl = localStorage['redirect_url'];
					if(!theUrl)
					{
   					/*REMOVE REMOVE REMOVE*/
						theUrl = chrome.extension.getURL("options.html");
					}
					
					//I think this gets called repeatedly freezing the browser... try to only call it once
					//by saving previous redirected url
					var oldUrl = localStorage['redirected_url'];
					if(!oldUrl || (oldUrl != sender.tab.url))
					{				
						localStorage['redirected_url'] = sender.tab.url;
					
						console.log("REDIRECTING2: " + theUrl);
						chrome.tabs.update(sender.tab.id, {url: theUrl});
					}
				}
			});
		}        
        
    });

	/******** CHROME HANDLERS ************/
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
	{
		console.log("DEPREACATED EVENT CALLED");
        console.log("fix this - fix this - fix this - fix this - fix this");
        console.log(request.method);
        
	    if (request.method == "getLocalStorage"){
	       sendResponse({data: localStorage[request.key]});
        }
		else if(request.method == "inactiveTabWillClose")
		{
			/******** CHANGE FAVICON FOR CLOSING INACTIVE??? ********/
		}
		else if(request.method == "optionsLinkClick")
		{
			var fullUrl = chrome.extension.getURL("options.html");
			chrome.tabs.create({
					  url: fullUrl
			})			
			
			//gotoOptPage(windowId, tabId);
		}        
		else if(request.method == "visitedAllowedPage")
		{
			//We need this to know to accrue vacation time when the alarm goes off 
			var currDate = Date.today().setTimeToNow();
			var currUrl = "";
			if(request.url)
			{
				currUrl = request.url;
			}
			
			//We store all urls in the past hour...
			//This is needed for reducing the owl time on pages that user refreshes on
			var allAllowedUrls =  localStorage['allowed_history'];	
			if(!allAllowedUrls)
			{
				allAllowedUrls = new Array();
			}
			else
			{
				allAllowedUrls = jQuery.makeArray(jQuery.parseJSON(allAllowedUrls));
			}
			
			allAllowedUrls.push({url: currUrl, date: currDate.toString("M/d/yyyy HH:mm:ss")});
			
			console.log("allowed url visited count: " + allAllowedUrls.length);
			localStorage['allowed_history'] = JSON.stringify(allAllowedUrls);
		}

		else if(request.method == "saveForLater")
		{
			var saveUrl = request.the_url;		
			var saveObj = 
			{ 
				saveUrl: request.the_url, 
				saveTime: request.the_time 
			};				
			
			var savedWebsites = localStorage["saved_websites"];
			if(!savedWebsites)
			{
				console.log("NO WEBSITES SAVED, SAVING CURRENT: "  + saveUrl); 
				savedWebsites = "";
				var saveArr = new Array();
				
				saveArr.push(saveObj);
				localStorage['saved_websites'] = JSON.stringify(saveArr);
			}
			else
			{
				var websiteArr = jQuery.makeArray(jQuery.parseJSON(savedWebsites));	
				
				var alreadySavedIndex = -1;
				for(var i = 0; i < websiteArr.length; i++)
				{
					var mySaveObj = websiteArr[i];
					var aWebsite = mySaveObj.saveUrl;
					if(mySaveObj.saveTime == undefined)
					{						
						mySaveObj.saveTime = "Old Date";
						aWebsite = websiteArr[i];
					}
					
					if(aWebsite == saveUrl)
					{
						alreadySavedIndex = i;
					}
				}
				
				if(alreadySavedIndex >= 0)
				{
					websiteArr.splice(alreadySavedIndex, 1);
					websiteArr.push(saveObj);					
					localStorage['saved_websites'] = JSON.stringify(websiteArr);

					sendResponse({data: "page_already_saved"}); 	
				}
				else  //not found
				{
					sendResponse({data: "saved"}); 
					websiteArr.push(saveObj);		
					localStorage['saved_websites'] = JSON.stringify(websiteArr);				
				}				
			}			
			//The array has the latest at the end
		}
        else{
            sendResponse({data: "unknown request"}); 
        }
        return true;
	});	
	
	chrome.tabs.onActivated.addListener(function(info) 
	{
	   var tab = chrome.tabs.get(info.tabId, function(tab) 
		{
			chrome.tabs.sendRequest(tab.id, {tab_message: "now_active"});		
	    });
	});
    
function respectCalc(){
    var unixTime = new Date().getTime();
    var currdate = new Date(unixTime);
    var hours = currdate.getHours();
    var theHours = parseInt(hours);
    //calculate after 9am
    if(theHours < 9){
        return;
    }

    var processArr = new Array();
    for(var x = 1; x < 4; x++){
        var currdateTime = unixTime - (x * 86400000);
        var processDate = new Date(currdateTime);
        var storageString = getDateStorageString("respectcalc", processDate);
        var processData = localStorage[storageString];
        if(!processData){
            var respectObject = RESPECT.Calculator.calculateRespectScore(processDate);
            processArr.push(respectObject);
            var oldScore = parseFloat(respectObject['old_score']);
            var newScore = parseFloat(respectObject['new_score']);

            //shouldn't ever change that much
            if(Math.abs(newScore - oldScore) < 3.0 && newScore > 0.0){
                localStorage['respect_score'] = newScore;
            }
            localStorage[storageString] = JSON.stringify(respectObject);
        }

    }        
    return processArr;
}
		

chrome.alarms.onAlarm.addListener(function(alarm) 
{
	//console.log("alarm info");
	//console.log(alarm);
    if (alarm.name == 'hourly_alarm') 
	{
		console.log("======================================");
		console.log("HOURLY ALARM HAS FIRED AT");
        //if time is after 7am... look back at if day respect processed or not 
        respectCalc();
    }
    else if (alarm.name == 'daily_alarm') 
	{
        
        
        
		console.log("======================================");
		console.log("DAILY ALARM HAS FIRED AT");
		var currDate = Date.today().setTimeToNow();
		console.log(currDate);
		
		var allAllowedUrls = localStorage['allowed_history'];	
		var allAllowedUrlsCopy = new Array();
		//Filter them based on time since visited
		/*

		if(!allAllowedUrls)
		{
			allAllowedUrls = new Array();
		}
		else
		{
			allAllowedUrls = jQuery.makeArray(jQuery.parseJSON(allAllowedUrls));
		}
		for(var u = 0; u < allAllowedUrls.length; u++)
		{		
			var urlObj = allAllowedUrls[u];
			var pastDate = Date.parse(urlObj.date);
			var pastDomain = urlObj.url;
			if(pastDate == null)
			{
				continue;
			}
			else if((currDate.getHours() - pastDate.getHours()) <= 1)
			{
				accrueVacation = true;
			}
			else
			{
				allAllowedUrlsCopy.push({url: urlObj.url, date: pastDate.toString("M/d/yyyy HH:mm:ss")} );
			}
		}
		*/
		//localStorage['allowed_history'] = allAllowedUrlsCopy;
		//localStorage['vacation_time'] = 0;

		console.log("======================================");
    }	
    else if(alarm.name == 'minute_alarm'){
		console.log("======================================");
		console.log("MINUTE ALARM FIRED");        
        
        var turnOffStats = localStorage['turn_off_stats'];
        if(!turnOffStats || turnOffStats == 'no'){
            chrome.tabs.query({
                active: true,
                currentWindow: true     // In the current window
            }, function(activeTabs) {
                // Since there can only be one active tab in one active window, 
                //  the array has only one element
                if(activeTabs.length <= 0){
                    console.log("no active tabs?");
                    return;
                }

                var tab = activeTabs[0];
                console.log("tab");
                console.log(tab);

                chrome.tabs.sendMessage(tab.id, {method: "record_domain"}, function(response){
                    //console.log("minute recorddomain alarm response");
                    //console.log(response);
                    if(response.data == 'active'){
                        var recordDomain = response.domain;

                        var unixTime = new Date().getTime();
                        unixTime = unixTime - 60*60*4*1000;
                        //minus 4 hours... so yesterday's day lasts until 4 am today
                        var d = new Date(unixTime);                    
                        var dateString = getDateStorageString("bstats", d);                      
                        //console.log("storage stats");
                        //console.log(dateString);
                        var allPastUrls = localStorage[dateString];
                        //console.log(allPastUrls);
                        if(!allPastUrls){
                            //console.log("create new");
                            allPastUrls = {};
                        }else{
                            allPastUrls = JSON.parse(allPastUrls);
                        }
                        //console.log("all past urls before ");
                        //console.log(allPastUrls);

                        if(recordDomain in allPastUrls){
                            var currCount = allPastUrls[recordDomain];
                            currCount++;
                            allPastUrls[recordDomain] = currCount;
                        }else{
                            allPastUrls[recordDomain] = 1;
                        }

                        //console.log("all past urls after ");
                        //console.log(JSON.stringify(allPastUrls));
                        localStorage[dateString] = JSON.stringify(allPastUrls);
                    }
                });
            });
        }
        //console.log("checking interventions");
        var activeIntervention = localStorage['intervention_active'];
        if(activeIntervention && activeIntervention == 'yes'){
            var iStart = localStorage['intervention_start'];
            var retSec = localStorage['intervention_sec'];
            var iType = localStorage['intervention_type'];
            
            var endTime = parseInt(iStart) + (retSec * 1000);
            var currTime = new Date().getTime();
            //console.log("active one at " + iStart);
            //console.log("end time at   " + endTime);
            
            if(currTime > endTime){
                //console.log("EXPIRING INTERVENTION");

                    //expire intervention
                var unixTime = new Date().getTime();
                var origTime = unixTime;
                unixTime = unixTime - 60*60*4*1000;
                var d = new Date(unixTime);
                var dateString = getDateStorageString("interventions", d);  
                //console.log("date string");
                //console.log(dateString);

                var allTodayInterventions =  localStorage[dateString];	
                if(!allTodayInterventions){
                    //console.log("create new today tasks done");
                    allTodayInterventions = new Array();
                }else{
                    allTodayInterventions = JSON.parse(allTodayInterventions);
                }
                //console.log("all interventions before ");
                //console.log(allTodayInterventions);

                allTodayInterventions.push({intervention_type: iType, intervention_start: iStart, intervention_sec: retSec, 
                    intervention_data: "", status: "expired"});


                //console.log("all interventions after ");
                //console.log(allTodayInterventions);
                localStorage['intervention_last_completed'] = origTime;
                localStorage[dateString] = JSON.stringify(allTodayInterventions);
                localStorage.removeItem("intervention_start");
                localStorage.removeItem("intervention_sec");
                localStorage.removeItem("intervention_type");
                localStorage.removeItem("intervention_active");                
                chrome.tabs.query({},function(tabs){     
                   tabs.forEach(function(tab){
                       //intervention could either be completed or expired
                       chrome.tabs.sendMessage(tab.id, {method: "intervention_status_change", status: "expired"}, null);                    
                   });
                });                    
            }
        }        
        
    }
});

function getDateStorageString(prefix, d){
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();
    if(month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    var dateString = [year, month, day].join('-');        
    return prefix + dateString;
};


// Create the alarm:
chrome.alarms.create('hourly_alarm', 
{
    periodInMinutes: 30, 
	delayInMinutes: 1
});	


chrome.alarms.create('daily_alarm', 
{
    periodInMinutes: 1440, 
	delayInMinutes: 10
});	

chrome.alarms.create('minute_alarm', 
{
    periodInMinutes: 1, 
	delayInMinutes: 1
});

function checkHistoryOwlWasNotDeactivated(){

    var lastTime = localStorage['lasturl_visited_time'];
    //var visitedUrls = localStorage['last_visited_urls'];
    var owlTime = Date.parse(lastTime);
    var minSec = 9999999999999;
    var recordedRecent = false;
    
    chrome.history.search({text: '', maxResults: 4}, function(data) {
        
        if(data.length >= 4){
            data.forEach(function(page) {
                //console.log("page");
                console.log(page.url);
                var lastVisitTime = page.lastVisitTime;
                lastVisitTime = Math.floor(lastVisitTime);
                //lastVisitTime = lastVisitTime / 1000;
                //console.log(lastVisitTime);      
                var aDate = new Date(lastVisitTime);
                console.log("history date");
                console.log(aDate);                
                
                if(aDate < owlTime){
                    console.log("good recorded recent");
                    //good there are at least some urls older than last 
                    recordedRecent = true;
                }else{
                    var span = new TimeSpan(aDate - owlTime);
                    var totalSec = span.getTotalMilliseconds() / 1000;  
                    if(totalSec < minSec){
                        minSec = totalSec;
                    }
                    console.log("totalsec owl behind");
                    console.log(totalSec);
                }
                //console.log(aDate.getHours() + " : " + aDate.getMinutes());
                //console.log(page.url);
            });
            
            //if there were 4 urls in history after the last owl recorded url, and all those
            //urls are over 300 sec ahead of owl last recorded time, then it is likely that the person
            //disabled the owl and browsed pages before turning him back on.  This makes the owl angry
            if(!recordedRecent && minSec > 300){
                var unixTime = new Date().getTime();
                unixTime = unixTime - 60*60*4*1000;
                var d = new Date(unixTime);                    
                var displayDate = d.toString("M-d-yyyy");
                var disabledData = {disabled_sec : minSec, disabled_date: displayDate, disabled: true};
                localStorage['disabled_penalty_' + displayDate] = disabledData;                
            }
            
        }
            
        
    });
    
}

checkHistoryOwlWasNotDeactivated();
	  	
	
	/* FIRST RUN */
  function onInstall() 
  {
      //you start at 0 if 
      localStorage['respect_score'] = 0.0;
      
      var fullUrl = chrome.extension.getURL("options.html");
      chrome.tabs.create({
        url: fullUrl
      });
  }
  

  function onUpdate() 
  {
    //console.log("Extension Updated");
  }

  function getVersion() 
  {
    var details = chrome.app.getDetails();
    console.log("details");
    console.log(details);
    return details.version;
  }

  // Check if the version has changed.
  var currVersion = getVersion();
  var prevVersion = localStorage['version'];
  if (currVersion != prevVersion) 
  {
    // Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') 
	 {
      onInstall();
    } 
	 else 
	 {
      onUpdate();
    }
    localStorage['version'] = currVersion;
  }	

	
