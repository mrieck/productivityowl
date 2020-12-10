var Template = {
    renderTemplate: function(selector, data, callback) {
        if (callback != null) 
		{
			var timeHtml = '' + 
			'<div id="' + data.name + '" class="ui-helper-reset ui-timepickr ui-widget" style="left: 0; display: none; ">' + 
					'<ol class="ui-timepickr-row ui-helper-clearfix hours" style="display: block; ">' + 
							'<li class="ui-timepickr-button"><span class="timeBox">1</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">2</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">3</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">4</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">5</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">6</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">7</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">8</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">9</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">10</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">11</span></li>' +
							'<li class="ui-timepickr-button"><span class="timeBox">12</span></li>' +
					'</ol>' + 
					'<ol class="ui-timepickr-row ui-helper-clearfix minutes" style="display: none; left: 226px; ">' + 
							'<li class="ui-timepickr-button"><span class="timeBox">00</span></li>' + 					
							'<li class="ui-timepickr-button"><span class="timeBox">15</span></li>' + 
							'<li class="ui-timepickr-button"><span class="timeBox">30</span></li>' + 
							'<li class="ui-timepickr-button"><span class="timeBox">45</span></li>' + 						
					'</ol>' + 
					'<ol class="ui-timepickr-row ui-helper-clearfix ampm" style="display: none; left: 310px; ">' + 
							'<li class="ui-timepickr-button"><span class="timeBox">am</span></li>' + 
							'<li class="ui-timepickr-button"><span class="timeBox">pm</span></li>' + 
					'</ol>' + 
			'</div>';
            callback(timeHtml);
        }
    }
};

function Timepicker(input) {
    this.input = input;
    this.hours = null;
    this.minute = null;
    this.amPm = null;
    this.timepickerSelector = null;
    this.init();
}

Timepicker.prototype.display = function() {
    if (this.hours != null && this.minutes != null && this.amPm != null) {
        this.input.val(this.hours + ':' + this.minutes + ' ' + this.amPm);
    }
};

Timepicker.prototype.hide = function() {
    if (this.hours != null && this.minutes != null && this.amPm != null) {
        $(this.timepickerSelector).hide();
    }
};

Timepicker.prototype.wireRowHover = function(selector, property, lowerRows) {
    var self = this;
    $(selector).hover(
        function () {
            //hover on
            $(selector).each(function(i, li) {
                $(li).find('span').removeClass('ui-state-hover');
            });
            var span = $(this).find('span');
            span.addClass("ui-state-hover");
            self[property] = span.text();
            self.display();
            for (var i = 0; i < lowerRows.length; i++) {
                var row = lowerRows[i];
                var left = $(this).position().left + $(this).parent().position().left;
                $(row).css('left', left + 'px');
                if (i == 0) {
                    $(row).show();
                }
            }
        },
        function () {
            //hover off, no op
        }
    );
};

Timepicker.prototype.setValue = function (selector, value) {
    if (value == '0') {
        value = '00';
    }
    $(selector).each(function(i, li) {
        var span = $(li).find('span');
        if (value == span.text()) {
            span.addClass('ui-state-hover');
            $(li).parent().show();
        }
    });
};

//reset to the value in the input
Timepicker.prototype.reset = function() {
    var self = this;
    var value = self.input.val();
    var tmp = value.split(' ');
    var hoursMinutes = tmp[0].split(':');
    this.hours = hoursMinutes[0];
    this.minutes = hoursMinutes[1];
    this.amPm = tmp[1];
    this.setValue(self.timepickerSelector + ' .hours li', this.hours);
    this.setValue(self.timepickerSelector + ' .minutes li', this.minutes);
    this.setValue(self.timepickerSelector + ' .ampm li', this.amPm);
};

Timepicker.prototype.init = function() {
    var self = this;
    var timepickerName = this.input.attr('name') + 'Timepicker';
    self.timepickerSelector = '#' + timepickerName;
    Template.renderTemplate('#timepicker_template', {name:timepickerName}, function(template) 
	{
        //add the timepicker div to the dom
        self.input.after(template);
		
		//self.input is a jquery object of the input

        //wire up the input click event
        self.input.on('click', function() 
		{
			//MJR
			var myOffset = $(this).offset();
			
			var absLeft = myOffset.left;
			var absTop = myOffset.top + 25;
			//alert("New Pos: " + absLeft + " , " + absTop);			
			
			$(self.timepickerSelector).css("left", absLeft);
			$(self.timepickerSelector).css("top", absTop);
			
            $(self.timepickerSelector).show();
        });

        $('body').click(function(e) {
            if (!($(e.target).hasClass('timepicker')) && !($(e.target).hasClass('timeBox'))) {
                $('.ui-timepickr').hide();
            }
        });

        //hover events for hours,minutes,ampm
        self.wireRowHover(self.timepickerSelector + ' .hours li', 'hours', [self.timepickerSelector + ' .minutes', self.timepickerSelector + ' .ampm']);
        self.wireRowHover(self.timepickerSelector + ' .minutes li', 'minutes', [self.timepickerSelector + ' .ampm']);
        self.wireRowHover(self.timepickerSelector + ' .ampm li', 'amPm', []);

        //click events for each hours,minutes,ampm
        var liClick = function (e) {
            self.hide();
        };
        $(self.timepickerSelector + ' .hours li').click(liClick);
        $(self.timepickerSelector + ' .minutes li').click(liClick);
        $(self.timepickerSelector + ' .ampm li').click(liClick);

        var value = self.input.val();
        if (value != null && value != '') {
            self.reset();
        }
    });
};
