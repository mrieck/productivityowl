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
var INTV = INTV || {};
INTV.INTERVENTION_COMPLETE = false;
INTV.INTERVENTION_INTERVAL = null;
INTV.INTERVENTION_EXPIRED = false;


INTV.CURRENT_TASKLIST = "DEFAULT";
INTV.buttonHandlers = function(){
    $('body').on('click', '#intervention_table_addrow', function(){
        console.log("adding row");
        var tableId = 'intervention_' + INTV.Intervention.type + '_table';
        
        if(INTV.Intervention.type == 'costbenefit'){
            cols = 3;
        }
        
        var cols = 2;
        if(cols == 2){
            $('#' + tableId + " tbody").append('<tr><td>click to edit</td><td>click to edit</td></tr>');            
        }else if(cols == 3){
            $('#' + tableId + " tbody").append('<tr><td></td><td></td><td></td></tr>');                        
        }
        $('#' + tableId + " tbody").find('td').unbind('click');
        //shitty widget
        $('#intervention_' + INTV.Intervention.type + '_table').editableTableWidget();
    });
    
    $('body').on('click', '#intervention_table_submit', function(){
        var tableId = 'intervention_' + INTV.Intervention.type + '_table';
        var interventionRows = new Array();
        $('#' + tableId + " tbody tr").each(function(i, item){
            var entry = new Array();
            console.log("item");
            console.log(item);
            $(this).children().each(function(x, cell){
                entry.push($(this).text());
            });
            interventionRows.push(entry);
        });
        
        console.log("rows to submit");
        console.log(interventionRows);
        chrome.runtime.sendMessage({method: "complete_intervention", intervention_data: interventionRows},
        function(response)
        {
            
        });         
        
    });
};

INTV.Intervention = {
    currentItems : null,        
    type: 'none',
    //available interventions: subtasks,costbenefit,feelings,intention
    init : function(){         
        this.currentItems = new Array();
        INTV.buttonHandlers();
        //console.log("making " + '#intervention_' + this.type + '_table' + " editable");
        $('#intervention_' + this.type + '_table').editableTableWidget();
        
    },
    getInterventionToLoad : function(callback){
        //most of the time this will return none
        var me = this;
        chrome.runtime.sendMessage({method: "get_current_intervention"},
        function(response)
        {
            if(response.data == 1){
                console.log("already has intervention");
                callback('none');
            }else{
                var lastIntervention = parseInt(response.intervention_last);
                var skipTest = false;
                if(!lastIntervention){
                    skipTest = true;
                }
                //console.log("last intervention " + lastIntervention);
                var currTime = new Date().getTime();
                var extraMin = 1000*60*5;  //5 min
                extraMin = 0;
                currTime = parseInt(currTime);
                //console.log("currtime " + currTime);
                //console.log("lastinte " + lastIntervention);
                if(skipTest || currTime > (lastIntervention + extraMin)){
                    var iNum = Math.random() * 400;
                    if(iNum < 40){
                        me.type = 'subtasks';
                    }
                    else if(iNum >= 40 && iNum < 65){
                        me.type = 'feelings';
                    }
                    else if(iNum >= 65 && iNum < 80){
                        me.type = 'costbenefit';
                    }else if(iNum >= 80 && iNum <= 100){
                        me.type = 'intention';
                    }else{
                        me.type = 'none';
                    }         
                    callback(me.type);
                    return;  
                }
                
                callback('none');
            }
        });                 
    },
};
    