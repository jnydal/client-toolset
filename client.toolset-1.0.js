/**
 * Class for handling dialogs.
 *
 * Requires jQuery fancybox plugin.
 * Requires TextProvider.
 *
 * Licenced under MIT, GPL2
 * 
 * 2011 Jørund Nydal
 */
var DialogHandler = new function DialogHandler() {
	
	function fixHeight() {
		var contentHeight = $("#errorDialog").height();
		$("#fancybox-content").css("height", contentHeight);
		$("#fancybox-content > div").css("height", contentHeight);
	};
	
	function setCloseButtonFocus() {
		$("#closeButton").focus();
	};
	
	this.closeDialog = function() {
		$.fancybox.close();
	};

	this.showErrorDialog = function(content) {
		var headerText = TextProvider.getText("server_error");
		var closeButtonText = TextProvider.getText("close");
		var dialog = "<div id='errorDialog' class='dialog'>";
		dialog    += "<div class='dialogHeader clearfix'>" + headerText + "</div>";
		dialog    += "<div class='dialogBody clearfix'>" + content + "</div>";
		dialog    += "<div class='dialogFooter clearfix'><a id='closeButton' style='float: right;' href='#' onclick='$.fancybox.close()' class='button small lightblue'>" + closeButtonText + "</a></div>";
		dialog    += "</div>";
		
		$.fancybox({
			'width'			:	600,
			'autoDimensions':	false,
			'autoScale'		:	false,
			'centerOnScroll':	true,
			'transitionIn'	:	'none',
			'transitionOut'	:	'none',
			'easingIn'		:	'swing',
			'easingOut'		: 	'swing',
			'overlayShow'	:	true,
			'scrolling' 	: 	'no',
			'content'		:	dialog,
			'modal'			: 	true,
			'onComplete'	: 	function() {
				fixHeight();
				setCloseButtonFocus();
			}
		});
	};
	this.showConfirmDialog = function() {
		
	};
	this.showCustomDialog = function(className, headerText, content, closeButtonText, closeButtonClickAction, confirmButtonText, confirmButtonClickAction, width, cb) {
		
		var dialog = "<div id='customDialog' class='" + className + " dialog'>";
		dialog    += "<div class='dialogHeader'>" + headerText + "</div>";
		dialog    += "<div class='dialogBody'>" + content + "</div>";
		dialog    += "<div class='dialogFooter'><a id='closeButton' style='float: right;' href='#' onclick='" + closeButtonClickAction + ";$.fancybox.close()' class='button small lightblue'>" + closeButtonText + "</a><a style='float: right;' href='#' onclick='" + confirmButtonClickAction + "' class='button small lightblue'>" + confirmButtonText + "</a></div>";
		dialog    += "</div>";
		
		$.fancybox({
			'autoDimensions':	true,
			'scrolling' 	: 	'no',
			'transitionIn'	:	'none',
			'transitionOut'	:	'none',
			'content'		:	dialog,
			'modal'			: 	true,
			'onComplete'	: 	function() {
				cb();
				setCloseButtonFocus();
			}
		});
	};
};

/**
 * Simple singleton class for handling tooltips.
 * 
 * Licenced under MIT, GPL2
 * 
 * 2011 Jørund Nydal
 */
var TooltipHandler = new function TooltipHandler() {
	var HORIZONTAL_FIELD_OFFSET = 20;

	function remove(element) {
		var tooltipId = $(element).data("tooltipId");
		$("#" + tooltipId).animate({marginTop : "-30px", opacity : "0.0"}, "slow", function() {
			$(this).remove();
		});
	};

	/**
	 * Should only be used on elements with id's
	 */
	this.showFieldError = function(element, text) {
		var tooltipId = $(element).attr("id") + "_tooltip";
		var tooltip = $("<div id=\"" + tooltipId + "\" class=\"tooltip fielderror\"><span>" + text + "</span></div>");
		$(element).data("tooltipId", tooltipId);
		
		var pos = $(element).offset();
		pos.left += $(element).width();
		pos.left += HORIZONTAL_FIELD_OFFSET;
		
		var initialTooltipStyle = { 
									left : pos.left,
									top : pos.top,
									marginTop : "10px",
									opacity : "0.4"
								};
		
		var tooltipStyle = { marginTop : 0, opacity : "1.0"};

		$(tooltip).css(initialTooltipStyle);
		$("body").append(tooltip);
		$("#" + tooltipId).animate(tooltipStyle, "fast");
	};
	
	this.remove = function(element) {
		remove(element);
	};
};

