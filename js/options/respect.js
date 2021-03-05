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
var RESPECT = RESPECT || {};

RESPECT.buttonHandlers = function(){
    
};


//calculator
//only run from background script
RESPECT.Calculator = {
    calculateRespectScore : function(dateObj){
    	//update respect score for previous day if not updated yet
        //actually check the last 2 days... someone might not have used their browser?
        
        //We know how many minutes they spent online (if not assume they were online 12 hours) 
        //We know how many tasks they did
        //Did they set a task goal for that time period, was it met...?
        //We know how many interventions asked, and which ones they completed 
        //Ratio of time on allowed sites to blocked
        //Ratio of scheduled free time to set work times...
        
        //look at todays task total... average of last 14 days
        //if day is at least 80% 

        //rate of task completion has to stay stable....
        //level 1 = less than 10 tasks
        //level 2 = 
        
        //did they remove block pages?  
        var currentRespectScore = localStorage['respect_score'];
        if(!currentRespectScore){
            currentRespectScore = 0.0;
        }
        var newRespectScore = parseFloat(currentRespectScore);
        var interventionChange = parseFloat(this.calculateInterventionChange(dateObj, currentRespectScore));
        newRespectScore = newRespectScore + interventionChange;
        console.log("old respect score: " + currentRespectScore);
        console.log("new score after intervnetions");
        console.log(newRespectScore);
        
        var taskChange = parseFloat(this.calculateTaskChange(dateObj, currentRespectScore));
        newRespectScore = newRespectScore + taskChange;
        console.log("new score inter+tasks: ");
        console.log(newRespectScore);
        
        var disablePenalty = parseFloat(this.calculateDisablePenalty(dateObj));
        newRespectScore = newRespectScore + disablePenalty;
        console.log("disable penalty " + disablePenalty);
        console.log("new score " + newRespectScore);
        
        var processDate = dateObj.toString("M/d/yyyy");
       
        return {process_date: processDate, old_score: currentRespectScore, new_score: newRespectScore, task_change: taskChange, intervention_change: interventionChange, disable_penalty: disablePenalty};        
    },
    calculateDisablePenalty : function(dateObj){
        var displayDate = dateObj.toString("M-d-yyyy");
        var disabledEntry = localStorage['disabled_penalty_' + displayDate];           
        if(!disabledEntry){
            return 0.0
        }
        var secOff = parseInt(disabledEntry['minSec']);
        if(secOff > 10000){
            return -2.0;
        }
        else if(secOff > 5000){
            return -1.0;
        }
        else if(secOff > 2000){
            return -0.3;
        }
        else if(secOff > 300){
            return -0.2;
        }
        
        
        return 0.0;
    },
    calculateInterventionChange : function(dateObj, currentRespectScore){
        
        
        var respectChange = 0.0;
        var intCompleted = 0;
        var intMissed = 0;
        var intTotal = 0;
        var storageString = this.getDateStorageString(dateObj, "interventions");
        //dayArr.push(storageString);

        var dateInterventions =  localStorage[storageString];	
        if(!dateInterventions){
            console.log("create new today tasks done");
            dateInterventions = new Array();
        }else{
            dateInterventions = JSON.parse(dateInterventions);
        }                
        for(var m = 0; m < dateInterventions.length; m++){
            var dInter = dateInterventions[m];
            var theStatus = dInter['status'];
            if(theStatus == "complete" || theStatus == "completed"){
                intCompleted++;
            }else if(theStatus == 'expired'){
                intMissed++;
            }
            intTotal++;
        }        
        console.log("total " + intTotal);
        console.log("complete " + intCompleted);
        console.log("expired " + intMissed);
        
        
        var neededRatio = 0.4;
        console.log("needed ratio");
        console.log(neededRatio);
        if(intMissed > 0 && ((intCompleted / intTotal) < neededRatio)){
            if(currentRespectScore > 80.0){
                return -0.02;
            }            
            else if(currentRespectScore > 50.0){
                return -0.01;
            }
            else{
                return -0.0;
            }            
        }else if(intMissed == 0 && intCompleted > 2){
            //sure give a little respect
            if(currentRespectScore < 50.0){
                return 0.3;
            }
            else{
                return 0.1;
            }                      
        }
        
        return 0.0;
    },
    calculateTaskChange : function(dateObj, currentRespectScore){

        console.log("here");        
        //respect score out of 100
        var processDateStorage = this.getDateStorageString(dateObj, "taskcomplete");
        console.log("prcess date storage " + processDateStorage);
        
        var maxTaskRespectEarned = 1.8;        
        if(currentRespectScore > 20.0){
            maxTaskRespectEarned = 1.6;
        }
        if(currentRespectScore > 40.0){
            maxTaskRespectEarned = 1.4;
        }
        if(currentRespectScore > 60.0){
            maxTaskRespectEarned = 1.0;
        }
        if(currentRespectScore > 80.0){
            maxTaskRespectEarned = 0.5;
        }             
       var unixTime = new Date().getTime();
        var dayArr = new Array();
        var currTime = unixTime - 60*60*4*1000;
        //minus 4 hours... so yesterday's day lasts until 4 am today
        var getTasksCompleted = function(theString){
            var allPastTasks = localStorage[theString];
            //console.log(allPastTasks);
            if(!allPastTasks){
                return 0;
            }                
            allPastTasks = JSON.parse(allPastTasks);                
            return allPastTasks.length;                             
        }
        
        var totalDays = 21;
        var chartDates = new Array();
        var foundDate = false;
        var foundDateMod = 0;
        var dateTaskCount = 0;
        var oldTaskTotal = 0;
        var oldTaskNum = 0;
        for(var x = 0; x < totalDays; x++){
            var currdateTime = currTime - (x * 86400000);
            var currdate = new Date(currdateTime);            
            var storageString = this.getDateStorageString(currdate, "taskcomplete");
            console.log("testing storage string " + storageString);
            if(storageString == processDateStorage){
                foundDate = true;
                foundDateMod = x % 7;
                dateTaskCount = getTasksCompleted(storageString);                
                console.log("found date task count " + dateTaskCount);
                console.log("found date mod " + foundDateMod);
            }
            else if(foundDate && foundDateMod == (x % 7)){
                //look back 7 days, 14 days... compare task completion rate to those
                var oldTaskCount = getTasksCompleted(storageString);             
                oldTaskTotal += oldTaskCount;
                oldTaskNum++;
                console.log("old task num " + oldTaskNum + " amount " + oldTaskTotal);
                
            }
            
        }        
        if(oldTaskTotal == 0){
            if(dateTaskCount > 0){
                return maxTaskRespectEarned * 0.5;
            }else{
                return 0.0;
            }
        }
        
        var avgCount = oldTaskTotal / oldTaskNum;
        console.log("avg task count " + avgCount);
        console.log("process date task count " + dateTaskCount);
        
        
        if(avgCount > 0 && dateTaskCount == 0){
            //not good to do no tasks
            return -0.001;
        }else if(dateTaskCount == 0){
            return 0.0;
        }
        else if(avgCount > 0){
            var ratio = dateTaskCount / avgCount;
            console.log("ratio " + ratio);
            if(ratio > 1.5){
                return maxTaskRespectEarned * 1.2;
            }
            else if(ratio > 1.0){                
                return maxTaskRespectEarned * 1.0;
            }
            else if(ratio > 0.9){                
                return maxTaskRespectEarned * 0.5;
            }
            else if(ratio > 0.8){                
                return maxTaskRespectEarned * 0.2;
            }
            else if(ratio > 0.5){                
                return -0.005;
            }
            else if(ratio > 0.2){ 
                return -0.001;
            }
            else if(ratio > 0.0){                
                return -0.002;
            }            
        }
        else if(dateTaskCount > 0.0){
            return maxTaskRespectEarned * 0.5;
        }
        return 0.1;
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
    }    
};

