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

var OWL = OWL || {};
OWL.INTERVAL_TIMER = -1;
OWL.INACTIVE_TIMER = -1;
OWL.BODY_TIMER = setInterval(function(){
	if(document.body)
	{
		clearInterval(OWL.BODY_TIMER);
		afterBodyLoad();
	}
}, 500);  //.5 sec

//movement vars
OWL.OPTIONS_LOADED = false;
OWL.MOVING_OWL = null;
OWL.BEING_DRAGGED = false;
OWL.BREAK_FREE_TIME = 200;
OWL.BREAK_FREE = false;
OWL.ANIMATING_OWL = false;
OWL.DRAGGABLE_OWL = null;
OWL.SITTING_SIDE = "right";

//used for browser stats (to track how much time you're spending on  various pages)
//can be turned off in the Browser Stats tab in the options 
OWL.STATS_DISABLED = false;
OWL.DOMAIN_URL = "";
OWL.LAST_ACTIVE_TIMESTAMP = null;

//interventions
OWL.INTERVENTION_DISABLED = false;
OWL.INTERVENTION_TIME_LEFT = 0;
OWL.INTERVENTION_COMPLETE = false;
OWL.INTERVENTION_EXPIRED = false;
OWL.INTERVENTION_INTERVAL = null;
OWL.INTERVENTION_TYPE = "";


var OWL_STUCK_COUNTER = 0;

var SHOULD_CLOSE_PAGE = false;
var SHOULD_CLOSE_PAGE_COUNT = 10;
var OWL_EXCEPTION_BUT_COUNT = 0;
var OWL_COUNTER = 0;
var CURRENT_VACATION_TIME = 0;
var FREETIME_TYPE = "";
var VACATION_LEFT = 0;
OWL.VACATION_TIMER = -1;

//-2 = intervention
//-1 = start
//0 = blocking page
//1 = grey page, do countdown
//2 = allowed page
//3 = freetime/vacationtime
OWL.STATE = -1;


function afterBodyLoad()  //window.waitUntilExists(document, function()
{
    OWL.LAST_ACTIVE_TIMESTAMP = new Date().getTime() / 1000;
	/*******  LOAD THE OPTIONS FROM THE BACKEND **************/

	var freeArr = new Array();
	var blockArr = new Array();
    //console.log("sending message");
    var params = {method: "get_all_options"};
    chrome.runtime.sendMessage(params, function(response){
        //console.log("got a response from get_all_options");
        //console.log(response);
        var theData = response['data'];
        //console.log("thedata");
        //console.log(theData);
        freeArr = JSON.parse(theData['allowed_websites']);
        blockArr = JSON.parse(theData['blocked_websites']);
        var autocloseOptions = JSON.parse(theData['autoclose_options']);
        var vacationTime = JSON.parse(theData['vacation_time']);
        var timeLimitDomains = theData['time_limit_domains']; 
        OWL.INTERVENTION_DISABLED = theData['interventions_disabled'];
        OWL.STATS_DISABLED = theData['stats_disabled']
        OWL.SITTING_SIDE = theData['owl_side'];
        if(OWL.SITTING_SIDE != 'right' && OWL.SITTING_SIDE != 'left'){
            OWL.SITTING_SIDE = 'right';
        }
        //console.log("time limit domains ");
        //console.log(timeLimitDomains);
        
        
        
        CURRENT_VACATION_TIME = parseInt(vacationTime);
                
        BlockLogic.setBlockArrays(freeArr, blockArr, timeLimitDomains);
        var defaultArr = new Array();
        defaultArr.push(30);defaultArr.push(0);defaultArr.push(0);
        if(!autocloseOptions)
        {
            autocloseOptions = defaultArr;
        }

        BlockLogic.loadTimeOptions(autocloseOptions);
        OWL.OPTIONS_LOADED = true;
        chrome.runtime.sendMessage({method: "isFreeTime", url: window.location.hostname},
        function(response)                                
        {	
            //console.log("res: ");
            //console.log(response);
            //console.log("res data: " + response.data);
            if(!response){
                return false;
            }
            if(response.data == 1)
            {
                //alert("IT IS FREE TIME NOW");
                FREETIME_TYPE = response.freetime_type;
                VACATION_LEFT = response.sec_left;
                owlHandleFreetime();                        
            }
            else if(response.data <= 0)
            {
                var visitedCount = 0;
                if(response.visited_count)
                {
                    visitedCount = response.visited_count;
                }
                //HANDLE THE CURRENT URL
                owlHandleCurrentUrl(visitedCount);

                //MJR CHANGED BUG 12/11/12 error in "production" version
                if(response.data < 0)
                {
                    var minutesAway = response.data * -1;
                }
            }
            else
            {
                console.log("UNKNOWN IF FREETIME");
            }
            //alert(BlockLogic.websitesImmediateBlock);
            //BlockLogic.websitesImmediateBlock = JSON.parse(response.data);
        }); 


        if(!OWL.STATS_DISABLED){
            //when this happens 
            var activeEventOccured = function(){
                OWL.LAST_ACTIVE_TIMESTAMP = new Date().getTime() / 1000;
            };

            $(window).on('scroll', function(){
                //console.log("scroll");
                activeEventOccured();
            });

            $(window).on('mousemove', function(){
                //console.log("mouse move");
                activeEventOccured();
            });
            setInterval(function(){
                $('video').each(function(){
                    var video = this;
                    if(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2){
                        //console.log("video playing");
                        activeEventOccured();
                    }
                });
                $('audio').each(function(){
                    var audio = this;
                    if(audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2){
                        //console.log("video playing");
                        activeEventOccured();
                    }
                });                
            }, 10000);


        }
        
        //switch sides if left side
        setTimeout(function(){
            if(OWL.SITTING_SIDE == "left"){
                $('.prodowl-switchside').trigger('click');
            }
        }, 1000);
        
    });  
    
    
    var hostUri = URI.parse(window.location.href);
    var host = hostUri['host'];
    if(host && host.split(".").length > 2){
        //console.log("subdomain detected");
        //want to keep whatever.co.uk, but remove chicago from... chicago.craigslist.org
        var hostParts = host.split('.');
        hostParts.shift();
        var newHost = hostParts.join(".");
        if(newHost.length > 8){
            host = newHost;
        }
    }
    OWL.DOMAIN_URL = host;   
    
    
    
}



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //console.log("got message");
    //console.log(request);
    if(request.method == 'vacation_started'){
        setTimeout(function(){
            //blockpage, we should refresh the page
            if($('#owl_productivity_blockpage').length > 0){
                console.log("SHOULD REFRESH THE PAGE");
            }
            else{
                
            }
        }, 1000);
    }
    else if(request.method == 'intervention_status_change'){
        //console.log("intervention status change");
        //console.log(request);
        if($('#owl_productivity_intervention').length >= 1){
            if(request.status == 'completed'){
                OWL.INTERVENTION_COMPLETE = true;
                $('#intervention_timer').html("Complete");
                $('#intervention_timer').css("color", 'green');
                /*
                var tableId = 'intervention_' + OWL.INTERVENTION_TYPE + '_table';
                $('#' + tableId).css('display', 'none');
                */
                $('#owl_all_interventions').css('display', 'none');
                $('#owl_intervention_completed').css('display', 'block');
            }
            else if(request.status == 'expired'){
                OWL.INTERVENTION_EXPIRED = true;
                $('#intervention_timer').html("Expired");
                $('#owl_all_interventions').css('display', 'none');                
                $('#owl_intervention_expired').css('display', 'block');                
            }
            setTimeout(function(){               
                closeMyTab();
            }, 10000);
        }
    }
    else if(request.method == 'record_domain'){
        //console.log("record_domain");
        var currTime = new Date().getTime() / 1000;
        var diffSec = currTime - OWL.LAST_ACTIVE_TIMESTAMP;
        //not active in last 3 min, or owl state is block page or intervention
        if(!diffSec || diffSec > 180 || OWL.STATE == 0 || OWL.STATE == -1 || OWL.STATE == -2){
            //console.log("sending inactive " + OWL.DOMAIN_URL);
            sendResponse({data: "inactive", domain: OWL.DOMAIN_URL});
        }
        else{
            //console.log("sending active " + OWL.DOMAIN_URL);
            sendResponse({data: "active", domain: OWL.DOMAIN_URL});
        }
        
        if(OWL.STATE == 1){
            chrome.runtime.sendMessage({method: "isFreeTime", url:"none"},
            function(response)
            {	
                if(response.data == 1)
                {

                }else{
                    clearInterval(OWL.VACATION_TIMER);
                    owlHandleCurrentUrl(100);                                
                }
            });             
        }
    }
    
});