/**
 * Class for handling server connection.
 *
 * Licenced under MIT, GPL2
 * 
 * 2011 Jørund Nydal
 */
var ServerHandler = new function ServerHandler() {
	
	/**
	 * This is a general purpose function for server action calls.
	 * 
	 * Server JSON actions used together with this needs to return a 
	 * success : true/false along with the rest of the data in order for the handler to work.
	 * 
	 */
	this.call = function(action, successResponseFunction, completeFunction) {
		
		// Set defaults
		var _data = "";
		var _type = "POST";
		var _url = "/action/register/";
		
		/**
		 * On http and other unhandled errors.
		 * 
		 * @param response
		 */
		function internalErrorResponseFunction(errors) {
			DialogHandler.showErrorDialog(errors);
		};
		
		switch (action) {
			case "<action>":

				break;

			default:
		}
		
		// invoke jQuery ajax facade
		$.ajax({
		  type: _type,
		  data: _data,
		  url: _url,
		  success: function(response) {
			  if (response.success === true) {
				  successResponseFunction(response);
			  } else {
					if (typeof response.fieldErrors !== "undefined") {
						for (var i = 0; i < response.fieldErrors.length; i++) {
							$("input[name=" + response.fieldErrors[i].field + "]").addClass("error");
							TooltipHandler.showFieldError($("input[name=" + response.fieldErrors[i].field + "]"), response.fieldErrors[i].error);
						}
					} else {
						internalErrorResponseFunction(response.errors);
					}
			  }
		  },
		  error:internalErrorResponseFunction,
		  complete:completeFunction,
		  dataType:'JSON'
		});
	};
};

/**
 * 
 * jValidate plugin v1.0
 * 
 * Licenced under MIT, GPL2
 * 
 * 2011 Jørund Nydal
 */
(function($) {

	$.fn.jvalidate = function(options) {
		// executed on validation
		debug(this);
		// build main options before element iteration
		var opts = $.extend({}, $.fn.jvalidate.defaults, options);
		// iterate and reformat each matched element
		var result = true;
		var inputElements = $(this).find("input[required],select[required]");

		function removeErrorState(e) {
			$(e.target).removeClass("error");
			TooltipHandler.remove(e.target);
		};

		function clearOnWrite(e) {
			if (e.keyCode !== 13) {
				removeErrorState(e);
			}
		};

		inputElements.each(function() {
			$this = $(this);

			// reset states to default
			$this.removeClass('error');

			if (!$this.jvalidate.validate()) {
				result = false;
			}

			// bind event handlers if not bound.
			$this.unbind('keyup', clearOnWrite).keyup(clearOnWrite);
			$this.unbind('click', removeErrorState).click(removeErrorState);
		});
		return result;
	};

	/**
	 * for debug
	 * 
	 * @param $obj
	 */
	function debug($obj) {
		if (window.console && window.console.log) {
			window.console.log('elements: ' + $obj);
		}
	};

	/**
	 * main validation
	 */
	$.fn.jvalidate.validate = function() {
		var result = true;
		// validate passwords
		if ($this.is("input") && ($this.attr('type') === "password")) {
			if ($this.val().length < $this.attr('minlength')) {
				result = false;
			}
			if (String($this.attr('data-equals')) != "undefined") {
				if (!$this.jvalidate.verifyPassword()) {
					result = false;
				}
			}
		}
		// validate inputs
		if ($this.is("input") && ($this.attr('type') === "text")
				&& ($this.val().length < $this.attr('minlength'))) {
			result = false;
		}
		// validate email
		if (($this.is("input") && ($this.attr('type') === "email"))) {
			if (!$this.jvalidate.validateEmail()) {
				result = false;
			}
		}
		// validate checkboxes
		if ($this.is("input") && ($this.attr('type') === "checkbox")) {
			if (!$this.is(":checked")) {
				result = false;
			}
		}
		// validate selectboxes
		if ($this.is("select")) {
			var value = $this.val();
			if (value == "-1") {
				result = false;
			}
		}
		// update status of element
		if (result === true) {
			$this.removeClass('error');
		} else {
			$this.addClass('error');
		}
		return result;
	};

	/**
	 * validate email
	 */
	$.fn.jvalidate.validateEmail = function() {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		return $this.val().match(re)
	};

	/**
	 * verify password
	 */
	$.fn.jvalidate.verifyPassword = function() {
		var passwordField = String($this.attr("data-equals"));
		var expression = "input[name=" + passwordField + "]";
		var password = $(expression).val();
		var validatePassword = $this.val();
		return (validatePassword === password);
	};
})(jQuery);