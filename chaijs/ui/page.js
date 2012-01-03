var PageView = Class.extend({
	init: function(obj) {
		this.obj = obj;
		this.make();
	},
	make: function() {
		this.$body = $('<div>')
			.addClass('content-wrap')
			.attr('id', this.obj.name)
			.appendTo('#main')		
		this.make_sidebar();
		
		// html
		this.$body.html(this.content());
		
		// js & css
		if(this.obj.js) $.set_js(this.obj.js);
		if(this.obj.css) $.set_css(this.obj.css);
		
		this.$body.trigger('page_make');
	},
	// if the layout has a #sidebar, make a .sidebar-section under .sections
	// with id as #sidebar-(name)
	// this div will be automatically shown / hidden with the page
	make_sidebar: function() {
		if($('#sidebar').length) {
			$('#sidebar .sections').append($.rep('<div class="sidebar-section"\
			 	id="sidebar-%(name)s"></div>', this.obj));
			this.$sidebar = $('#sidebar-' + this.obj.name);
		}
	},
	hide: function() {
		this.$body.removeClass('active');
		this.$sidebar && this.$sidebar.removeClass('active');
		this.$body.trigger('page_hide');
	},
	show: function() {
		this.$body.addClass('active');
		this.$sidebar && this.$sidebar.addClass('active');
		this.$body.trigger('page_show');
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