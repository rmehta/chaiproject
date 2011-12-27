/*
A sortable vector list of object names

item1 [x]
item2 [x]
item3 [x]
______ [add]

opts = {
	$parent,
	range,
	label,
	item_label_key, // key if item is an object
	item_name_key,
}

CSS:

itemlist
items
add-item-link
add-item-input


*/

var ItemListView = Class.extend({
	init: function(opts) {
		this.opts = opts;
		$.set_default(this.opts, 'allow_default', false);
		$.set_default(this.opts, 'label', 'Item');
		this.set_css();
		this.make();
		this.controller = new ItemListController(this);
	},
	set_css: function() {
		// reduce padding in items and btn
		$.set_css('\
			.add-item-link a, a.add-item-cancel {\
				color: #444;\
				line-height: 1.5em;\
			}\
			.item { \
				padding: 7px;\
				background-color: #e0e0e0;\
				border: 1px solid #ccc;\
				margin: 7px 0px;\
			}\
			.item.add { background-color: #efefef; }\
			.item .close {\
				margin-top: -3px;\
			}\
			.items button.btn { padding: 4px; }');
	},
	make: function() {
		// wrapper
		this.opts.$parent.append($.rep('<div class="clearfix">\
		<div class="itemlist span5 input">\
			<div class="items"></div>\
			<div class="item add round">\
				<div class="add-item-link">\
					<a href="#" onclick="return false;">Click here to add %(label)s</a>\
				</div>\
				<div class="add-item-input" style="display: none;">\
					<div>\
						<input name="add-item" class="span3" />\
						<button class="btn small add-item-btn">Add</button>\
					</div>\
					<a class="add-item-cancel" href="#" onclick="return false;">Cancel</a>\
				</div>\
			</div>\
		</div>\
		</div>', this.opts));
		this.$wrapper = this.opts.$parent.find('.itemlist:last');
		this.$input = this.$wrapper.find('input[name="add-item"]');
	},
	add_item: function(name, label) {
		this.$wrapper.find('.items')
			.append($.rep('<div class="item round" \
				data-name="%(name)s">%(label)s\
				<a class="close" href="#">×</a>\
				</div>', {name:name, label:label}));
	},
	remove_item: function(name) {
		this.$wrapper.find('[data-name="'+name+'"] a.close').click();
	},
})

var ItemListController = Class.extend({
	init: function(view) {
		this.view = view;
		var $w = view.$wrapper;
		
		// show input on click
		$w.find('.add-item-link').click(function() {
			$(this).toggle();
			$w.find('.add-item-input').toggle();
			$w.find('.add-item-input input').val('');
		});
		
		// hide input on done
		$w.find('.add-item-cancel').click(function() {
			$w.find('.add-item-link').toggle();
			$w.find('.add-item-input').toggle();
		});
		
		// add item on add
		$w.find('.add-item-btn').click(function() {
			var name = view.$input.val();
			if(name) {
				view.add_item(name, name);
			}
			$w.find('.add-item-cancel').click();
			return false;
		});
		
		// remove item
		$w.delegate('a.close', 'click', function() {
			$(this).parent().attr('data-name','').fadeOut().remove();
		});
		
		// autosuggest
		if(view.opts.range) {
			$.require('lib/views/form/autocomplete.js');
			view.$input.set_autocomplete({type: view.opts.range});
		}
		
		// add on enter
		view.$input.keyup(function(events) {
			if(event.which==13) {
				$w.find('.add-item-btn').click();
				return false;
			}
		});
	},
	add_items: function(lst) {
		for(i in lst) {
			if(typeof(lst[i])=='string') {
				this.view.add_item(lst[i], lst[i]);
			} else {
				this.view.add_item(
					lst[i][this.view.opts.item_name_key || 'name'],
					lst[i][this.view.opts.item_label_key || 'label']);
			}
		}
	},
	clear: function() {
		this.view.$wrapper.find('.items').empty();
	},
	get_items: function() {
		var lst = [];
		this.view.$wrapper.find('.items .item').each(function(idx, item) {
			var v = $(item).attr('data-name');
			if(v)
				lst.push(v);
		});
		return lst;
	}
})