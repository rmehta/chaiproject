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
		var body = this.obj.html;

		if(this.obj.label && $.trim(body).substr(0,4)!='<h1>') {
			var head = '<h1>' + this.obj.label + '</h1>';
		} else {
			var head = '';
		}

		footer = ''; // subpages list comes here
		
		return head + body + footer;
	}
});