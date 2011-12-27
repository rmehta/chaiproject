var PageView = Class.extend({
	init: function(obj) {
		this.obj = obj;
		this.make();
	},
	make: function() {
		$('<div>')
			.addClass('content')
			.attr('id', this.obj.name)
			.appendTo('.main.container')
			.html(this.content());
			
		if(this.obj.js) $.set_script(this.obj.js);
		if(this.obj.css) $.set_style(this.obj.css);
		
		$("#"+name).trigger('_make');		
		
	},
	content: function() {		
		return this.obj.html + this.footer();
	},
	footer: function() {
		return this.editlink();
	},
	editlink: function() {
		if(this.obj.virtual && $.session && $.session.user != 'guest') {
			return $.rep('<p><a href="#editpage/%(name)s">Edit this page</a></p>', this.obj);
		} else {
			return '';
		}
	}
});