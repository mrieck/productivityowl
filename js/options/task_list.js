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
var TASKS = TASKS || {};

TASKS.CURRENT_TASKLIST = "DEFAULT";
TASKS.CURRENT_TASKLIST_PERMALINK = "default";
TASKS.DEFAULT_TASK_FREETIME = 5;
TASKS.MODAL_TASK_EDIT = -1;
TASKS.MODAL_OPEN_NAME = "";
TASKS.IN_CONTENT_SCRIPT = false;


TASKS.buttonHandlers = function(){
   $('#add_new_task').on('click', function(){
        var len = TASKS.Items.currentItems.length;
        var addtextText = $('#addtask_text').val();
        var allNewLines = addtextText.split(/\r\n|\r|\n/);
        //console.log("all new lines are ");
        //console.log(allNewLines);
        $('#addtask_text').val('');
        
        var completedSubtask = false;

        for(var x = 0; x < allNewLines.length; x++){
            var taskText = allNewLines[x];
            if(taskText.length <= 0){
                continue;
            }
            if(taskText.substring(0, 1) == '-'){
                continue;
            }
            len = TASKS.Items.currentItems.length;
            
            //console.log("Doing subtasks for " + x);
            var subTasks = new Array();
            if(allNewLines.length > (x + 1)){
                for(var y = x+1; y < allNewLines.length; y++){                    
                    var subtaskText = allNewLines[y];
                    //console.log("subtask text " + subtaskText);
                    if(subtaskText.substring(0, 1) != '-'){
                        continue;
                    }     
                    subtaskText = subtaskText.substring(1).trim();
                    var subItem = new TASKS.item().init(subtaskText, len, null);
                    subItem.parent_task = len;
                    subTasks.push(subItem);
                    if(!completedSubtask){
                        completedSubtask = true;
                        TASKS.completeTaskInterventions(subItem);
                    }
                }        
                
            }
            
            var anItem = new TASKS.item().init(taskText, len, subTasks);
            TASKS.Items.addNewItem(anItem, len);                     
        }
        
        //console.log("After adding all tasks ");
        //console.log(TASKS.Items.currentItems);
        TASKS.Items.saveTasks();
        
        /*
        console.log("initing with " + addtextText);
        var emptyItem = new TASKS.item().init(addtextText, len, new Array());
        //alert("len: " + emptyItem.answers.length);
        var subitems = new Array();
        TASKS.Items.addNewItem(emptyItem, len, subitems);         
        */
   });
   
   $('#tasklist_save').on('click', function(){
       //console.log("saving task list")
       var jsonEncoded = JSON.stringify(TASKS.Items.currentItems);
       //console.log(jsonEncoded);
       localStorage['tasks'] = jsonEncoded;       
   });
   
   $('#tasklist').on('click', '.freetimeslider_edit', function(e){
       e.preventDefault();
       //turn on editing
       var taskIndex = this.id.split('_')[1];
       //TASKS.Items.turnOnEditing(taskIndex);
       $('.task_freetime_description').css('display', 'block');
       $('.task_freetime_slider').css('display', 'none');
       $('#freetimeslidercontainer_' + taskIndex).css('display', 'block');
       $('#freetimedescription_' + taskIndex).css('display', 'none');
       
       var theItem = TASKS.Items.currentItems[taskIndex];
       $('#subslidercontainer_' + taskIndex).empty();
       var okButton = '<div class="edit_slider_button_container" id="editsliderokcontainer_' + taskIndex + '">' + 
             '<span class="yui-button yui-checkbox-button yui-button-checked yui-checkbox-button-checked yui-button-hover yui-checkbox-button-hover" id="ookkk">' + 
             '<span class="first-child"><button class="taskok" type="button" tabindex="0" id="taskok_' + taskIndex + '">OK</button>' + 
             '</span>' + 
             '</span>' +             
           '</div>';
        $('#subslidercontainer_' + taskIndex).append(okButton);         

       for(var x = 0; x < theItem.subtasks.length; x++){
           var newInput = '<div class="subsliderfloat" id="subsliderfloat_' + taskIndex + '_' + x + '"><input type="text" id="subslider_' + taskIndex + "_" + x + '" class="subtask_slider" name="subslider_' 
                   + taskIndex + '" value="' + theItem.subtasks[x].freetime_credits + '" /></div>';
           $('#subslidercontainer_' + taskIndex).append(newInput);  
           
           
           var startOffset = 10;
            (function(ttIndex, ssIndex){ //start wrapper code
                setTimeout(function(){
                    $("#subslider_" + ttIndex + "_" + ssIndex).ionRangeSlider({
                        keyboard: true,
                        grid: false,
                        hide_min_max: true,
                        min: 1,
                        max: 60,
                        step: 1,
                        skin: "flat",
                        hide_from_to: true,
                        onChange: function (data) {
                            var mytaskIndex = data.input[0].id.split("_")[1];
                            var mysubtaskIndex = data.input[0].id.split("_")[2];

                            var newCredits = parseInt(data.from);                        
                            //console.log("changing " + data.from + " for input " + data.input[0].id);  
                            //console.log(TASKS.Items.currentItems[mytaskIndex]);
                            TASKS.Items.currentItems[mytaskIndex].subtasks[mysubtaskIndex].freetime_credits = newCredits;
                            //TASKS.Items.saveTasks();                    
                        }
                    }); 
                    var prevItem = 0;
                    if(ssIndex > 0){
                        prevItem = ssIndex * 10;                        
                    }
                    var pixVal = startOffset + parseInt($('#subtasktextlabel_' + ttIndex + '_' + ssIndex).height()) * ssIndex + prevItem;
                    $('#subsliderfloat_' + ttIndex + "_" + ssIndex).css('top', pixVal + "px");
                    $('#subsliderfloat_' + ttIndex + "_" + ssIndex).css('left', "15%");                    
                }, ssIndex * 20);
            })(taskIndex, x);           
           
       }    
       
       
        setTimeout(function(){
            $("#freetimeslider_" + taskIndex).ionRangeSlider({
                keyboard: true,
                grid: false,
                hide_min_max: true,
                min: 1,
                max: 60,
                step: 1,
                skin: "flat",
                hide_from_to: false,
                onChange: function (data) {
                    var taskIndex = data.input[0].id.split("_")[1];
                    var newCredits = parseInt(data.from);
                    //console.log("changed to" + data.from + " for input " + data.input[0].id);  
                    //console.log("task editing");
                    //console.log(TASKS.Items.currentItems[taskIndex]);
                    TASKS.Items.currentItems[taskIndex].freetime_credits = newCredits;
                    //TASKS.Items.saveTasks();                    
                }
            });  
                    
        }, 100);           
   });
   
   $('#tasklist').on('click', '.task_subtaskadd', function(e){
       e.preventDefault();
       var taskIndex = this.id.split('_')[1];
       TASKS.MODAL_TASK_EDIT = parseInt(taskIndex);
       //console.log("ading subtasks " + TASKS.MODAL_TASK_EDIT);
       MicroModal.show('modal-1'); // [1]
       TASKS.MODAL_OPEN_NAME = "modal-1";
       return false;
   });
   
   $('#modal_edit_task').on('click', function(){
       
       //console.log("editing task");
       var taskEditText = $('#prodowl-modal-tasks').val();     
       if(taskEditText.length < 3){
           alert("Enter the task text");
           //MicroModal.close('modal-edit-fulltask');
           return;
       }
       var mainTaskText = "";
       var taskByLines = taskEditText.split(/\r\n|\r|\n/);
       var subLines = new Array();
       for(var q = 0;q < taskByLines.length; q++){
           var taskLine = taskByLines[q];
           if(taskLine.substring(0, 1) == '-'){           
               subLines.push(taskLine.substr(1));
           }else{
               mainTaskText += taskLine;
           }           
       }
       //console.log("main task text " + mainTaskText);
       //console.log("total subitems " + subLines.length);
       
       var editItem = TASKS.Items.currentItems[TASKS.MODAL_TASK_EDIT];
       TASKS.Items.currentItems[TASKS.MODAL_TASK_EDIT].task_text = mainTaskText;
       if(subLines.length <= 0){
           TASKS.Items.currentItems[TASKS.MODAL_TASK_EDIT].subtasks = new Array();
       }
       else if(subLines.length < editItem.subtasks.length){
           TASKS.Items.currentItems[TASKS.MODAL_TASK_EDIT].subtasks.slice(0, subLines.length);
       }
       var completedSubtask = false;
       for(var m = 0; m < subLines.length; m++){
           var sublineText = subLines[m];
           if(editItem.subtasks.length > m){
               editItem.subtasks[m].task_text = sublineText;
           }else{
                var subItem = new TASKS.item().init(sublineText, -1, null);
                subItem.parent_task = TASKS.MODAL_TASK_EDIT;
                subItem.index = m;
                TASKS.Items.currentItems[TASKS.MODAL_TASK_EDIT].subtasks.push(subItem);
                if(!completedSubtask){
                    completedSubtask = true;
                    TASKS.completeTaskInterventions(subItem);
                }
                
                
           }
       }
       TASKS.Items.saveTasks();       
       TASKS.Items.render();   
       MicroModal.close('modal-edit-fulltask');       
       
   });
   
   $('#modal_add_subtask').on('click', function(e){
       e.preventDefault();
       //console.log("modal add click");
       var subtaskAddText = $('#prodowl-modal-subtasks').val();
       var subtaskLines = subtaskAddText.split(/\r\n|\r|\n/);
       var completedSubtask = false;
       for(var y = 0; y < subtaskLines.length; y++){
           var subtaskText = subtaskLines[y].trim();
           if(subtaskText.length < 1){
               continue;
           }
           //console.log("subtask text " + subtaskText);
           var subItem = new TASKS.item().init(subtaskText, -1, null);
           subItem.parent_task = TASKS.MODAL_TASK_EDIT;
            if(!completedSubtask){
                completedSubtask = true;
                TASKS.completeTaskInterventions(subItem);
            }
           
           
           for(var x = 0; x < TASKS.Items.currentItems.length; x++){
               var currItem = TASKS.Items.currentItems[x];
               //console.log("curritem index " + currItem.index + " vs " + TASKS.MODAL_TASK_EDIT);
               if(currItem.index == TASKS.MODAL_TASK_EDIT){
                   var subtaskIndex = TASKS.Items.currentItems[x].subtasks.length;
                   subItem.index = subtaskIndex;
                   var sIndex = TASKS.Items.currentItems[x].subtasks.length;
                   TASKS.Items.currentItems[x].subtasks.push(subItem);
                   var tIndex = currItem.index;
                   loadMustacheTemplateAppend('templates/options_subtask.html', '#subtasks_' + tIndex, 
                    {parent_index: tIndex, subtask_index : sIndex, task_editable_text: subtaskText, task_noneditable_text: subtaskText, 
                        task_freetime_credits: TASKS.DEFAULT_TASK_FREETIME},        
                    function(){

                    });                   
               }
           }
           TASKS.Items.saveTasks();           
       }          
       MicroModal.close('modal-1');
       $('#prodowl-modal-subtasks').val('');
       return false;
   });
   
   $('#tasklist').on('click', '.taskok', function(e){
       e.preventDefault();
       
       var taskIndex = this.id.split('_')[1];
       //console.log("taskindex");
       //console.log(taskIndex);
       $('.task_freetime_description').css('display', 'block');
       $('.task_freetime_slider').css('display', 'none');       
       $('#freetimedescription_' + taskIndex).css('display', 'block');
       var freetimeCredits = TASKS.Items.currentItems[taskIndex].freetime_credits;
       var singleCredits = freetimeCredits;
       var theItem = TASKS.Items.currentItems[taskIndex];
       if(theItem.subtasks.length > 0){
           for(var s = 0; s < theItem.subtasks.length; s++){
               freetimeCredits += theItem.subtasks[s].freetime_credits;
           }
       }
       
       
       $('#freetimedescription_' + taskIndex + " .task_freetime_text").html("Reward: " + freetimeCredits);
       

       $('#subslidercontainer_' + taskIndex).empty();    
       $('#taskslidercontainer_' + taskIndex).html('<input type="text" id="freetimeslider_' + 
               taskIndex + '" class="freetime_slider" name="freetime_slider" value="' + singleCredits + '" /> ');
       $('#freetimeslidercontainer_' + taskIndex).css('display', 'none');
       TASKS.Items.saveTasks();  
       //TASKS.Items.currentItems[taskIndex].task_text = inputVal;
       
       //$('#tasktextlabel_' + taskIndex).text(inputVal);       
       //$('#edittaskinputcontainer_' + taskIndex).hide();   
       return false;
   });
   $('#tasklist').on('mouseenter','.taskcomplete-checkbox-wrap', function (event) {
        $(".taskcomplete-checkbox-wrap").removeClass("prodowl-hovering");
        $(this).addClass("prodowl-hovering");       
   }).on('mouseleave','.taskcomplete-checkbox-wrap',  function(){
        $(this).removeClass("prodowl-hovering");       
   });
   $('#tasklist').on('mouseenter','.subtask-checkbox-wrap', function (event) {
        $(".subtask-checkbox-wrap").removeClass("prodowl-hovering");
        $(this).addClass("prodowl-hovering");       
   }).on('mouseleave','.subtask-checkbox-wrap',  function(){
        $(this).removeClass("prodowl-hovering");       
   });   
   
   $('#tasklist').on('click', '.taskcomplete-checkbox-wrap', function(){
      //alert("complete the task");
        var taskIndex = this.id.split('_')[1];
        var taskObject = TASKS.Items.currentItems[taskIndex];
        var theMin = parseInt(taskObject['freetime_credits']);
        var taskText = taskObject['task_text'];
        if(taskObject.subtasks.length > 0){
            if(taskObject.subtasks.length > 0){
                for(var s = 0; s < taskObject.subtasks.length; s++){
                    theMin += taskObject.subtasks[s].freetime_credits;
                }
            }            
        }        
        var timeCreated = taskObject['time_created'];
        var timeCreatedSec = timeCreated / 1000;
        var nowSec = (new Date().getTime()) / 1000;
        var diffSec = nowSec - timeCreatedSec;
        
        //console.log("adding min to vacation time (total min) " + theMin);
        
        var testGibberish = gibberish.detect(taskText);
        console.log("gibberish score");
        console.log(testGibberish);
        
        if(diffSec > 180 && testGibberish < 67){
            chrome.runtime.sendMessage({method: "addVacationTime", time: theMin, task_text: taskText, subtask: 'no', subtask_count: taskObject.subtasks.length},
            function(response)
            {
                //console.log("response task addVacationTime: ");
                //console.log(response);
                CURRENT_VACATION_TIME = response['data'];
                $('#vacationtime_knob').val(CURRENT_VACATION_TIME);
            });      
        }else{
            owlInterception("I've decided to NOT reward you break time for this task.  Work harder to earn my respect.");
        }
        //alert("removing and re-rendering");
        TASKS.Items.currentItems.splice(taskIndex, 1);
        $('#taskitem_' + taskIndex).fadeOut("slow", function() 
        {
            $(this).remove(); 
            TASKS.Items.render();
        });
        TASKS.Items.saveTasks();  
   });
   
   $('#tasklist').on('click', '.tasktask_edit', function(e){
       e.preventDefault();
       var taskIndex = parseInt(this.id.split('_')[1]);
       TASKS.MODAL_TASK_EDIT = taskIndex;
       
       var theItem = TASKS.Items.currentItems[taskIndex];
       var allText = theItem.task_text;
       
       for(var x = 0; x < theItem.subtasks.length; x++){
           var moreText = theItem.subtasks[x]['task_text'];
           allText += "\r\n" + "-" + moreText;
       }
       $('#prodowl-modal-tasks').val(allText);
       MicroModal.show('modal-edit-fulltask'); // [
       TASKS.MODAL_OPEN_NAME = "modal-edit-fulltask";
       return false;
   });
   
   $('#tasklist').on('click', '.delete_task', function(e){
        e.preventDefault();
        var taskIndex = parseInt(this.id.split('_')[1]);
        var theItem = TASKS.Items.currentItems[taskIndex];
        var question = "Are you sure you want to delete this task?";
        if(theItem.subtasks.length > 0){
            question = "Are you sure you want to delete this task and subtasks?";
        }
        var resp = confirm(question);
        if(resp)
        {
            TASKS.Items.currentItems.splice(taskIndex, 1);
            $('#taskitem_' + taskIndex).remove();
            TASKS.Items.saveTasks();
            TASKS.Items.render();            
        }	     
        return false;
   });
   
   $('#tasklist').on('click', '.subtask-checkbox-wrap', function(){
      //alert("complete the task");
        var taskIndex = this.id.split('_')[1];
        var subtaskIndex = this.id.split('_')[2];
        //console.log("task index " + taskIndex);
        //console.log("subtaskssss index " + taskIndex);
        var taskObject = TASKS.Items.currentItems[taskIndex];
        //console.log(taskObject);
        var subtaskObject = taskObject.subtasks[subtaskIndex];
        //console.log(subtaskObject);        
        var theMin = parseInt(subtaskObject['freetime_credits']);
        var taskText = subtaskObject['task_text'];
        
        //console.log("adding min to vacation time " + theMin);
        
        var timeCreated = subtaskObject['time_created'];
        var timeCreatedSec = timeCreated / 1000;
        var nowSec = (new Date().getTime()) / 1000;
        var diffSec = nowSec - timeCreatedSec;    
                
        var testGibberish = gibberish.detect(taskText);
        console.log("gibberish score");
        console.log(testGibberish);        
      
        if(diffSec > 180 && testGibberish < 50){
            chrome.runtime.sendMessage({method: "addVacationTime", time: theMin, task_text: taskText, subtask: 'yes'},
            function(response)
            {
                //console.log("After addVacationTime: ");
                //console.log(response);
                CURRENT_VACATION_TIME = response['data'];
                $('#vacationtime_knob').val(CURRENT_VACATION_TIME);
            });      
        }else{
            owlInterception("I've decided to NOT reward you break time for this task.  Work harder to earn my respect.");
        }
        //alert("removing and re-rendering");
        TASKS.Items.currentItems[taskIndex].subtasks.splice(subtaskIndex, 1);
        $('#subtaskitem_' + taskIndex + "_" + subtaskIndex).fadeOut("slow", function() 
        {
            $(this).remove();
            TASKS.Items.render();
        });
        TASKS.Items.saveTasks();  
   });   
   
   $('body').on('mousedown', '.prodowl-modal__overlay', function(e){
        var $target = $(e.target);
        if($target.hasClass('prodowl-modal__close')){
            MicroModal.close(TASKS.MODAL_OPEN_NAME);
        }
        if($target.parents('.prodowl-modal__container').length > 0 || $target.hasClass('prodowl-modal__container')){
                    
        }else{
            //close
            MicroModal.close(TASKS.MODAL_OPEN_NAME);            
        }       
   });
   
   $('body').on('keyup', '#freetime_earned_default', function(e){
       var newVal = $(this).val();
       newVal = newVal.replace(/[^0-9]/g, '');
       if(newVal.length < 1){
           return;
       }
       newVal = parseInt(newVal);
       if(newVal <= 0){
           newVal = 1;
       }
       else if(newVal > 60){
           newVal = 60;
       }
       $(this).val(newVal);
       localStorage['default_breaktime_earned'] = newVal;
       TASKS.DEFAULT_TASK_FREETIME = newVal;
   });
   
      
    
};


