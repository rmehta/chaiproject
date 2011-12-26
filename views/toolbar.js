$.require('lib/js/bootstrap/bootstrap-dropdown.js');
(function($) {
	app.topbar = {
		make: function() {
			var user = $.session.user;
			// set brand
			$('.topbar .brand').html($.app_name);

			// clear out if there is anything
			$('.topbar .nav.secondary-nav').empty();

			// render admin
			if(!user || user=='guest') {
				app.topbar.make_login();
			}

			// if not guest and admin
			if(user && user!='guest') {
				app.topbar.make_admin();
				app.topbar.make_profile();
			}
			app.topbar.make_content();
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
	};
	
})(jQuery);

// activate dropdown events
$(document).ready(function() {
	$('.topbar').dropdown();	
})

// make toolbar on login
$(document).bind('login', function() {
	app.topbar.make();
});

$(document).bind('logout', function() {
	app.topbar.make();
});
