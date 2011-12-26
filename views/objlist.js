/*
Object List View

List objects of a type

1. Heading
2. Search (filter)
3. List (paging)
4. More
5. Customize:
	"get_content"
	"columns"
6. New btn
7. Last updated

Options
-------

*/

$.require('lib/js/prettydate.js');

var ObjListView = Class.extend({
	init: function(opts) {
		this.opts = opts;
		
		$.set_default(this.opts, 'columns',  ['name', '_updated']);
		$.set_default(this.opts, 'order_by',  'name');
		
		this.make();
		this.run();
	},
	make: function() {
		this.$w = this.opts.$parent.append('<div class="objlist-wrapper">\
			<div class="objlist-header">\
				<p>\
					<input type="text" name="search" />\
					<button class="btn">Seach</button>\
				</p>\
			</div>\
			<div class="objlist-body">\
			</div>\
			<div class="objlist-footer">\
				<p class="hide nothing">Nothing to show</p>\
				<button class="btn objlist-more-btn hide">More Records</button>\
				<p class="hide thats-it">Thats it!</p>\
			</div>\
		</div>').find('.objlist-wrapper:last');

		this.$b = this.$w.find('.objlist-body')
		
	},
	run: function() {
		this.$b.empty();
		var me = this;
		// get list of pages
		$.call({
			method:"lib.py.query.get",
			data: {
				type: this.opts.type, 
				columns: this.opts.columns.join(', '),
				order_by: this.opts.order_by
			},
			success: function(data) {
				if(!data.result.length) {
					me.$w.find('.help-block.nothing').toggleClass('hide', true);
				} else {
					me.render_result(data.result);
				}
			}
		});
	},
	render_result: function(result) {
		for(var i in result) {
			this.render_item(i, result[i])
		}
	},
	render_item: function(idx, obj) {
		// to be overridden
		this.$b.append('<p>' + JSON.stringify(obj) + '</p>')
	}
});