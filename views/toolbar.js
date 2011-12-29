var TopBar = Class.extend({
	init: function() {
		$('header').append('<div class="topbar">\
			<div class="topbar-inner">\
				<div class="container">\
					<a class="brand" href="#index">[Title]</a>\
					<ul class="nav">\
					</ul>\
					<ul class="nav secondary-nav">\
					</ul>\
				</div>\
			</div>\
		</div>');
		this.make();
		this.bind_events();
		$('.topbar').dropdown();	
	},
	
	bind_events: function() {
		var me = this;
		// make toolbar on login
		$(document).bind('login', function() {
			me.make();
		});

		$(document).bind('logout', function() {
			me.make();
		});		
	},
	
	make: function() {
		var user = ($.session && $.session.user) || 'guest';

		// set brand
		$('.topbar .brand').html(app.brand);

		// clear out if there is anything
		$('.topbar .nav.secondary-nav').empty();

		// render admin
		if(!user || user=='guest') {
			this.make_login();
		}

		// if not guest and admin
		if(user && user!='guest') {
			this.make_admin();
			this.make_profile();
		}
	},
	
	make_login: function() {
		$('.topbar .nav.secondary-nav').append('\
			<li><a href="javascript:app.login()">Login</a></li>\
		');
	},
	
	make_admin: function() {
		// edit links for admins
		if(app.cms) {
			$('.topbar .nav.secondary-nav').append('\
				<li class="dropdown">\
					<a class="dropdown-toggle" href="#">Admin</a>\
					<ul class="dropdown-menu">\
						<li><a href="#pagelist">Pages</a></li>\
						<li><a href="#filelist">Files</a></li>\
						<li><a href="#userlist">Users</a></li>\
					</ul>\
				<li>');
		}
	},
	
	make_content: function() {
		if(app.cms) {
			if(!$('.topbar .nav [href="#toc"]').length)
				$('.topbar .nav:first').append('<li><a href="#toc">Contents</a></li>')
		}
	},
	
	make_profile: function() {
		// user profile and logout
		var img = '';
		if($.session.userobj.email) {
			var img = $.get_gravatar($.session.userobj.email);
		}
		$('.topbar .nav.secondary-nav').append('\
			<li class="dropdown">' +
				'<a class="dropdown-toggle" href="#">'
					+ ($.session.userobj.fullname || $.session.user)+'</a>\
				<ul class="dropdown-menu">\
					<li><a href="javascript:app.editprofile()">Edit Profile</a></li>\
					<li><a href="javascript:app.logout()" id="topbar_logout">Logout</a></li>\
				</ul>\
			<li>' + img);

		// logout
		$('#topbar_logout').click($.logout);
	}	
});


// activate dropdown events
$(document).ready(function() {
	$.require('lib/js/bootstrap/bootstrap-dropdown.js');
	app.topbar = new TopBar();
})