TASKS.Items = {
    currentItems : null,        
    init : function(){ 
        this.currentItems = new Array();
        TASKS.buttonHandlers();    
        var defaultBreaktime = localStorage['default_breaktime_earned'];
        if(defaultBreaktime){
           defaultBreaktime = parseInt(defaultBreaktime);
           if(defaultBreaktime > 0 && defaultBreaktime <= 60){
               TASKS.DEFAULT_TASK_FREETIME = defaultBreaktime;
               $('#freetime_earned_default').val(TASKS.DEFAULT_TASK_FREETIME);
           }
        }
    },
    saveTasks : function(){
       //var jsonEncoded = JSON.stringify(TASKS.Items.currentItems);
       //console.log(jsonEncoded);
           //localStorage['tasks'] = jsonEncoded;        
       var params = {method: "save_tasks", tasks: TASKS.Items.currentItems};       
       chrome.runtime.sendMessage(params, function(response){              
           //console.log("saved tasks");
           //var jsonEncoded = JSON.stringify(TASKS.Items.currentItems);
           //console.log(jsonEncoded);
           //localStorage['tasks'] = jsonEncoded;        
       });
    },
    addNewItem : function(item, tIndex){
        var me = this;
        this.currentItems.push(item);

        loadMustacheTemplateAppend('templates/options_task.html', '#tasklist', 
            {task_index : tIndex, task_editable_text: item.task_text, task_noneditable_text: item.task_text, 
                task_freetime_credits: TASKS.DEFAULT_TASK_FREETIME}, 
        function(){
            setTimeout(function(){
                
                for(var x = 0; x < item.subtasks.length; x++){
                    //console.log("a subtask");
                    //console.log(item.subtasks[x]);
                    var subtaskText = item.subtasks[x].task_text;
                    //console.log("subtask text " + subtaskText)
                    
                    loadMustacheTemplateAppend('templates/options_subtask.html', '#subtasks_' + tIndex, 
                    {parent_index: tIndex, subtask_index : x, task_editable_text: subtaskText, task_noneditable_text: subtaskText, 
                        task_freetime_credits: TASKS.DEFAULT_TASK_FREETIME},        
                    function(){
                        
                    });
                }

            }, 50);
        });   
        $('#tasklist').css('display', 'block');
        $('#no_tasks_div').css('display', 'none');
    },    
    render : function(){
        var me = this;
        $('#tasklist').css('min-height', $('#tasklist').height() + "px");
        $('#tasklist').empty();
        var params = {method: "get_tasks"};
        chrome.runtime.sendMessage(params, function(response){                            
            //var savedTasks = localStorage['tasks'];
            var savedTasks = response['data'];            
            var hideList = true;
            //console.log("savedTasks");
            //console.log(savedTasks);
            if(savedTasks)
            {
                var existingTasks = JSON.parse(savedTasks); //$.makeArray($.parseJSON(savedTasks));
                //console.log("what");
                //console.log(existingTasks);
                if(existingTasks.length > 0){
                    hideList = false;
                }
                for(var x = 0; x < existingTasks.length; x++){
                    var tIndex = x;
                    existingTasks[x].index = x;
                    var item = existingTasks[x];
                    var taskText = existingTasks[x]['task_text'];
                    var taskFreetime = existingTasks[x]['freetime_credits'];
                    var myFreetime = taskFreetime;
                    var totalFreetime = taskFreetime;
                    for(var m = 0; m < item.subtasks.length; m++){
                        totalFreetime += item.subtasks[m].freetime_credits;
                    }
                    //alert("task tetx" + taskText);
                    //create closure
                    (function(myTask, theIndex, tFreetime, mFreetime){ //start wrapper code
                        loadMustacheTemplateAppend('templates/options_task.html', '#tasklist', 
                            {task_index : x, task_editable_text: "", task_noneditable_text: taskText, 
                                task_allfreetime: tFreetime, task_freetime_credits: mFreetime, hide_label: false, hide_textinput: true}, 
                            function(){                       
                                for(var y = 0; y < myTask.subtasks.length; y++){
                                    //console.log("a subtask");
                                    //console.log(myTask.subtasks[y]);
                                    var subtaskText = myTask.subtasks[y].task_text;
                                    myTask.subtasks[y].parent_task = theIndex;
                                    myTask.subtasks[y].index = y;
                                    //console.log("subtask text " + subtaskText)

                                    loadMustacheTemplateAppend('templates/options_subtask.html', '#subtasks_' + theIndex, 
                                    {parent_index: theIndex, subtask_index : y, task_editable_text: subtaskText, task_noneditable_text: subtaskText, 
                                        task_freetime_credits: TASKS.DEFAULT_TASK_FREETIME},        
                                    function(){

                                    });
                                }

                            });                                        
                    })(item, tIndex, totalFreetime, myFreetime);
                }
                me.currentItems = existingTasks;
                setTimeout(function(){
                    //console.log("turn off editing here");
                    //console.log("length of curritems " + me.currentItems.length);
                    //me.turnOffEditing();
                    $('#tasklist').css('min-height', '');
                }, 500);



            }	    
            //console.log("is hiding or not");
            if(hideList){
                //console.log("hide");                
                $('#tasklist').css('display', 'none');                
                $('#no_tasks_div').css('display', 'block');            
            }else{
                //console.log("nohide");                                
                $('#tasklist').css('display', 'block');
                $('#no_tasks_div').css('display', 'none');            
            }

            var el = document.getElementById('tasklist');
            var sortable = Sortable.create(el, {
                 handle: ".task_drag_container", 
                   onEnd: function (evt) {                       
                        //var itemEl = evt.item; // dragged HTMLElement
                        var oldIndex = evt.oldIndex;
                        var newIndex = evt.newIndex;
                        //console.log("old index");
                        //console.log(oldIndex);
                        //console.log("new index");
                        //console.log(newIndex);
                        //console.log("before");
                        //console.log(me.currentItems);
                        me.currentItems.splice(newIndex, 0, me.currentItems.splice(oldIndex, 1)[0]);
                        //console.log("after");
                        //console.log(me.currentItems);
                        TASKS.Items.saveTasks();       
                        TASKS.Items.render();                           
                   },
            });        
             
       });
         
        
        /*
        var anOutcome = {
            id : outcome.id, 
            title: outcome.title,
            index: x
        };
        */
    }
};

