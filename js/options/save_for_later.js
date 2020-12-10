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

var SaveForLater = 
{
	//requires that you have a table with id: saved_table on page
	isFreeTime: false,
	init : function(iFreeTime)
	{
		SaveForLater.isFreeTime = iFreeTime;
		if(SaveForLater.isFreeTime)
		{
			$('#work_time_info').hide();		
		}
		else
		{
			$('#free_time_info').hide();		
		}
		
		$('body').on('click', ".savedelimg", function()
		{
			var theRow = this.id.substring(8);
			var websiteArr = jQuery.makeArray(jQuery.parseJSON(localStorage["saved_websites"]));
			
			//alert("Removing row: " + theRow + " and rebuilding");
			
			websiteArr.splice(theRow, 1);
			
			localStorage["saved_websites"] = JSON.stringify(websiteArr);
			SaveForLater.buildSavedWebsitesTable();			
		});
		
		$('body').on('mouseenter', '.savedelimg', function() 
		{
		  $(this).css("cursor","pointer");
		});
                
                $('body').on('mouseout', '.savedelimg', function() 
		{
		  $(this).css("cursor","auto");
		});		
		
		
		//ALLOWED WEBSITES
		var savedWebsites = localStorage["saved_websites"];
		var allHtml = "";
		if (!savedWebsites) 
		{
			allHtml = "There are no saved websites. ";
			$('#saved_list').html(allHtml);	
		}	
		else
		{
			SaveForLater.buildSavedWebsitesTable(SaveForLater.isFreeTime);
		}
	},
	buildSavedWebsitesTable : function()
	{
		$('#saved_table').empty();
		$('#saved_table').append('<tr><th> </th><th>URL</th><th>Date</th></tr>');		
	
		var deleteImg = chrome.extension.getURL('img/close_icon.png');			
		var savedWebsites = localStorage["saved_websites"];
		var saveArr = new Array();		
		saveArr = JSON.parse(savedWebsites);	
		//saveArr.reverse(); //messes up indices
		
		//go in reverse
		for(var i = (saveArr.length - 1); i >= 0; i--)
		{
			var saveObj = saveArr[i];
			$aTR = $('<tr id="srow' + i + '"></tr>');
			var currUrl = saveObj.saveUrl;	
			var currTime = saveObj.saveTime;
			if(saveObj.saveTime == undefined) //simple array
			{
				currUrl = saveObj;					
				currTime = "Old Date";
			}
			
			var shortUrl = currUrl;
			if(shortUrl.length > 70)
			{
				shortUrl = shortUrl.substring(0, 70) + "... ";
			}
			
			//alert("Appending: " + currUrl + " and " + currTime);
			
			if(SaveForLater.isFreeTime)
			{
				currUrl = '<a href="' + currUrl + '">' + shortUrl + '</a>';
			}
			else
			{
				currUrl = shortUrl;
			}
			
			$aTR.append('<td>' + '<img class="savedelimg" src="' + deleteImg + '" id="savedel-' + i + '" />');				
			$aTR.append('<td>' + currUrl + '</td>');
			$aTR.append('<td>' + currTime + '</td>');

			$('#saved_table').append($aTR);	
			
		}
		$("#saved_table tr:nth-child(odd)").addClass("odd-row");
		/* For cell text alignment */
		$("#saved_table td:first-child, .manage_table th:first-child").addClass("first");
		/* For removing the last border */
		$("#saved_table td:last-child, .manage_table th:last-child").addClass("last");			
	
	}
}