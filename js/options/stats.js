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
var STATS = STATS || {};

//7days,today,yeterday,specific date
STATS.DATE_SELECTION = "7days";
STATS.TASKS_SELECTION = "7days";

STATS.buttonHandlers = function(){
    $('#browsing_stats_daterange').on('change', function(){
        STATS.DATE_SELECTION = $(this).val();
        STATS.Chart.isRendered = false;                             
        $('#browsing_stats_chart_container').empty();
        setTimeout(function(){
            $('#browsing_stats_chart_container').html('<canvas id="browsing_stats_pie" width="600" height="280"></canvas>');
            setTimeout(function(){
                STATS.Chart.render();                
            }, 20);
        }, 30);
    });
    
    $('#tasks_completed_daterange').on('change', function(){
        STATS.TASKS_SELECTION = $(this).val();
        STATS.Chart.isTasksRendered = false;      
        $('#tasks_container_chart_container').empty();
        setTimeout(function(){
            $('#tasks_container_chart_container').html('<canvas id="tasks_completed_bar" width="600" height="280"></canvas>');
            setTimeout(function(){
                STATS.Chart.renderTasks();                
            }, 20);
        }, 30);
    });
    
    $('body').on('click', '#limit_add_limit', function(){
        var timeLimitDomains = localStorage['time_limit_domains'];
        var domainName = $('#limit_domain_name').val();
        var domainLimit = parseInt($('#limit_domain_minutes').val());
        if(domainLimit < 2){
            domainLimit = 2;
        }
        else if(domainLimit > 500){
            domainLimit = 500;
        }
        
        if(!timeLimitDomains){
            timeLimitDomains = new Array();
        }else{
            timeLimitDomains = $.makeArray($.parseJSON(timeLimitDomains));
        }
        var found = false;
        for(var x = 0; x > timeLimitDomains.length; x++){
            var domainData = timeLimitDomains[x];
            var aDomain = domainData['domain'];
            if(aDomain == domainName){
                found = true;
                timeLimitDomains[x]['limit'] = domainLimit;
            }
        }
        if(!found){
            timeLimitDomains.push({domain: domainName, limit: domainLimit});		
        }
                
        var jsonEncoded = JSON.stringify(timeLimitDomains);
        localStorage['time_limit_domains'] = jsonEncoded;          
        STATS.Chart.renderLimitTable();
    });
    
    $('body').on('click', '.remove_limit', function(){
        var theIndex = this.id.split('_')[1];
        var timeLimitDomains = localStorage['time_limit_domains'];
        if(!timeLimitDomains){
            timeLimitDomains = new Array();
        }else{
            timeLimitDomains = $.makeArray($.parseJSON(timeLimitDomains));
        }
        timeLimitDomains.splice(theIndex, 1);
        var jsonEncoded = JSON.stringify(timeLimitDomains);
        localStorage['time_limit_domains'] = jsonEncoded;           
        STATS.Chart.renderLimitTable();
    });
    
};