TASKS.item = function(){
    return this;
};

TASKS.item.prototype = {
    task_text : "",        
    index : 0,
    layout: 1,
    parent_task : -1,
    time_created: "",
    freetime_credits : "",
    subtasks: new Array(),
    init : function(text, theIndex, subTasks, freetimeCredits, timeCreated){
        this.task_text = text;
        this.index = theIndex;
        this.subtasks = subTasks;
        if(!freetimeCredits){
            this.freetime_credits = TASKS.DEFAULT_TASK_FREETIME;
        }else{
            this.freetime_credits = freetimeCredits;            
        }
        //time created because you cant check off task within 3 min of creating 
        if(!timeCreated){
            this.time_created = new Date().getTime();
        }else{
            this.time_created = timeCreated;
        }
        return this;
    }
};



TASKS.completeTaskInterventions = function(subtaskData){        
    //console.log("possible task intervention?");
    
    //if there is a current intervention of subtasks type, then we can mark it as complete
    chrome.runtime.sendMessage({method: "get_current_intervention"},
    function(response)
    {
        if(response.data == 1){
            var iType = response['intervention_type'];
            var iStart = response['intervention_start'];
            var iSec = response['intervention_sec'];
            //console.log("maybe " + iType);                       
            if(iType == 'subtasks'){
                //console.log("yes");                            
                //data doesnt really matter on subtask intervention, but it's an array of items entered on others
                //so put in an array 
                var myArray = new Array();
                myArray.push(subtaskData);
                chrome.runtime.sendMessage({method: "complete_intervention", intervention_data: myArray},
                function(response)
                {
                    console.log("got response from completed intervention");
                    console.log(response);
                });                
            }            
        }
    }); 
};
