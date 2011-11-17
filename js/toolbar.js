$.require('lib/js/bootstrap/bootstrap-dropdown.js');
(function($) {
	$.topbar = {
		make: function() {
			var user = $.session.user;
			// set brand
			$('.topbar .brand').html($.app_name);

			// clear out if there is anything
			$('.topbar .nav.secondary-nav').empty();

			// render admin
			if(!user || user=='guest') {
				$.topbar.make_login();
			}

			// if not guest and admin
			if(user && user!='guest') {
				$.topbar.make_admin();
				$.topbar.make_profile();
			}			
		},
		
		make_login: function() {
			$('.topbar .nav.secondary-nav').append('\
				<li><a href="#signin">Login</a></li>\
			')		
		},
		
		make_admin: function() {
			// edit links for admins
			if($.session.userobj.is_admin) {
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
		
		make_profile: function() {
			// user profile and logout
			$('.topbar .nav.secondary-nav').append('\
				<li class="dropdown">\
					<a class="dropdown-toggle" href="#">'
						+($.session.userobj.fullname || $.session.user)+'</a>\
					<ul class="dropdown-menu">\
						<li><a href="#editprofile">Edit Profile</a></li>\
						<li><a href="#" id="topbar_logout">Logout</a></li>\
					</ul>\
				<li>');

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
$(document).bind('session_load', function() {
	$.topbar.make();
});
