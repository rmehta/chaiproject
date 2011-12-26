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
		return this.head() + this.obj.html + this.footer();
	},
	head: function() {
		return this.h1() + this.breadcrumbs();
	},
	h1: function() {
		if(this.obj.label && $.trim(this.obj.html).substr(0,4)!='<h1>') {
			return '<h1>' + this.obj.label + '</h1>';
		} else {
			return '';
		}		
	},
	breadcrumbs: function() {
		if(this.obj.ancestors) {
			out = '<ul class="breadcrumb">'
			for(var i in this.obj.ancestors) {
				out += $.rep('<li><a href="#%(name)s">%(label)s</a>\
					<span class="divider">/</span></li>', this.obj.ancestors[i]);
			}
			return out + $.rep('<li class="active">%(label)s</li></ul>', this.obj);
		} else {
			return '';
		}
	},
	footer: function() {
		return this.subpages() + this.editlink();
	},
	subpages: function() {
		if(this.obj.subpages && this.obj.subpages.length) {
			out = '<p><div class="span5 round" style="background-color: #f8f8f8; \
				border: 1px solid #ccc;\
				padding: 0px 11px">\
				<h5>Content</h5><ol>';
			for(var i in this.obj.subpages) {
				out += $.rep('<li><a href="#%(name)s">%(label)s</a></li>', this.obj.subpages[i])
			}
			return out + '</ol></div></p>'
		} else {
			return '';
		}		
	},
	editlink: function() {
		if(this.obj.label && $.session && $.session.user != 'guest') {
			return $.rep('<p><a href="#editpage/%(name)s">Edit this page</a></p>', this.obj);
		} else {
			return '';
		}
	}
});