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
var BlockLogic = {

    websitesFreePass : new Array(),
    websitesImmediateBlock : new Array(),
    timeLimitDomains : new Array(),
    timeLimitExceeded : false,
    autocloseTime : 30,
	inactiveCloseTime : 30,
	reduceTimeIfVisited : 3, 
	//autocloseNeverReset : true,
    selectedElement: null,
	//sets the options
	setBlockArrays : function(freeArr, blockArr, limitDomains)
	{
        //console.log("setting freearr to ");
        //console.log(freeArr);
        //console.log("setting immeddiate block");
        //console.log(blockArr);
        
		this.websitesFreePass = freeArr;
		this.websitesImmediateBlock = blockArr;
        this.timeLimitDomains = limitDomains;
	},	
	/***********************************
	* Ticks every second on all non-FreePass pages.  Sends message to close tab when time expires
	* @returns 0 = always block, 1 = normal page, close after X, 2 = Free to browse on page
	**************************************/
	checkForValidUrl : function(currentUrl, domainUrl) 
    {
	    if(this.alwaysBlock(currentUrl))
	    {
			return 0;
	    }    
    
	    if(this.hasFreePass(currentUrl))
	    {
			return 2;
	    }
	    else
	    {
			return 1;
	    }
	},	
	alwaysBlock : function(theUrl)
	{
		for(var i = 0; i < this.websitesImmediateBlock.length;i++)
		{
			var theRules = this.websitesImmediateBlock[i];
			if(theRules.length < 3)
			{
				continue;				
			}
			//TODO: Could be multiple rules separated by && or &&!
			var ruleSplit = theRules.split(/\&\&/);			
			var rulePass = false; 
			for(var r = 0; r < ruleSplit.length; r++)
			{
				var aRule = ruleSplit[r];
                var reverseIt = false;
                if(aRule.substr(0,1) == "!" && r > 0){
                    //console.log("reverse it " + r);
                    reverseIt = true;
                    aRule = aRule.substring(1);
                }
                if(reverseIt){                   
                    if(theUrl.indexOf(aRule) >= 0)
                    {
                        rulePass = true;
                    }
                }else{
                    //console.log("Is " + aRule + " inside of " + theUrl);
                    if(theUrl.indexOf(aRule) >= 0)
                    {
                        rulePass = false;
                    }
                    else
                    {
                        rulePass = true;
                    }				                    
                }
			}
			if(!rulePass)
			{
                console.log("Productivity Owl blocking url because rule " + theRules);
				return true;
			}		
		}		
		
		return false;	
	},	
    timeLimitUp : function(url, currMin){
        if(this.timeLimitDomains.length <= 0){
            return false;
        }
        
        for(var x = 0; x < this.timeLimitDomains.length; x++){
            var domainData = this.timeLimitDomains[x];
            var aDomain = domainData['domain'];
            var aLimit = parseInt(domainData['limit']);   
            if(aDomain == url){
                if(currMin >= aLimit){
                    return true;
                }
            }
        }        
        return false;
    },
	loadTimeOptions : function(timeArr)
	{
		this.autocloseTime = timeArr[0];
		var subtractTime = timeArr[1];
        //console.log("subtract time is ");
        //console.log(subtractTime);
        if(subtractTime == "1"){
            this.reduceTimeIfVisited = 3;
        }else{
            this.reduceTimeIfVisited = 0;
        }
	},
	hasFreePass : function(theUrl)
	{
		//console.log("Checking Free Passes, total num: " + this.websitesFreePass.length);
		
		for(var i = 0; i < this.websitesFreePass.length;i++)
		{
            //console.log(this.websitesFreePass[i]);
			var theRules = this.websitesFreePass[i];
			if(theRules.length < 3)
			{
				continue;				
			}
			
			var ruleSplit = theRules.split(/\&\&/);			
			var ruleFailed = false; 
			for(var r = 0; r < ruleSplit.length; r++)
			{
				var aRule = ruleSplit[r];
				//console.log("Is " + aRule + " inside of " + theUrl);
				if(theUrl.indexOf(aRule) >= 0)
				{
					//console.log("Found " + aRule + " in " + theUrl);
				}
				else
				{
					ruleFailed = true;
				}				
			}
			if(!ruleFailed)
			{
                console.log("Productivity Owl allowing url because rule " + theRules);
				return true;
			}
			
			//TODO: Could be multiple rules separated by && or &&!
			//console.log("Is " + theRules + " inside of " + theUrl);			
			//if(theUrl.indexOf(theRules) >= 0)
			//{
			//	console.log("Found " + theRules + " in " + theUrl);
			//	return true;				
			//}
		}

		return false;	
	},
	doNotInactiveClose : function(theUrl)
	{
		if(theUrl.indexOf("localhost") >= 0)
		{
			return true;
		}
		return false;
	},
    getCurrentDateText : function(){
        //utility function
        var currentTime = new Date();
        var month = currentTime.getMonth() + 1;
        var day = currentTime.getDate();
        var hours = currentTime.getHours();
        var minutes = currentTime.getMinutes();

        var beforeNoon = "AM";
        if(hours > 11)
        {
            hours = hours - 12;
            beforeNoon = "PM";  //not before noon
        }
        if(hours == 0)
            hours = 12;
        if(minutes.toString().length < 2)
            minutes = "0" + minutes.toString();

        var dateText = month + "/" + day + " " + hours + ":" + minutes + " " + beforeNoon;
        //alert(dateText);

        return dateText;        
    }
};	