/*
$(function()
{
	//now we try to load owl faster than document.ready

	//communication with MotivationLand
	//var port = chrome.extension.connect();
	var elem = document.getElementById('productivity_owl_messenger');
	if(elem)
	{
		elem.addEventListener('owlEvent',
		function()
		{
		    var eventData = document.getElementById('productivity_owl_messenger').innerText;

			if(eventData.indexOf("add_vacation") >= 0)
			{
				var theMin = eventData.split("=")[1];
				chrome.extension.sendRequest({method: "addVacationTime", time: theMin},
				function(response)
				{
					console.log("After addVacationTime: ");
					console.log(response);
					//CURRENT_VACATION_TIME = parseInt(response.data);
					//alert("CURRENT VACATION TIME: " + CURRENT_VACATION_TIME);
				});

			}
			else
			{
				console.log("unknown owlEvent");
			}

			//alert(eventData);
			//port.postMessage({message: "myCustomEvent", values: eventData});
		});
	}


});
*/



var afterBlockCallback = function()
{
	//OPTION 2
    //Use YUI library
	//console.log("Test2");
	//var movingOwl = new YAHOO.util.DD("owl_image");
    //console.log("after block callback");
    var movingOwl = new PlainDraggable(document.getElementById('owl_image'),{leftTop: true, containment : {left: -1000, top: -1000, width: 10000, height: 10000}});    
	var imgTree = chrome.extension.getURL('img/a_tree_cut.png');
	$('#owl_container').css('background-image', 'url(' + imgTree + ')');

	$('#owl_image').on('mouseenter', function()
	{
	  $(this).css("cursor","move");
	}).on('mouseout', function()
	{
	  $(this).css("cursor","pointer");
	});
    
    if(BlockLogic.timeLimitExceeded){
        $('#prodowl_block_heading').html("TIME LIMIT EXCEEDED FOR THIS DOMAIN");
    }

	movingOwl.onDragEnd = function(pos){
		var theSaying = getOwlSaying("block_page");

		var randomTen = Math.floor(Math.random() * 12);
		//revert to old saying most of time
		if(randomTen > 2)
		{
			theSaying = $('#owl_image').qtip('option', 'content.text');
		}
		$('#owl_image').qtip('option', 'content.text', theSaying);
		$('#owl_image').qtip('show');

	};

	setTimeout(function()
	{

		//Handle the QTIP
		$("#owl_image").qtip({
		content:
		{
			text: "I am an owl"
		},
		width: {
			min: 100,
			max: 200
		},
		position: {
			my: 'top left',  // Position my top left...
			at: 'right top',
			adjust : {
				y : 12
			}
		},
		events: {
			hide: function(event, api)
			{
				event.preventDefault(); // No Hiding
			}
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
		//console.log('Shown1');

        
		var theSaying = getOwlSaying("block_page");
        if(BlockLogic.timeLimitExceeded){
            theSaying = getOwlSaying("limit_page");
        }

		$('#owl_image').qtip('option', 'content.text', theSaying);
		$('#owl_image').qtip('show');
	}, 1000);
    OWL.BlockPageHandlers();      
    

};


function getOwlSaying(messageGroup)
{
	 var sayingArr = owlSayings[messageGroup];
	 var randomSaying = Math.floor(Math.random() * sayingArr.length);
	 var theSaying = sayingArr[0];
	 for(var i = 0; i < sayingArr.length; i++)
	 {
		if(randomSaying == i)
	    {
			theSaying = sayingArr[i];
		}
	 }
	 return theSaying;
}

var afterCounterPageLoads = function()
{
    OWL.STATE = 1;
	OWL.INTERVAL_TIMER = setInterval(function(){
        owlClockTick();
    }, 1000);
    $('#owl_countdown_box').css('position', 'fixed');

	$('#owl_countdown_box').on('click', function()
	{
		console.log("CLICKED THE OWL");
		if(CURRENT_VACATION_TIME > 0)
		{
            $('#owl_countdown_box').qtip({
                content:
                {
                    text: "You have " + CURRENT_VACATION_TIME + " min of break time.  Click the owl extension icon to use it."
                },
                width: {
                    min: 100,
                    max: 200
                },
                position: {
                    my: 'top left',  // Position my top left...
                    at: 'right top',
                    adjust : {
                        y : 12
                    }
                },
                events: {
                    hide: function(event, api)
                    {
                        event.preventDefault(); // No Hiding
                    }
                },
                style:
                {
                    tip:
                    {
                        corner: 'left center'
                    }
                }
            });

            $('#owl_countdown_box').qtip('show');            
		}
		else
		{
			console.log("No vacation time");
		}
	});


}

function owlHandleFreetime()
{
	var imageEmptyTree = chrome.extension.getURL('img/no_owl_in_tree_small.png');

	loadMustacheTemplate('templates/owl_freetime_overlay.html', 'body',
	{img_empty_tree : imageEmptyTree},
	afterFreetimePageLoads);
}

function afterFreetimePageLoads()
{
    OWL.STATE = 3;
	//setup popups for save for laters
	$('#owl_countdown_box').css('position', 'fixed');
    OWL.switchSideHandler();
	if(FREETIME_TYPE == "vacation")
	{
        var updateVacationTimeDisplay = function(){            
            var vacMin = Math.floor(VACATION_LEFT / 60);
            if(vacMin > 0){                
                $('#owlproductivity_timer').html("Break: " + vacMin + " min");                            
            }else{
                $('#owlproductivity_timer').html("Break: " + VACATION_LEFT + " sec");            
            }
        };
        
		$('#owl_countdown_box').css("width", "140px");
        OWL.VACATION_TIMER = setInterval(function(){
            VACATION_LEFT--;
            
            if(VACATION_LEFT < 0){
                clearInterval(OWL.VACATION_TIMER);
                owlHandleCurrentUrl(100);
            }else{
                updateVacationTimeDisplay();
            }
            
            if((VACATION_LEFT % 60) == 0){
                chrome.runtime.sendMessage({method: "isFreeTime", url:"none"},
                function(response)
                {	
                    if(response.data == 1)
                    {
                
                    }else{
                        clearInterval(OWL.VACATION_TIMER);
                        owlHandleCurrentUrl(100);                                
                    }
                });                
            }
            
        }, 1000);
	}
    else if(FREETIME_TYPE == 'scheduler'){
        $('#owlproductivity_timer').html("Scheduled Freetime").addClass('prodowl-scheduled-freetime'); 
        $('#owlproductivity_timer').css('font-size', '10px !important');
            
    }
}



OWL.switchSideHandler = function(){
    $('body').on('click', '.prodowl-switchside', function(){        
         if($('#owl_countdown_box').hasClass('prodowl-right')){
             OWL.SITTING_SIDE = "left";
             $('#owl_countdown_box').removeClass('prodowl-right');
             $('#owl_countdown_box').addClass('prodowl-left');
             if(OWL.STATE == 1 || OWL.STATE == 3){
                 var image = chrome.extension.getURL('img/owl_in_tree_small_flip.png');
                 $('#owl_countdown_box').css('background', 'url(' + image + ')');
             }else if(OWL.STATE == 2){
                 var image = chrome.extension.getURL('img/no_owl_in_tree_small_flip.png');
                 $('#owl_countdown_box').css('background', 'url(' + image + ')');                 
             }             
         }else{
             OWL.SITTING_SIDE = "right";
             $('#owl_countdown_box').removeClass('prodowl-left');             
             $('#owl_countdown_box').addClass('prodowl-right');             
             if(OWL.STATE == 1 || OWL.STATE == 3){
                 var image = chrome.extension.getURL('img/owl_in_tree_small.png');
                 $('#owl_countdown_box').css('background', 'url(' + image + ')');
             }else if(OWL.STATE == 2){
                 var image = chrome.extension.getURL('img/no_owl_in_tree_small.png');
                 $('#owl_countdown_box').css('background', 'url(' + image + ')');                 
             }             
             
         }
        chrome.runtime.sendMessage({method: "save_owl_side", side : OWL.SITTING_SIDE}, 
        function(response) 
        {

        });           
         
         
    });
}

OWL.afterInterventionLoaded = function(){
    //console.log("intervention loaded");
	var imgBackground = chrome.extension.getURL('img/intervention_background.jpg');
	$('#owl_intervention_container').css('background', 'url(' + imgBackground + ')'); 
    
    $('#intervention_' + OWL.INTERVENTION_TYPE).css('display', 'block');
	$('#owl_image').on('mouseenter', function()
	{
	  $(this).css("cursor","move");
	}).on('mouseout', function()
	{
	  $(this).css("cursor","pointer");
	});    
    
    OWL.DRAGGABLE_OWL = new PlainDraggable(document.getElementById('owl_image'),{leftTop: true, containment : {left: -1000, top: -1000, width: 10000, height: 10000}});    
    
    OWL.DRAGGABLE_OWL.onDragEnd = function(pos){
        //console.log("END DRAG position");
        //console.log(pos);
        var theSaying = getOwlSaying("intervention_" + OWL.INTERVENTION_TYPE);
		var randomTen = Math.floor(Math.random() * 12);
		//revert to old saying most of time
		if(randomTen > 2)
		{
			theSaying = $('#owl_image').qtip('option', 'content.text');
		}
		$('#owl_image').qtip('option', 'content.text', theSaying);
		$('#owl_image').qtip('show');        
        
    };
    
    OWL.DRAGGABLE_OWL.onDrag = function(pos){
        console.log("ondraggggg");
        console.log(pos);
    };

    OWL.DRAGGABLE_OWL.onDragStart = function(pos){
        console.log("startdrag");
        console.log(pos);
    };    
	setTimeout(function()
	{
        //qtip message
		$("#owl_image").qtip({
		content:
		{ 
            text: "I am an owl"},
            width: { min: 100,max: 200},
            position: {my: 'top left', at: 'right top', adjust : { y : 12 } },
            events: {hide: function(event, api){event.preventDefault();}},
            style: { tip: { corner: 'left center' }}
		});

		$('#owl_image').qtip('show');
        
		var theSaying = getOwlSaying("intervention_" + OWL.INTERVENTION_TYPE);

		$('#owl_image').qtip('option', 'content.text', theSaying);
		$('#owl_image').qtip('show');
	}, 1000);    
    
    //console.log("setting up");
    $('#owl_productivity_intervention').on('click', '#create_subtask_link', function(e){
        e.preventDefault();
        console.log("click");
        chrome.runtime.sendMessage({method: "optionsLinkClick", "navlink" : "#tasks_rewards"}, 
        function(response) 
        {

        });            
        return false;
    });
    
    //console.log("init intervention");
    INTV.Intervention.init();
    
    
};

OWL.loadIntervention = function(selInter){
    OWL.STATE = -2;
    OWL.INTERVENTION_TYPE = selInter;
    
    var image = chrome.extension.getURL('img/advice_owl_small.png');
    $('body').empty().css("background", "white").css("margin", "0");
    $('head').empty();  //some pages might load popups or something... who knows
    loadMustacheTemplate('templates/owl_intervention.html', 'body', {advice_owl_small : image}, OWL.afterInterventionLoaded);

    setInterval(function(){
        if($('#owl_productivity_intervention').length <= 0){
            console.log("no intervention owl?");
            $('body').empty().css("background", "white").css("margin", "0");
            $('head').empty();  //some pages might load popups or something... who knows
            loadMustacheTemplate('templates/owl_intervention.html', 'body', {advice_owl_small : image}, OWL.afterInterventionLoaded);                              
        }
    }, 100);    
    
    $('#intervention_' + selInter).css('display', 'block');
    chrome.runtime.sendMessage({method: "start_intervention", "intervention_type" : selInter}, 
    function(resp) 
    {
        var updateInterventionTimeDisplay = function(secLeft){            
            var interMin = Math.floor(secLeft / 60);
            var interSec = (secLeft % 60).toString();

            if(interSec.toString().length < 2)
                interSec = "0" + interSec.toString();        
            
            if(OWL.INTERVENTION_COMPLETE){
                $('#intervention_timer').html("Complete");
                $('#intervention_timer').css("color", 'green');
                clearInterval(OWL.INTERVENTION_INTERVAL);
                return;
            }else if(secLeft <= 0 || OWL.INTERVENTION_EXPIRED){
                $('#intervention_timer').html("Expired");
                clearInterval(OWL.INTERVENTION_INTERVAL);                
                return;                
            }
            $('#intervention_timer').html(interMin + ":" + interSec);
            
            //if(vacMin > 0){                
            //    $('#intervention_timer').html("Break: " + vacMin + " min");                            
            //}else{
            //    $('#intervention_timer').html("Break: " + VACATION_LEFT + " sec");            
            //}
        };        
        var secLeft = resp.time_left;
        OWL.INTERVENTION_TIME_LEFT = secLeft;
        OWL.INTERVENTION_INTERVAL = setInterval(function(){
           OWL.INTERVENTION_TIME_LEFT--;
           updateInterventionTimeDisplay(OWL.INTERVENTION_TIME_LEFT);
        }, 1000);
    });        
    
};

function afterAllowedPageLoads()
{
    OWL.switchSideHandler();
	//setup popups for save for laters
	$('#owl_countdown_box').css('position', 'fixed');

    $('.prodowl-tasklist-button').on('click', function(e){        
        e.preventDefault();
        /*
        //testing interventions
        INTV.Intervention.getInterventionToLoad(function(selectedIntervention){
            console.log("got back intervention " + selectedIntervention);
            if(selectedIntervention != 'none'){
                OWL.loadIntervention(selectedIntervention);
            }               
        });
        return false;         
        */
        chrome.runtime.sendMessage({method: "optionsLinkClick", "navlink" : "#tasks_rewards"}, 
        function(response) 
        {

        });           
        
        //Decided against loading task list in popup, because multiple popups in popups, 
        //just send to task page in this version
        /*
        if($('#prodowl-modal-tasklist').length <= 0){
            var modalHtml = '' + 
                '<div class="prodowl-contentscript prodowl-modal prodowl-micromodal-slide" id="prodowl-modal-tasklist" aria-hidden="true">' + 
                  '<div class="prodowl-modal__overlay" tabindex="-1" data-micromodal-close>' + 
                    '<div id="prodowl-tasks_rewards" class="prodowl-modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-editfulltask-title">' + 
                      '<div class="prodowl-modal__header">' + 
                        '<h2 class="prodowl-modal__title" id="modal-editfulltask-title">' + 
                          'Task List' + 
                        '</h2>' + 
                        '<button class="prodowl-modal__close" aria-label="Close modal" data-micromodal-close></button>' + 
                      '</div>' + 
                      '<hr><div class="prodowl-modal__content" id="modal-1-content">' + 
                            '<div class="addnewtask_container">' + 
                                '<div>' +
                                    '<textarea class="add_new_task_textarea" id="addtask_text" rows="2"></textarea>' +
                                '</div>' +
                                '<div>' +
                                    '<button class="add_new_task" id="add_new_task">Add New Task</button>' +
                                '</div>' +
                            '</div>' +                                    
                            '<div class="no_tasks_div" style="display:none;">' + 
                               "You don't have any tasks - please add one" + 
                            '</div>' +                   
                            '<ul id="tasklist" class="list-group"></ul>' +                       
                      '</div>' + 
                    '</div>' + 
                  '</div>' + 
                '</div>';
            $('body').append(modalHtml);
        }
        setTimeout(function(){
            console.log("loading modal");

            TASKS.IN_CONTENT_SCRIPT = true;
            //console.log("got respsonse");
            TASKS.Items.init();     
            TASKS.Items.render();            
            
            setTimeout(function(){
                
                MicroModal.show('prodowl-modal-tasklist');                 
            }, 100);
        }, 100);
        */
    });

}


function owlHandleCurrentUrl(visitedCount)
{
	/*******  TEST CURRENT URL **************/
	var operation = BlockLogic.checkForValidUrl(window.location.href);

	//Clear Page, this page has been blocked, Save for Later | Ask Owl to Allow
	if(operation == 0 && OWL.STATE != 0)  //Block
	{
        var image = chrome.extension.getURL('img/advice_owl_small.png');
		$('body').empty().css("background", "white").css("margin", "0");
		$('head').empty();  //some pages might load popups or something... who knows
        loadMustacheTemplate('templates/owl_block_page.html', 'body', {advice_owl_small : image, current_url: window.location.href}, afterBlockCallback);
        
        setInterval(function(){
            if($('#owl_container').length <= 0){
                console.log("no block owl?");
                $('body').empty().css("background", "white").css("margin", "0");
                $('head').empty();  //some pages might load popups or something... who knows
                loadMustacheTemplate('templates/owl_block_page.html', 'body', {advice_owl_small : image, current_url: window.location.href}, afterBlockCallback);                              
            }
        }, 100);

	}
	else if(operation == 2 && OWL.STATE != 2)  //Free Pass
	{
        //decided to remove allowed overlay
        //no point in having it
        /*
        var imageEmptyTree = chrome.extension.getURL('img/no_owl_in_tree_small.png');

        loadMustacheTemplate('templates/owl_allowed_overlay.html', 'body',
        {img_empty_tree : imageEmptyTree}, afterAllowedPageLoads
        );    
        */
		chrome.extension.sendRequest({method: "visitedAllowedPage", url: window.location.href},
		function(response)
		{
			//console.log("res: " + response);
		});

	}
	else if(operation == 1 && OWL.STATE != 1)
	{
		var countdownTime = BlockLogic.autocloseTime - (visitedCount * BlockLogic.reduceTimeIfVisited);
		OWL_COUNTER = countdownTime;

		//TODO: Desperation mode - Get referrer and see if site is in localstorage
		var imageTreeOwl = chrome.extension.getURL('img/owl_in_tree_small.png');
		var imageSaveIcon = chrome.extension.getURL('img/save_icon.gif');
        var imageVacationTime = chrome.extension.getURL('img/vacation_icon_small.png');
		//console.log("LOADING COUNTDOWN OVERLAY");

		//Calls afterCounterPageLoads
		loadMustacheTemplate('templates/owl_countdown_overlay.html', 'body',
		{starting_time : countdownTime, img_tree_owl : imageTreeOwl, img_save : imageSaveIcon, img_vacation: imageVacationTime},
		afterCounterPageLoads);
        OWL.switchSideHandler();
		OWL.CountdownPageHandlers();
		/*
		chrome.extension.sendRequest({method: "getLocalStorage", key: "daily_task"},
		function(response)
		{
			if(response.data)
			{
				$('body').append('<div id="daily_task_box">' + response.data + '<span id="daily_task_box_x">×</span></div>');
			}
		});
		*/

	}
    OWL.STATE = operation;
        
    chrome.runtime.sendMessage({method: "get_domain_current_time", domain: OWL.DOMAIN_URL},
        function(response)                                
        {	
            var domainTime = parseInt(response.data);
            //console.log("DOMAIN TIME OF " + OWL.DOMAIN_URL + " domainTime" + domainTime);
            
            var limitUp = BlockLogic.timeLimitUp(OWL.DOMAIN_URL, domainTime);
            if(limitUp){
                //alert("Time Limit Up");
                //just add to block array and redo owlHandleCurrentUrl???
                BlockLogic.websitesImmediateBlock.push(OWL.DOMAIN_URL);
                BlockLogic.timeLimitExceeded = true;
                if($('#owl_productivity_blockpage').length <= 0){
                    var image = chrome.extension.getURL('img/advice_owl_small.png');
                    $('body').empty().css("background", "white").css("margin", "0");
                    $('head').empty();  //some pages might load popups or something... who knows
                    loadMustacheTemplate('templates/owl_block_page.html', 'body', {advice_owl_small : image, current_url: window.location.href}, afterBlockCallback);
                }
            }
        }        
    );    
    


}




/********************************************************
-------------------------------------------------------------------------------
----------- BUTTON HANDLERS
-------------------------------------------------------------------------------
*********************************************************/
OWL.BlockPageHandlers = function()
{
    //console.log("Owl page block handlers");
	$('body').on('click', '#save_for_later', function()
	{
        //console.log("save for later");
		OWL.saveThisForLater();
	});

	$('body').on('click', '#make_an_exception', function()
	{
		var sayingText = "I don't make exceptions";

		if(OWL_EXCEPTION_BUT_COUNT < 4)
			sayingText = owlSayings["exception"][0];
		else if(OWL_EXCEPTION_BUT_COUNT < 10)
			sayingText = owlSayings["exception"][1];
		else if(OWL_EXCEPTION_BUT_COUNT < 40)
			sayingText = owlSayings["exception"][2];
		else
			sayingText = owlSayings["exception"][3];

		$('#owl_image').qtip('option', 'content.text', sayingText);
		$('#owl_image').qtip('show');

		OWL_EXCEPTION_BUT_COUNT++;
	});
    
    $('body').on('click', '#view_your_tasks', function(){
        chrome.runtime.sendMessage({method: "optionsLinkClick", "navlink" : "#tasks_rewards"}, 
        function(response) 
        {
            
        });        
    });

}

OWL.CountdownPageHandlers = function()
{
	$('body').on('click', '#owl_right_save_image', function()
	{
		saveThisForLater();
	});
    
    $('body').on('click', '#owl_right_vacation_time', function(){
        
    });
}

OWL.saveThisForLater = function()
{
	var theDate = BlockLogic.getCurrentDateText();

	chrome.extension.sendRequest({method: "saveForLater", the_url: window.location.href, the_time: theDate},
	function(response)
	{
		//console.log("res: " + response);
		//console.log("res data: " + response.data);

		if(response.data == "page_already_saved")
		{
			if ($('#owl_image').length != 0)
			{
				var theSaying = "Page already saved.  Now get back to work.";
				$('#owl_image').qtip('option', 'content.text', theSaying);
				$('#owl_image').qtip('show');
			}
			else
			{
				alert("Page Already Saved.  Moved to Front.");
			}
		}
		else if(response.data == "saved")
		{
			if ($('#owl_image').length != 0)
			{
				var theSaying = "This page has been saved for later.";
				$('#owl_image').qtip('option', 'content.text', theSaying);
				$('#owl_image').qtip('show');
			}
			else
			{
				alert("Page Saved");
			}
			//alert("Page Saved at: " + theDate);

		}
		//alert(BlockLogic.websitesImmediateBlock);
		//BlockLogic.websitesImmediateBlock = JSON.parse(response.data);
	});

}


/********************************************************
-------------------------------------------------------------------------------
----------- TEMPLATES
-------------------------------------------------------------------------------
*********************************************************/
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






/********************************************************
-------------------------------------------------------------------------------
----------- TIMERS
-------------------------------------------------------------------------------
*********************************************************/
function owlInactiveTick()
{
	clearTimeout(OWL.INACTIVE_TIMER);
	chrome.runtime.sendMessage({method: "isFreeTime", url:"none"},
	function(response)
	{	//console.log("res: " + response);
		//console.log("res data: " + response.data);
		if(response.data == 1)
		{
			//alert("IT IS FREE TIME NOW");
			/*annoying
			chrome.extension.sendRequest({method: "closeMyTab"},
			function(response)
			{
				//alert(BlockLogic.websitesImmediateBlock);
				//BlockLogic.websitesImmediateBlock = JSON.parse(response.data);
			});
			*/
		}
		else if(response.data == -1)
		{
			if(BlockLogic.doNotInactiveClose(window.location.href))
			{
				return;
			}
		}
		else
		{
			console.log("UNKNOWN IF FREETIME?");
		}
	});
}

function closeMyTab()
{
	chrome.runtime.sendMessage({method: "closeMyTab"},
	function(response)
	{
		//alert(BlockLogic.websitesImmediateBlock);
		//BlockLogic.websitesImmediateBlock = JSON.parse(response.data);
	});

}

function owlMakeMove()
{
	if(OWL.BEING_DRAGGED)
	{
		//console.log("being dragged");
		OWL.BREAK_FREE_TIME--;
		if(OWL.BREAK_FREE_TIME < 0)
		{
			//console.log("FIGHT BACK OWL!!!!");
			OWL.BREAK_FREE = true;
		}
	}
	else
	{
		if($('#moving_owl').length <= 0)
		{
			//console.log("No owl...?");
			return;
		}
        
        
		var currOffset = $('#moving_owl').offset();
		//console.log(currOffset);
        
        var oldLeft = OWL.MOVING_OWL.left;
        var oldTop = OWL.MOVING_OWL.top;
        
        var theLeft = $('#moving_owl').css('left');
        var theTop = $('#moving_owl').css('top');
        theLeft = parseInt(theLeft.replace('px', ''));
        theTop = parseInt(theTop.replace('px', ''));
        
        
        //console.log("theleft " + theLeft);
        //console.log("thetop " + theTop);
        theLeft = theLeft - 3;
        theTop = theTop - 3;
        $('#moving_owl').css('left', theLeft.toString() + "px");
        $('#moving_owl').css('top', theTop.toString() + "px");
        if((theLeft % 5) == 0){
            OWL.MOVING_OWL.position();            
        }
        //OWL.MOVING_OWL.left -= 3;
        //OWL.MOVING_OWL.top -= 3;


		//$('#owlproductivity_timer').html(currOffset.left + ", " + currOffset.top);

		//$('#owlproductivity_timer').html(currOffset.left + ", " + currOffset.top);

		if((OWL.MOVING_OWL.top + 70) < 0 || (OWL.MOVING_OWL.left + 56) < 0)
		{
            clearInterval(OWL_MOVE_TIMER);            
            INTV.Intervention.getInterventionToLoad(function(intType){
                if(OWL.INTERVENTION_DISABLED == 'no' && intType != 'none'){
                    //alert("loading intervention " + intType);
                    SHOULD_CLOSE_PAGE = false;
                    OWL.loadIntervention(intType);
                }else{
                    closeMyTab();
                    $('#owl_countdown_box').remove();                                        
                }
            });
		}
        /*
		else if(currOffset.top == $('#moving_owl').offset().top && currOffset.left == $('moving_owl').offset().left)
		{
			//OWL IS STUCK - PROBABLY BECAUSE NOT ACTIVE TAB
			OWL_STUCK_COUNTER++;
			if(OWL_STUCK_COUNTER > 500)
			{
				closeMyTab();
				window.clearInterval(OWL_MOVE_TIMER);
				$('#owl_countdown_box').remove();
			}
		}*/

	}
}

/***********************************
* Ticks every second on all non-FreePass pages.
* Sends message to close tab when time expires
**************************************/
function owlClockTick()
{

	if($('#owlproductivity_timer').length <= 0)
	{
		//timer gone

	}
	//var strSeconds = $('#owlproductivity_timer').text();
	//var theSeconds = parseInt(strSeconds);
	OWL_COUNTER--;
	//theSeconds--;

	//WE NEED THIS BECAUSE THIS INTERVAL TICKS WHILE TABS ARE INACTIVE...
	//SHORTER INTERVALS DONT TICK... THATS WHY THE ANIMATION STOPS...
	//WELL LETS COUNT 10 SECONDS AND IF NO ACTIONS HAPPEN AND OWL DOESNT MOVE OFF PAGE, THEN
	//ASSUME THAT THE PAGE IS INACTIVE AND CLOSE
    //EXCEPT IF INTERVENTION STATE
	if(SHOULD_CLOSE_PAGE && OWL.STATE != 2 && OWL.STATE != -2)
	{
		SHOULD_CLOSE_PAGE_COUNT--;
		if(SHOULD_CLOSE_PAGE_COUNT < 0)
		{
			//console.log("SHOULD CLOSE PAGE INACTIVE 10 sec");
			closeMyTab();
		}
	}
	if(OWL_COUNTER < 0 && !OWL.ANIMATING_OWL)
	{
		//console.log("STARTING OWL CLOSE ANIMATION");

		var imgFlying = chrome.extension.getURL('img/wingspan_small.png');
		$('body').append('<img title="I Am Closing This Page!" id="moving_owl" src="' + imgFlying + '" />');
        

		//SET UP CURSORS OVER MOVING OWL AND OWL PROXY
		//nevermind... do cursors later get this working
		var handCursor = chrome.extension.getURL('img/openhand.cur');
		var grabCursor = chrome.extension.getURL('img/closedhand.cur');

		//Do the OWL ANIMATION
		//OWL.MOVING_OWL = new YAHOO.util.DDProxy("moving_owl");
        OWL.MOVING_OWL = new PlainDraggable(document.getElementById('moving_owl'), {leftTop: true, containment : {left: -1000, top: -1000, width: 10000, height: 10000}});    
        


		var imgTreeEmpty = chrome.extension.getURL('img/no_owl_in_tree_small.png');
		$('#owl_countdown_box').css("background-image", "url('" + imgTreeEmpty + "')");

		var countDownOffset = $('#owl_countdown_box').offset();
        if($('#moving_owl').length > 0){
            $('#moving_owl').css("left", countDownOffset.left);
            $('#moving_owl').css("top", countDownOffset.top);
        }
        /*
		OWL.MOVING_OWL.subscribe("startDragEvent", function(e)
		{
			console.log("Start Drag");
			OWL.BEING_DRAGGED = true;

			var owlDragged = chrome.extension.getURL('img/owl_grabbed_small.png');
			//console.log("Drag Html" + $(this.getDragEl()).html());
			this.getDragEl().innerHTML = '<img id="owl_drag_proxy_img" src="' + owlDragged + '" />';

			//RESET THIS, BECAUSE NOT INACTIVE
			SHOULD_CLOSE_PAGE_COUNT = 10;
			//var grabCursor = chrome.extension.getURL('img/closedhand.cur');
			//$(this.getDragEl()).css("cursor","url(" + grabCursor + "), default !important;");
			//$('#moving_owl').hide();
			$('#moving_owl').css('opacity', 0.01);
			$('#owlproductivity_timer').html("AHHHHH");
		});

		OWL.MOVING_OWL.subscribe("dragEvent", function(e)
		{
			if(OWL.BREAK_FREE)
			{
				console.log("TRYING TO SCREECH");

				//Screech
				var owlScreech = chrome.extension.getURL('sound/owl_scream.mp3');
				var screechAudio = new Audio(owlScreech);
				screechAudio.play();

				//Break free from clutches of evil user
				YAHOO.util.DragDropMgr.stopDrag(e, false);
				OWL.BEING_DRAGGED = false;
				OWL.BREAK_FREE = false;
				OWL.BREAK_FREE_TIME = 200;
				$('#moving_owl').css("cursor","pointer");
			}
		});

		OWL.MOVING_OWL.subscribe("endDragEvent", function(e)
		{
			console.log("endDragEvent OCCURRED");
			OWL.BEING_DRAGGED = false;
			OWL.BREAK_FREE = false;
			OWL.BREAK_FREE_TIME = 200;

			//Hackity hack - drag proxy and drag object are both visible, hide drag object with opacity
			$('#moving_owl').css('opacity', 1.0);
			$('#moving_owl').css("cursor","pointer");

		});
        */
        OWL.MOVING_OWL.onDragStart = function(pos){
			//console.log("Start Drag");
			OWL.BEING_DRAGGED = true;

			var owlDragged = chrome.extension.getURL('img/owl_grabbed_small.png');
            $('#moving_owl').attr('src', owlDragged);
			//console.log("Drag Html" + $(this.getDragEl()).html());
			//this.getDragEl().innerHTML = '<img id="owl_drag_proxy_img" src="' + owlDragged + '" />';

			//RESET THIS, BECAUSE NOT INACTIVE
			SHOULD_CLOSE_PAGE_COUNT = 10;
			//var grabCursor = chrome.extension.getURL('img/closedhand.cur');
			//$(this.getDragEl()).css("cursor","url(" + grabCursor + "), default !important;");
			//$('#moving_owl').hide();
			//$('#moving_owl').css('opacity', 0.01);
			$('#owlproductivity_timer').html("AHHHHH");
        };   
        OWL.MOVING_OWL.onDrag = function(pos){
			if(OWL.BREAK_FREE)
			{
				//console.log("TRYING TO SCREECH");

				//Screech
				var owlScreech = chrome.extension.getURL('sound/owl_scream.mp3');
				var screechAudio = new Audio(owlScreech);
				screechAudio.play();

				//Break free from clutches of evil user
				//YAHOO.util.DragDropMgr.stopDrag(e, false);
                
				OWL.BEING_DRAGGED = false;
				OWL.BREAK_FREE = false;
				OWL.BREAK_FREE_TIME = 200;
				$('#moving_owl').css("cursor","pointer");
                //var elem = document.getElementById('moving_owl');
                //elem.onmouseup();
                OWL.MOVING_OWL.remove();
                
                return false;                
			}
        };        
        OWL.MOVING_OWL.onDragEnd = function(pos){
			//console.log("endDragEvent OCCURRED");
			OWL.BEING_DRAGGED = false;
			OWL.BREAK_FREE = false;
			OWL.BREAK_FREE_TIME = 200;

			//Hackity hack - drag proxy and drag object are both visible, hide drag object with opacity
			$('#moving_owl').css('opacity', 1.0);
			$('#moving_owl').css("cursor","pointer");
			var owlDragged = chrome.extension.getURL('img/wingspan_small.png');
            $('#moving_owl').attr('src', owlDragged);            
        };



     
       


		OWL_MOVE_TIMER = setInterval(function(){
            owlMakeMove();
        }, 10);  //.01 sec
        var element = document.getElementById('moving_owl');
        element.style.willChange = '';


		SHOULD_CLOSE_PAGE = true;
		OWL.ANIMATING_OWL = true;
		//used to remove interval OWL.BODY_TIMER, now keep it to count inactive tabs
		//window.clearInterval(OWL.NTERVAL_TIMER);
	}
	else
	{
		$('#owlproductivity_timer').text("" + OWL_COUNTER);
	}

}

