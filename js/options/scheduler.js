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

var Scheduler =
{	
	validateMessage : "",  
	freetimeObjects : new Array(),
    worktimeObjects : new Array(),
	dayNames : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
	shortDayNames : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
	reallyShortDayNames : ["M", "Tu", "W", "Th", "F", "Sa", "Su"],
	EDIT_INDEX : -1,
	EDIT_ROW : -1,
    WORK_EDIT_INDEX: -1,
    EDIT_ROW: -1,
    CONFLICT_TYPE: "",
	NEEDS_SAVE : false,
	HANDLES_HOOKED : false,
	createUI : function()
	{			
		for(var d = 0; d < this.dayNames.length; d++)
		{
			var $TR = $('<tr>').append('<td>' + this.dayNames[d] + '</td>');
			
			for(var i = 0; i < 95; i++)
			{
				$TR.append('<td class="empty_schedule_cell"></td>');	
			}
			$('#timespan_tbody').append($TR);
			
			$("#timespan_tbody tr td:first-child").addClass("day_column");
			$("#timespan_table thead tr th:not(:first-child)").addClass("time_row");
		}
		
		//We call createUI multiple times for rebulding schedule...
		//so only need to hook up live handlers once
		if(!this.HANDLES_HOOKED)
		{
			this.setupHandlers();
		}
		
	},
	setupHandlers : function()  
	{
		var self = this;
		$('body').on('click', '#schedule_edit_delete', function()
		{
			//console.log("Deleting edit with: " + self.EDIT_INDEX + " --- row: " + self.EDIT_ROW);
			//alert("Clicked edit with: " + self.EDIT_INDEX + " --- row: " + self.EDIT_ROW);
			
			self.deleteSelectedFreetime(self.EDIT_INDEX, self.EDIT_ROW);	
			self.rebuildScheduler();
            //FREETIME_CHANGED = true;
            Scheduler.saveSchedule();
		});
		$('body').on('click', '#work_schedule_edit_delete', function()
		{
			//console.log("Deleting edit with: " + self.EDIT_INDEX + " --- row: " + self.EDIT_ROW);
			//alert("Clicked edit with: " + self.EDIT_INDEX + " --- row: " + self.EDIT_ROW);
			
			self.deleteSelectedWorktime(self.WORK_EDIT_INDEX, self.WORK_EDIT_ROW);	
			self.rebuildScheduler();
            //FREETIME_CHANGED = true;
            Scheduler.saveSchedule();
		});
        
        
        
		$('body').on('click', '#but_schedule_freetime', function()
		{
			//Close any existing alerts
			$(".alert").hide();
			var selectedArr = new Array();
			
			//USE THIS INSTEAD
			//var Dom = YAHOO.util.Dom;
			//Dom.something
			//Hack
			for(var x = 0; x < 7; x++)
			{
				var dayNum = x + 1;
				if($('#day_' + dayNum).hasClass('yui-checkbox-button-checked'))
				{
					selectedArr.push(x);
					// alert("Selected: " + dayArr[x]);
				}
			}			
			if(selectedArr.length <= 0)
			{
				scheduleDisplayAlert("alert-error", "Error", "You must select days to add.  If the day is highlighted blue it is selected");
				return;								
			}
			var startTime = Date.parse($('#start_time').val());
			var endTime = Date.parse($('#end_time').val());
			if(startTime == null || endTime == null)
			{
				scheduleDisplayAlert("alert-error", "Error", "Invalid Start or End Time.");
				return;				
			}
			//console.log("endtime hours min, " + endTime.getHours() + " , " + endTime.getMinutes());
			if(endTime.getHours() == 0 && endTime.getMinutes() == 0)
			{
				endTime.addDays(1);			
				endTime.addMinutes(-1);
				//console.log("endtime hours min, " + endTime.getHours() + " , " + endTime.getMinutes());			
			}
			
			
			if(!startTime.isBefore(endTime))
			{
				scheduleDisplayAlert("alert-error", "Error", "End time must be AFTER start time.");			
				return;
			}
			
			
			
			var conflictMessages = Scheduler.scheduleFreetime(selectedArr, startTime, endTime);			
			if(conflictMessages.length > 0)
			{	
				var allConflicts = ""; 
				var owlDisappointed = false;
				
				for(var i = 0; i < conflictMessages.length; i++)
				{
					if(allConflicts == "")
						allConflicts = conflictMessages[i] + "<br>";
					else 
						allConflicts += "<br>" + conflictMessages[i] + "<br>";		
					
					if(conflictMessages[i].indexOf("advance") >= 0)
					{
						owlDisappointed = true;
					}								
				}
				scheduleDisplayAlert("alert-error", "Error Adding to Schedule", allConflicts);					
				
				if(owlDisappointed)
				{
					owlMessage("", "scheduling_freetime_now");
				}
			}else{
                //FREETIME_CHANGED = true;
                Scheduler.saveSchedule();		
            }
			
		});
        
		$('body').on('click', '#but_schedule_worktime', function()
		{
			//Close any existing alerts
			$(".alert").hide();
			var selectedArr = new Array();
			
			//Hack
			for(var x = 0; x < 7; x++)
			{
				var dayNum = x + 1;
				if($('#day_' + dayNum).hasClass('yui-checkbox-button-checked'))
				{
					selectedArr.push(x);
					// alert("Selected: " + dayArr[x]);
				}
			}			
			if(selectedArr.length <= 0)
			{
				scheduleDisplayAlert("alert-error", "Error", "You must select days to add.  If the day is highlighted blue it is selected");
				return;								
			}
			var startTime = Date.parse($('#start_time').val());
			var endTime = Date.parse($('#end_time').val());
			if(startTime == null || endTime == null)
			{
				scheduleDisplayAlert("alert-error", "Error", "Invalid Start or End Time.");
				return;				
			}
			//console.log("endtime hours min, " + endTime.getHours() + " , " + endTime.getMinutes());
			if(endTime.getHours() == 0 && endTime.getMinutes() == 0)
			{
				endTime.addDays(1);			
				endTime.addMinutes(-1);
				//console.log("endtime hours min, " + endTime.getHours() + " , " + endTime.getMinutes());			
			}
			
			
			if(!startTime.isBefore(endTime))
			{
				scheduleDisplayAlert("alert-error", "Error", "End time must be AFTER start time.");			
				return;
			}
			
			
			
			var conflictMessages = Scheduler.scheduleWorktime(selectedArr, startTime, endTime);			
			if(conflictMessages.length > 0)
			{	
				var allConflicts = ""; 
				var owlDisappointed = false;
				
				for(var i = 0; i < conflictMessages.length; i++)
				{
					if(allConflicts == "")
						allConflicts = conflictMessages[i] + "<br>";
					else 
						allConflicts += "<br>" + conflictMessages[i] + "<br>";													
				}
				scheduleDisplayAlert("alert-error", "Error Adding to Schedule", allConflicts);					
			}else{
                //FREETIME_CHANGED = true;
                Scheduler.saveSchedule();		
            }
			
		});
        
        
        
        $('#scheduler_alert_container').on('click', 'a.close', function(){
            $(".alert").hide();
        });
        
        /*
		$('body').on('click', '#scheduler_save', function()
		{
			FREETIME_CHANGED = false;
			self.saveSchedule();		
		});
        */
		this.HANDLES_HOOKED = true;
	},
	validateFreetimeInput: function(allDaysArr, startTime, endTime)
	{
		//move from options.html 
	
	
	},
	scheduleFreetime: function(allDaysArr, startTime, endTime, skipCurrent)
	{
		var addedFreetime = false;
		var conflictMessages = new Array();
		var usedDays = new Array();
		
		for(var x = 0; x < allDaysArr.length; x++)
		{
			var rowIndex = allDaysArr[x];
			
			var startCell = 0;
			var endCell = 1;
			//alert("We have hours: " + startTime.getHours() + " minutes: " + startTime.getMinutes());
			startCell = (startTime.getHours() * 4) + Math.floor(startTime.getMinutes() / 15) + 1;			
			endCell = (endTime.getHours() * 4) + Math.floor(endTime.getMinutes() / 15);			
			
			//console.log("We have start cell: " + startCell + " endcell: " + endCell);
			//alert("We have start cell: " + startCell + " endCell: " + endCell);
			
			//Before adding we need to see if there are any conflicts
			var conflictExists = this.hasConflict(rowIndex, startTime, endTime);
			var currentConflict = this.hasCurrentDayConflict(rowIndex, startTime, endTime);

			if(conflictExists)
			{
				var conflictText = this.shortDayNames[rowIndex] + " " + startTime.toString("hh:mm t") + " - " + 
				endTime.toString("hh:mm t") + " could not be added because it overlaps existing work/freetime.";
				conflictMessages.push(conflictText);
				
				continue;
			}
			else if(currentConflict && !skipCurrent)
			{
				var conflictText = "Freetime must be scheduled in advance.  You tried to schedule freetime " + 
					"that would occur now, or in the next few hours.  You no longer can do that.";
				conflictMessages.push(conflictText);
				
				continue;				
			}
			else
			{
				usedDays.push(rowIndex);
				addedFreetime = true;				
			}			
            //console.log("adding start cell");
			
			var objIndex = this.freetimeObjects.length;
			//Attach Click Listeners
			//console.log("Select LIVECLICK LENGTH: " + $("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + (endCell + 1) + ")").filter(":gt(" + (startCell - 1) + ")").length);
			var self = this;
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + (endCell + 1) + ")").filter(":gt(" + (startCell - 1) + ")").on('click',
			function()
			{
				self.EDIT_INDEX = objIndex;
				self.EDIT_ROW = -1; //all rows
				self.setupEditBox(startCell, endCell);
			});
			
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + (endCell + 1) + ")").filter(":gt(" + (startCell - 1) + ")").on('dblclick',
			function()
			{
				//alert("Double Click");
				//console.log("DBL-CLK objIndex: " + objIndex + " - rowIndex: " + rowIndex);
				self.EDIT_INDEX = objIndex;
				self.EDIT_ROW = rowIndex; //single row
				self.setupEditBox(startCell, endCell);
				//to fix this try passing in current (objIndex, rowIndex) into setupEditBox
			});			
			
			//Highlight 
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + startCell + ")").addClass("start_schedule_cell");
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + endCell + ")").addClass("end_schedule_cell");
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + endCell + ")").filter(":gt(" + startCell + ")").addClass("middle_schedule_cell");
			
			//$("p:lt(5)").filter(":gt(3)")			
		}
		
		if(addedFreetime)
		{
			var freetimeObj = 
			{ 
				dayArr: usedDays, 
				sTime: startTime, 
				eTime: endTime
			};		
			this.NEEDS_SAVE = true;
		
		//bug only use used days not all days...
		//dsfsafdfsd
		//sdfasda
			this.freetimeObjects.push(freetimeObj);
		}
		
		return conflictMessages;
	},
	scheduleWorktime: function(allDaysArr, startTime, endTime)
	{
		var addedWorktime = false;
		var conflictMessages = new Array();
		var usedDays = new Array();
		
		for(var x = 0; x < allDaysArr.length; x++)
		{
			var rowIndex = allDaysArr[x];
			
			var startCell = 0;
			var endCell = 1;
			//alert("We have hours: " + startTime.getHours() + " minutes: " + startTime.getMinutes());
			startCell = (startTime.getHours() * 4) + Math.floor(startTime.getMinutes() / 15) + 1;			
			endCell = (endTime.getHours() * 4) + Math.floor(endTime.getMinutes() / 15);			
			
			//console.log("We have start cell: " + startCell + " endcell: " + endCell);
			//alert("We have start cell: " + startCell + " endCell: " + endCell);
			
			//Before adding we need to see if there are any conflicts
			var conflictExists = this.hasConflict(rowIndex, startTime, endTime);
			if(conflictExists)
			{
				var conflictText = this.shortDayNames[rowIndex] + " " + startTime.toString("hh:mm t") + " - " + 
				endTime.toString("hh:mm t") + " could not be added because it overlaps existing work/freetime.";
				conflictMessages.push(conflictText);
				
				continue;
			}
			else
			{
				usedDays.push(rowIndex);
				addedWorktime = true;				
			}			
			
			var objIndex = this.worktimeObjects.length;
			//Attach Click Listeners
			//console.log("Select LIVECLICK LENGTH: " + $("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + (endCell + 1) + ")").filter(":gt(" + (startCell - 1) + ")").length);
			var self = this;
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + (endCell + 1) + ")").filter(":gt(" + (startCell - 1) + ")").on('click',
			function()
			{
				self.WORK_EDIT_INDEX = objIndex;
				self.WORK_EDIT_ROW = -1; //all rows
				self.setupWorkEditBox(startCell, endCell);
			});
			
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + (endCell + 1) + ")").filter(":gt(" + (startCell - 1) + ")").on('dblclick',
			function()
			{
				//alert("Double Click");
				//console.log("DBL-CLK objIndex: " + objIndex + " - rowIndex: " + rowIndex);
				self.WORK_EDIT_INDEX = objIndex;
				self.WORK_EDIT_ROW = rowIndex; //single row
				self.setupWorkEditBox(startCell, endCell);
				//to fix this try passing in current (objIndex, rowIndex) into setupEditBox
			});			
			
			//Highlight 
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + startCell + ")").addClass("start_schedule_cell").addClass('work_schedule_cell');
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + endCell + ")").addClass("end_schedule_cell").addClass('work_schedule_cell');
			$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + endCell + ")").filter(":gt(" + startCell + ")").addClass("middle_schedule_cell").addClass('work_schedule_cell');
			
			//$("p:lt(5)").filter(":gt(3)")			
		}
		
		if(addedWorktime)
		{
			var freetimeObj = 
			{ 
				dayArr: usedDays, 
				sTime: startTime, 
				eTime: endTime
			};		
			this.NEEDS_SAVE = true;
		
		//bug only use used days not all days...
		//dsfsafdfsd
		//sdfasda
			this.worktimeObjects.push(freetimeObj);
		}
		
		return conflictMessages;
	},    
	hasConflict: function(dayIndex, startTime, endTime)
	{
		var startVal = startTime.getHours() + (startTime.getMinutes() * 0.01);
		var endVal = endTime.getHours() + (endTime.getMinutes() * 0.01);
		
		if(this.freetimeObjects.length <= 0 && this.worktimeObjects.length <= 0)
		{
			return false;
		}
		
		for(var y = 0; y < this.freetimeObjects.length; y++)
		{
			var anObj =this.freetimeObjects[y];
			var freeDayArr = anObj.dayArr;
			for(var z = 0; z < freeDayArr.length; z++)
			{
				var currDayIndex = freeDayArr[z];
				if(dayIndex == currDayIndex)
				{
					//console.log("DAY: " + dayIndex + " on same day as existing.");
					//On the same day in scheduler, check the times
					var currStart = anObj.sTime.getHours() + (anObj.sTime.getMinutes() * 0.01);
					var currEnd = anObj.eTime.getHours() + (anObj.eTime.getMinutes() * 0.01);

					//console.log("----Is " + startVal + " inbetween " + currStart + " and " + currEnd);	
					//console.log("----Is " + endVal + " inbetween " + currStart + " and " + currEnd);					
					//console.log("----Or do those two values encompass the existing: " + currStart + " and " + currEnd); 
					
					if(startVal > currStart && startVal < currEnd) //starttime inbetween
					{
						//console.log("STARTVAL INBETWEEN - CONFLICT");
                        this.CONFLICT_TYPE = "freetime";
						//inbetween
						return true;
					}
					else if(endVal > currStart && endVal < currEnd)  //
					{
						//console.log("ENDVAL INBETWEEN - CONFLICT");
                        this.CONFLICT_TYPE = "freetime";
                        
						return true;
					}
					else if(startVal <= currStart && endVal >= currEnd)
					{
						//console.log("STARTVAL AND ENDVAL ENCOMPASS FULL RANGE - CONFLICT");
                        this.CONFLICT_TYPE = "freetime";
                        
						return true;						
					}
					else
					{
						//console.log("No conflict");					
					}
				}
			}
		}
        
		for(var m = 0; m < this.worktimeObjects.length; m++)
		{
			var anObj =this.worktimeObjects[m];
			var freeDayArr = anObj.dayArr;
			for(var n = 0; n < freeDayArr.length; n++)
			{
				var currDayIndex = freeDayArr[m];
				if(dayIndex == currDayIndex)
				{
					//console.log("DAY: " + dayIndex + " on same day as existing.");
					//On the same day in scheduler, check the times
					var currStart = anObj.sTime.getHours() + (anObj.sTime.getMinutes() * 0.01);
					var currEnd = anObj.eTime.getHours() + (anObj.eTime.getMinutes() * 0.01);

					//console.log("----Is " + startVal + " inbetween " + currStart + " and " + currEnd);	
					//console.log("----Is " + endVal + " inbetween " + currStart + " and " + currEnd);					
					//console.log("----Or do those two values encompass the existing: " + currStart + " and " + currEnd); 
					
					if(startVal > currStart && startVal < currEnd) //starttime inbetween
					{
						//console.log("STARTVAL INBETWEEN - CONFLICT");
                        this.CONFLICT_TYPE = "worktime";                        
						//inbetween
						return true;
					}
					else if(endVal > currStart && endVal < currEnd)  //
					{
						//console.log("ENDVAL INBETWEEN - CONFLICT");
                        this.CONFLICT_TYPE = "worktime";                                                
						return true;
					}
					else if(startVal <= currStart && endVal >= currEnd)
					{
						//console.log("STARTVAL AND ENDVAL ENCOMPASS FULL RANGE - CONFLICT");
                        this.CONFLICT_TYPE = "worktime";                        
						return true;						
					}
					else
					{
						//console.log("No conflict");					
					}
				}
			}
		}        
        
		return false;
	},
	//passes in add schedule time
	//compares it with the current time plus 4 hours timespan
    //is only used for freetime... not worktime.  you can schedule worktime anytime you want
	hasCurrentDayConflict : function(dayIndex, startTime, endTime) 
	{
		var startVal = startTime.getHours() + (startTime.getMinutes() * 0.01);
		var endVal = endTime.getHours() + (endTime.getMinutes() * 0.01);	
	
		//get current day index 
		var currDate = Date.today().setTimeToNow();
		var endDate = currDate.clone();
		endDate.addHours(4);
		
		var nowDayIndex = -1;
		var dayName = currDate.toString("ddd");
		var futureDayName = endDate.toString("ddd");
		var secondTestNeeded = false;
		
		if(dayName !== futureDayName)
		{
			secondTestNeeded = true;
			endDate = Date.today().at("11:59pm");
		}
		
		
		var dayArr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
		for(var d = 0; d < dayArr.length; d++)
		{
			if(dayName == dayArr[d])
			{
				nowDayIndex = d;
			}
		}		
		if(nowDayIndex < 0)
		{
			alert("Error");
			return false;
		}
		
		
		//cant schedule freetime for next 4 hours
		
		//console.log("DAY CONFLICT TEST----------------------------");
		if(dayIndex == nowDayIndex)
		{
			//console.log("DAY CONFLICT TEST: " + dayIndex + " on same day as existing.");
			//On the same day in scheduler, check the times
			var currStart = currDate.getHours() + (currDate.getMinutes() * 0.01);
			var currEnd = endDate.getHours() + (endDate.getMinutes() * 0.01);

			//console.log("----Is " + startVal + " inbetween " + currStart + " and " + currEnd);	
			//console.log("----Is " + endVal + " inbetween " + currStart + " and " + currEnd);					
			//console.log("----Or do those two values encompass the existing: " + currStart + " and " + currEnd); 
			
			if(startVal > currStart && startVal < currEnd) //starttime inbetween
			{
				//console.log("STARTVAL INBETWEEN - CONFLICT");
				//inbetween
				return true;
			}
			else if(endVal > currStart && endVal < currEnd)  //
			{
				//console.log("ENDVAL INBETWEEN - CONFLICT");
				return true;
			}
			else if(startVal <= currStart && endVal >= currEnd)
			{
				//console.log("STARTVAL AND ENDVAL ENCOMPASS FULL RANGE - CONFLICT");
				return true;						
			}
			else
			{
				//console.log("No conflict");					
			}
		}	
		//console.log("-----------------------------------------------");
		
		if(secondTestNeeded)
		{
			currDate = Date.today().setTimeToNow();		
			endDate = currDate.clone();
			endDate.addHours(4);
			currDate = Date.parse('tomorrow').at("12:00am");
			var tomorrowDayIndex  = -1;
			for(var d = 0; d < dayArr.length; d++)
			{
				if(futureDayName == dayArr[d])
				{
					tomorrowDayIndex = d;
				}
			}	
			
			if(dayIndex == tomorrowDayIndex)
			{
				//console.log("TOMORROW CONFLICT TEST: " + dayIndex + " on same day as existing.");
				//On the same day in scheduler, check the times
				var currStart = currDate.getHours() + (currDate.getMinutes() * 0.01);
				var currEnd = endDate.getHours() + (endDate.getMinutes() * 0.01);

				//console.log("----Is " + startVal + " inbetween " + currStart + " and " + currEnd);	
				//console.log("----Is " + endVal + " inbetween " + currStart + " and " + currEnd);					
				//console.log("----Or do those two values encompass the existing: " + currStart + " and " + currEnd); 
				
				if(startVal > currStart && startVal < currEnd) //starttime inbetween
				{
					//console.log("STARTVAL INBETWEEN - CONFLICT");
					//inbetween
					return true;
				}
				else if(endVal > currStart && endVal < currEnd)  //
				{
					//console.log("ENDVAL INBETWEEN - CONFLICT");
					return true;
				}
				else if(startVal <= currStart && endVal >= currEnd)
				{
					//console.log("STARTVAL AND ENDVAL ENCOMPASS FULL RANGE - CONFLICT");
					return true;						
				}
				else
				{
					//console.log("No conflict");					
				}
			}					
			
			
			
		}
		
	
		return false;
	
				
	},	
	rebuildScheduler : function()
	{
        //written 10 years ago... not sure why making copies of arrays
		//console.log("-------------- REBUILDING SCHEDULER");
		$('#timespan_tbody').empty();
		this.createUI();
		
		if(this.freetimeObjects.length < 1 && this.worktimeObjects < 1)
		{
			return;
		}
		
		var copyArr = new Array();
		for(var m = 0; m < this.freetimeObjects.length; m++)
		{
			var anObj = this.freetimeObjects[m];
			var copyObj = 
			{
				dayArr : anObj.dayArr.slice(0),
				sTime : anObj.sTime.clone(),
				eTime : anObj.eTime.clone()
			}
			copyArr.push(copyObj);
		}
		this.freetimeObjects = new Array(); //empty array		
		//console.log("Now adding the times");
		for(var i = 0; i < copyArr.length; i++)
		{
			var anObj = copyArr[i];
			//var startTime = Date.parse(anObj.sTime);
			//var endTime = Date.parse(anObj.eTime);
			//console.log(this.printFreetimeObject(anObj));
			
			this.scheduleFreetime(anObj.dayArr, anObj.sTime, anObj.eTime, true);
		}
        
        
		var workCopyArr = new Array();
		for(var x = 0; x < this.worktimeObjects.length; x++)
		{
			var anObj = this.worktimeObjects[x];
			var copyObj = 
			{
				dayArr : anObj.dayArr.slice(0),
				sTime : anObj.sTime.clone(),
				eTime : anObj.eTime.clone()
			}
			workCopyArr.push(copyObj);
		}
		this.worktimeObjects = new Array(); //empty array		
		for(var y = 0; y < workCopyArr.length; y++)
		{
			var anObj = workCopyArr[y];
			//console.log(this.printFreetimeObject(anObj));
			
			this.scheduleWorktime(anObj.dayArr, anObj.sTime, anObj.eTime);
		}        
        
	
	},
	//Should always call rebuild right after delete...
	deleteSelectedFreetime : function(editIndex, editRow)
	{
		//console.log("---IN DELETE");
		if(editRow == -1)
		{
			//console.log("SPLICING");

			//Remove entire Object
			this.freetimeObjects.splice(editIndex, 1);
			
			//console.log("Freetime obj length: " + this.freetimeObjects.length);
		}
		else
		{
			//console.log("Removing row: " + editRow);

			//Skip the selected dayIndex in dayArr, and if dayArr becomes empty, delete the obj then
			var selObj = this.freetimeObjects[editIndex];
			var currDays = selObj.dayArr;
			
			var newDays = new Array();
			for(var i = 0; i < currDays.length; i++)
			{
				if(editRow == currDays[i])
				{
					//skip
				}
				else
				{
					newDays.push(currDays[i]);
				}
			}
			
			if(newDays.length <= 0)
			{
				this.deleteSelectedFreetime(editIndex, -1);
			}
			else
			{
				this.freetimeObjects[editIndex].dayArr = newDays;
			}
		}
	
	},
	deleteSelectedWorktime : function(editIndex, editRow)
	{
		//console.log("---IN DELETE");
		if(editRow == -1)
		{
			//console.log("SPLICING");

			//Remove entire Object
			this.worktimeObjects.splice(editIndex, 1);
			
			//console.log("Freetime obj length: " + this.freetimeObjects.length);
		}
		else
		{
			//console.log("Removing row: " + editRow);

			//Skip the selected dayIndex in dayArr, and if dayArr becomes empty, delete the obj then
			var selObj = this.worktimeObjects[editIndex];
			var currDays = selObj.dayArr;
			
			var newDays = new Array();
			for(var i = 0; i < currDays.length; i++)
			{
				if(editRow == currDays[i])
				{
					//skip
				}
				else
				{
					newDays.push(currDays[i]);
				}
			}
			
			if(newDays.length <= 0)
			{
				this.deleteSelectedFreetime(editIndex, -1);
			}
			else
			{
				this.worktimeObjects[editIndex].dayArr = newDays;
			}
		}
	
	},    
	saveSchedule : function()
	{		
		//written 10 years ago
        //not sure why do it like this
		var copyArr = new Array();
		for(var m = 0; m < this.freetimeObjects.length; m++)
		{
			var anObj = this.freetimeObjects[m];
			var copyObj = 
			{
				dayArr : anObj.dayArr.slice(0),
				sTime : anObj.sTime.toString("HH:mm"),
				eTime : anObj.eTime.toString("HH:mm")
			}
			copyArr.push(copyObj);
		}		
        
		var copyWorkArr = new Array();
		for(var n = 0; n < this.worktimeObjects.length; n++)
		{
			var anObj = this.worktimeObjects[n];
			var copyObj = 
			{
				dayArr : anObj.dayArr.slice(0),
				sTime : anObj.sTime.toString("HH:mm"),
				eTime : anObj.eTime.toString("HH:mm")
			}
			copyWorkArr.push(copyObj);
		}		
        
        
		//console.log("SAVING DATA: " + JSON.stringify(copyArr));
		localStorage['scheduler_data'] = JSON.stringify(copyArr);
        localStorage['scheduler_work_data'] = JSON.stringify(copyWorkArr);
		//scheduleDisplayAlert("alert-info", "Schedule Saved", "");		
		
		//Testing
		//console.log("TESTING PULLING DATA");		
		var dataArr = jQuery.makeArray(jQuery.parseJSON(localStorage['scheduler_data']));	
        var dataArr2 = jQuery.makeArray(jQuery.parseJSON(localStorage['scheduler_work_data']));	
		
		for(var i = 0; i < dataArr.length; i++)
		{
			var freetimeObj = dataArr[i];
			//Turn back into dates
			freetimeObj.sTime = Date.parse(freetimeObj.sTime);
			freetimeObj.eTime = Date.parse(freetimeObj.eTime);
						
			//console.log("RELOADED OBJ------- ");
			//console.log(this.printFreetimeObject(freetimeObj));
		}		
        
		for(var j = 0; j < dataArr2.length; j++)
		{
			var worktimeObj = dataArr2[i];
			//Turn back into dates
			worktimeObj.sTime = Date.parse(worktimeObj.sTime);
			worktimeObj.eTime = Date.parse(worktimeObj.eTime);
						
			//console.log("RELOADED WORK OBJ------- ");
			//console.log(this.printFreetimeObject(worktimeObj));
		}		
        
        
	},
    setupWorkEditBox : function(startCell, endCell){
		//FIRST UNHIGHLIGHT ALL CELLS
		$("#timespan_tbody td").removeClass("selected_cell");
	
		var myObj = this.worktimeObjects[this.WORK_EDIT_INDEX];		
		var scheduledDays = myObj.dayArr;
		var startTime = myObj.sTime;
		var endTime = myObj.eTime;
				
		var dayString = "";
		for(var i = 0; i < scheduledDays.length; i++)
		{
			var rowIndex = scheduledDays[i];		
			//console.log("Scheduled day: " + this.shortDayNames[rowIndex] + " with eRow: " + this.EDIT_ROW);
			
			if(this.WORK_EDIT_ROW == rowIndex || this.WORK_EDIT_ROW == -1)
			{
				if(dayString == "")
					dayString = this.reallyShortDayNames[rowIndex];
				else
					dayString += "," + this.reallyShortDayNames[rowIndex];
				
				//console.log("Highlighting: " + rowIndex + " startcell: " + startCell + " endCell: " + endCell);
				//ADD HIGHLIGHT TO SELECTED CELLS
				$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + startCell + ")").addClass("selected_cell");
				$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + endCell + ")").addClass("selected_cell");
				$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + endCell + ")").filter(":gt(" + startCell + ")").addClass("selected_cell");
			}
			else
			{
				//console.log("Day not selected: " + this.shortDayNames[rowIndex]);
			}
		}
		
		//Formatting times... meh
		var displayEndtime = endTime.toString("hh:mm tt");
		if(displayEndtime.substr(0, 1) == "0")
		{
			displayEndtime = displayEndtime.substring(1);
		}
		var displayStartTime = startTime.toString("hh:mm tt");
		if(displayStartTime.substr(0, 1) == "0")
		{
			displayStartTime = displayStartTime.substring(1);
		}
		
		
		//DISPLAY THE INFORMATION
		$('#schedule_edit_container').html("Selected: <span id='schedule_edit_display'>" + dayString + " " + displayStartTime + " - " + 
				displayEndtime + '</span> <button id="work_schedule_edit_delete">Delete</button>');        
    },
	setupEditBox : function(startCell, endCell)
	{
		//FIRST UNHIGHLIGHT ALL CELLS
		$("#timespan_tbody td").removeClass("selected_cell");
	
		var myObj = this.freetimeObjects[this.EDIT_INDEX];		
		var scheduledDays = myObj.dayArr;
		var startTime = myObj.sTime;
		var endTime = myObj.eTime;
				
		var dayString = "";
		for(var i = 0; i < scheduledDays.length; i++)
		{
			var rowIndex = scheduledDays[i];		
			//console.log("Scheduled day: " + this.shortDayNames[rowIndex] + " with eRow: " + this.EDIT_ROW);
			
			if(this.EDIT_ROW == rowIndex || this.EDIT_ROW == -1)
			{
				if(dayString == "")
					dayString = this.reallyShortDayNames[rowIndex];
				else
					dayString += "," + this.reallyShortDayNames[rowIndex];
				
				//console.log("Highlighting: " + rowIndex + " startcell: " + startCell + " endCell: " + endCell);
				//ADD HIGHLIGHT TO SELECTED CELLS
				$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + startCell + ")").addClass("selected_cell");
				$("#timespan_tbody tr:eq(" + rowIndex + ") td:eq(" + endCell + ")").addClass("selected_cell");
				$("#timespan_tbody tr:eq(" + rowIndex + ") td:lt(" + endCell + ")").filter(":gt(" + startCell + ")").addClass("selected_cell");
			}
			else
			{
				//console.log("Day not selected: " + this.shortDayNames[rowIndex]);
			}
		}
		
		//Formatting times... meh
		var displayEndtime = endTime.toString("hh:mm tt");
		if(displayEndtime.substr(0, 1) == "0")
		{
			displayEndtime = displayEndtime.substring(1);
		}
		var displayStartTime = startTime.toString("hh:mm tt");
		if(displayStartTime.substr(0, 1) == "0")
		{
			displayStartTime = displayStartTime.substring(1);
		}
		
		
		//DISPLAY THE INFORMATION
		$('#schedule_edit_container').html("Selected: <span id='schedule_edit_display'>" + dayString + " " + displayStartTime + " - " + 
				displayEndtime + '</span> <button id="schedule_edit_delete">Delete</button>');
	},
	printFreetimeObject : function(theObj)
	{
		var scheduledDays = theObj.dayArr;
		var startTime = theObj.sTime;
		var endTime = theObj.eTime;
		
		var dayString = "";
		for(var i = 0; i < scheduledDays.length; i++)
		{
			var rowIndex = scheduledDays[i];	
			if(dayString == "")
				dayString = this.reallyShortDayNames[rowIndex];
			else
				dayString += "," + this.reallyShortDayNames[rowIndex];
		}
		
		var displayEndtime = endTime.toString("hh:mm tt");
		if(displayEndtime.substr(0, 1) == "0")
		{
			displayEndtime = displayEndtime.substring(1);
		}
		var displayStartTime = startTime.toString("hh:mm tt");
		if(displayStartTime.substr(0, 1) == "0")
		{
			displayStartTime = displayStartTime.substring(1);
		}

		return dayString + " " + displayStartTime + " - " + displayEndtime;	
	}
}





		/*
		$('#timespan_tbody').append(
								<tr>
							<td>Monday</td>
							<td colspan="92">&nbsp;</td>
						</tr>
						<tr>
							<td>Tuesday</td>
							<td colspan="92">&nbsp;</td>
						</tr>
						<tr>
							<td>Wednesday</td>
							<td colspan="92">&nbsp;</td>
						</tr>
						<tr>
							<td>Thursday</td>
							<td colspan="92">&nbsp;</td>
						</tr>
						<tr>
							<td>Friday</td>
							<td colspan="92">&nbsp;</td>
						</tr>
						<tr>
							<td>Saturday</td>
							<td colspan="92">&nbsp;</td>
						</tr>
						<tr>
							<td>Sunday</td>
							<td colspan="92">&nbsp;</td>
						</tr>						
					</tbody>

		*/



