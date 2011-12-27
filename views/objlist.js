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
		$.set_default(this.opts, 'page_length',  20);
		
		this.make();
		this.controller = new ObjListController(this);
		this.controller.run();
	},
	make: function() {
		this.$w = this.opts.$parent.append('<div class="objlist-wrapper">\
			<div class="objlist-header">\
				<p>\
					<input type="text" name="search" />\
					<button class="btn objlist-search-btn">Seach</button>\
				</p>\
			</div>\
			<div class="objlist-body">\
			</div>\
			<div class="objlist-footer">\
				<p class="help-block nothing">Nothing to show</p>\
				<button style="display: none" class="btn objlist-more-btn">More Records</button>\
				<p class="help-block thats-it">Thats it!</p>\
			</div>\
		</div>').find('.objlist-wrapper:last');

		this.$b = this.$w.find('.objlist-body');
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

var ObjListController = Class.extend({
	init: function(view) {
		this.view = view;
		this.set_events();
	},
	set_events: function() {
		var me = this;
		
		// more btn
		this.view.$w.find('.objlist-more-btn').click(function() {
			me.run(true);
		});
		
		// search
		this.view.$w.find('.objlist-search-btn').click(function() {
			me.run(false);
		});
		
		this.view.$w.find('[name="search"]').keyup(function(ev) {
			if(ev.which==13) {
				me.view.$w.find('.objlist-search-btn').click();
			}
		});
	},
	reset: function(extend) {
		if(!extend) {
			this.view.$b.empty();			
		}
	},
	run: function(extend) {
		var me = this;
		if(!extend) {
			this.start = 0;
			this.reset();
		} 
		// get list of pages
		$.call({
			method:"lib.py.query.get",
			data: this.make_query(),
			success: function(data) {
				me.reset(extend);
				me.update_footer(data.result, extend);
				me.view.render_result(data.result);					
				if(data.result) {
					me.start = me.start + data.result.length;
				}
			}
		});
	},
	make_query: function() {
		var data = {
			type: this.view.opts.type, 
			columns: this.view.opts.columns.join(', '),
			order_by: this.view.opts.order_by,
			limit: this.start + ', ' + this.view.opts.page_length
		}
		var search_str = this.view.$w.find('[name="search"]').val();
		if(search_str) {
			data.filters = [["label", "like", search_str + '%'],];
		}
		return {json: JSON.stringify(data)};
	},
	update_footer: function(result, extend) {
		var $w = this.view.$w;
		$w.find('.nothing, .objlist-more-btn, .thats-it').css('display', 'none');
		if(!result.length) {
			if(extend) {
				$w.find('.thats-it').toggle();
			} else {
				$w.find('.nothing').toggle();
			}
		} else {
			if(result.length == this.view.opts.page_length) {
				$w.find('.objlist-more-btn').toggle();
			} else {
				$w.find('.thats-it').toggle();
			}
		}
	}
})