STATS.Chart = {
    currentDomains : null,     
    isRendered : false,
    isTasksRendered : false,
    isInit: false,
    visitedChart : null,
    taskChart : null,
    init : function(){ 
        this.currentDomains = new Array();
        if(this.isInit){
            return;
        }
        this.isInit = true;
        STATS.buttonHandlers();        
    },
    getDateStorageString : function(d, prefix){
        var month = '' + (d.getMonth() + 1);
        var day = '' + d.getDate();
        var year = d.getFullYear();
        if(month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        var dateString = [year, month, day].join('-');        
        return prefix + dateString;
    },
    getDisplayDate : function(d){
        var monthArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var month = monthArr[d.getMonth()];
        var year = '' + d.getFullYear();
        var fullDisplay = month + " " + d.getDate(); 
        return fullDisplay;
    },    
    render : function(){
        if(this.isRendered){
            return;
        }
        this.isRendered = true;
        //console.log("trying to render chart");
        
        //with milliseconds
        var unixTime = new Date().getTime();
        var dayArr = new Array();
        if(STATS.DATE_SELECTION == "7days"){
            for(var x = 0; x < 7; x++){
                var currdateTime = unixTime - (x * 86400000);
                var currdate = new Date(currdateTime);
                var storageString = this.getDateStorageString(currdate, "bstats");
                dayArr.push(storageString);
            }
            //console.log("storage strings");
            //console.log(dayArr);            
            
        }
        else if(STATS.DATE_SELECTION == "today"){
            var currdateTime = unixTime;
            var currdate = new Date(currdateTime);
            var storageString = this.getDateStorageString(currdate, "bstats");
            dayArr.push(storageString);
        }
        else if(STATS.DATE_SELECTION == "yesterday"){
            var currdateTime = unixTime - 86400000;
            var currdate = new Date(currdateTime);
            var storageString = this.getDateStorageString(currdate, "bstats");
            dayArr.push(storageString);            
        }
        else{
            console.log("not implemented yet");
        }        
        
        var totalStatsArr = new Array();
        for(var d = 0; d < dayArr.length; d++){
            //console.log("getting storage for " + dayArr[d]);
            var allPastUrls = localStorage[dayArr[d]];
            //console.log(allPastUrls);
            if(!allPastUrls){
                continue;
            }else{
                allPastUrls = JSON.parse(allPastUrls);
                for(var u in allPastUrls){
                    var domain = u;
                    var totalAmount = allPastUrls[u];
                    
                    if(domain in totalStatsArr){
                        totalStatsArr[domain] += totalAmount;
                    }else{
                        totalStatsArr[domain] = totalAmount;
                    }                        
                }
            }            
        }
        
        //console.log("total stats arr ");
        //console.log(totalStatsArr);
        
        
        var statDisplayArr = [];

        for (var key in totalStatsArr) 
            statDisplayArr.push([key, totalStatsArr[key]]);

        statDisplayArr.sort(function(a, b) {
            a = a[1];
            b = b[1];

            return a > b ? -1 : (a < b ? 1 : 0);
        });
        
        var chartBothVals = new Array();
        var chartDomains = new Array();
        var chartSeries = new Array();
        var maxVisited = 0;
        var shuffleArray = function(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }        
        
        for (var i = 0; i < statDisplayArr.length; i++) {
            var domainName = statDisplayArr[i][0];
            var timesVisited = parseInt(statDisplayArr[i][1]);
            if(timesVisited > maxVisited){
                maxVisited = timesVisited;
            }
            //console.log(domainName + " visited " + timesVisited);
            if(i < 10){
                //chartDomains.push(domainName);  // + " (" + timesVisited + "min)");
                //chartSeries.push(timesVisited);   
                chartBothVals.push(domainName + "=" + timesVisited);
            }
            
            //build the table
            
        } 
        shuffleArray(chartBothVals);
        for(var m = 0; m < chartBothVals.length; m++){
            var valArr = chartBothVals[m].split('=');
            chartDomains.push(valArr[0]);
            chartSeries.push(valArr[1]);            
        }
        
        //maxVisited + Math.floor(maxVisited * 0.25);
        
        maxVisited += Math.floor(maxVisited * 0.25);
        
        if(maxVisited > 20){
            maxVisited = Math.floor(maxVisited / 5) * 5;
        }
        if(maxVisited > 100){
            maxVisited = Math.floor(maxVisited / 10) * 10;
        }
        
		var config = {
			type: 'bar',
			data: {
				datasets: [{
					data: chartSeries,
					backgroundColor: [
						'#FC4366',
						'#DCA054',
						'#7C2F36',
						'#CCDED0',
						'#F1C45E',
						'#FC4366',
						'#F2824F',
						'#F7CCAD',
						'#8BE09D',
						'#3488AA',                        
					],
					label: ''
				}],
				labels: chartDomains
			},
			options: {
				responsive: false,
				legend: {
					display: false
				},
				animation: {
					animateScale: true,
					animateRotate: true
				},
                hover: {
                  onHover: function(e, elements) {           
                    $(e.currentTarget).css("cursor", elements[0] ? "pointer" : "default");
                  }
                },                
                scales: {
                    yAxes: [ {
                      display: true,
                      scaleLabel: {
                        display: true,
                        labelString: 'Minutes'
                      },
                      ticks: {
                            max: maxVisited
                      }                      
                    } ]
                },
                events: ['click', 'mousemove'],
                onClick: (evt, item) => {
                    //console.log(evt);
                    //console.log("item");
                    //console.log(item);
                    if(item.length <= 0 || !item[0]['_model']){
                        return;
                    }
                    var theLabel = item[0]['_model']['label'];
                    $('#limit_domain_name').val(theLabel);
                  // change font color for the section to red, changes the fontColor item in array above and trigger reactivity for the options prop in the donut chart component
                 
                }                
			}
		};
        
        var ctx = document.getElementById('browsing_stats_pie').getContext('2d');
        window.myPie = new Chart(ctx, config);      
    },
    renderTasks : function(){
        if(this.isTasksRendered){
            return;
        }
        this.isTasksRendered = true;
        //console.log("trying to render tasks chart");
        
        //with milliseconds
        var unixTime = new Date().getTime();
        var dayArr = new Array();
        var currdateTime = unixTime - 60*60*4*1000;
        //minus 4 hours... so yesterday's day lasts until 4 am today
        var totalDays = 7;
        
        if(STATS.TASKS_SELECTION == "7days"){
            totalDays = 7;            
        }
        else if(STATS.TASKS_SELECTION == "30days"){
            totalDays = 30;
        }
        else{
            console.log("not implemented yet");
        }       
        var firstUnixTime = (unixTime + 86400000) - (totalDays * 86400000);
        var chartDates = new Array();
        for(var x = 0; x < totalDays; x++){
            var currdateTime = firstUnixTime + (x * 86400000);
            var currdate = new Date(currdateTime);            
            var storageString = this.getDateStorageString(currdate, "taskcomplete");
            dayArr.push(storageString);            
            chartDates.push(this.getDisplayDate(currdate));
        }
        
        
        var taskCountArr = new Array();
        var maxTaskVal = 2;
        for(var d = 0; d < dayArr.length; d++){
            //console.log("getting storage for " + dayArr[d]);
            var allPastTasks = localStorage[dayArr[d]];
            //console.log(allPastTasks);
            if(!allPastTasks){
                taskCountArr.push(0);
                continue;
            }else{
                allPastTasks = JSON.parse(allPastTasks);
                if(allPastTasks.length > maxTaskVal){
                    maxTaskVal = allPastTasks.length;
                }
                
                taskCountArr.push(allPastTasks.length);
            }            
        }
        
        //console.log("total count arr");
        //console.log(taskCountArr);        
        
        //maxVisited + Math.floor(maxVisited * 0.25);
        
        maxTaskVal += Math.ceil(maxTaskVal * 0.25);
        
		var config = {
			type: 'bar',
			data: {
				datasets: [{
					data: taskCountArr,
					backgroundColor: [
						'#FC4366',
						'#DCA054',
						'#7C2F36',
						'#CCDED0',
						'#F1C45E',
						'#FC4366',
						'#F2824F',
						'#F7CCAD',
						'#8BE09D',
						'#3488AA',                        
						'#FC4366',
						'#DCA054',
						'#7C2F36',
						'#CCDED0',
						'#F1C45E',
						'#FC4366',
						'#F2824F',
						'#F7CCAD',
						'#8BE09D',
						'#3488AA',   
						'#FC4366',
						'#DCA054',
						'#7C2F36',
						'#CCDED0',
						'#F1C45E',
						'#FC4366',
						'#F2824F',
						'#F7CCAD',
						'#8BE09D',
						'#3488AA',   
						'#FC4366',
						'#DCA054',
						'#7C2F36',
						'#CCDED0',
						'#F1C45E',
						'#FC4366',
						'#F2824F',
						'#F7CCAD',
						'#8BE09D',
						'#3488AA'                        
					],
					label: ''
				}],
				labels: chartDates
			},
			options: {
				responsive: false,
				legend: {
					display: false
				},
				animation: {
					animateScale: true,
					animateRotate: true
				},
                hover: {
                  onHover: function(e, elements) {           
                    $(e.currentTarget).css("cursor", elements[0] ? "pointer" : "default");
                  }
                },                
                scales: {
                    yAxes: [ {
                      display: true,
                      scaleLabel: {
                        display: true,
                        labelString: 'Tasks Completed'
                      },
                      ticks: {
                            max: maxTaskVal
                      }                      
                    } ]
                },
                events: ['click', 'mousemove'],
                onClick: (evt, item) => {
                    //console.log("event: ");
                    //console.log(evt);
                    //console.log("item");
                    //console.log(item);
                    if(item.length <= 0 || !item[0]['_model']){
                        return;
                    }
                    var theLabel = item[0]['_model']['label'];
                 
                }                
			}
		};
        
        var ctx = document.getElementById('tasks_completed_bar').getContext('2d');
        this.taskChart = new Chart(ctx, config);      
    },
    renderLimitTable : function(){
        $('#browsing_limit_table tbody').empty();
        var timeLimitDomains = localStorage['time_limit_domains'];
        
        console.log("rendering timelimitdomains ");
        console.log(timeLimitDomains);
        
        if(!timeLimitDomains){
            timeLimitDomains = new Array();
        }else{
            timeLimitDomains = $.makeArray($.parseJSON(timeLimitDomains));
        }
        var found = false;
        for(var x = 0; x < timeLimitDomains.length; x++){
            var domainData = timeLimitDomains[x];
            var aDomain = domainData['domain'];
            var aLimit = domainData['limit'];
            console.log("domain data ");
            console.log(domainData);
            
            var $tr = $('<tr><td>' + aDomain + '</td><td>' + aLimit + 
                    '</td><td><a class="remove_limit" id="removelimit_' + x + '"><i class="fas fa-times"></i></a></td></tr>');
            
            $('#browsing_limit_table tbody').append($tr);
        }        
    }
}
    