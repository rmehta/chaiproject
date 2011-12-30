/*
Application
-----------

app.register() - open register modal
app.login() - fires login modal
app.logout()
app.editprofile() - edit profile view

Setup/internal methods:

These are called at startup $(document).ready

app.load_session() - load session info
app.setup_localstorage() - clear localstorage if version is changed or -1
app.delegate_hardlinks() - create a delegate on click events on link <a> objects
app.open_default_page() - open default page on load / fire necessary events

*/

// app namespace for app globals
var app = {	
	// module views
	login: function() {
		$.require('lib/views/user/login.js');
		if(!app.loginview)
			app.loginview = new LoginView();
		app.loginview.show();
	},
	logout: function() {
		$.call({
			method:'lib.chai.session.logout',
			type:'POST', 
			success: function(data) {
				$.session = {"user":"guest" ,"userobj":{}}
				$(document).trigger('logout');
			}
		});
	},
	register: function() {
		$.require('lib/views/user/register.js');
		if(!app.registerview)
			app.registerview = new RegisterView();
		app.registerview.show();		
	},
	editprofile: function() {
		$.require('lib/views/user/editprofile.js');
		if(!app.editprofileview)
			app.editprofileview = new EditProfileView();
		app.editprofileview.show();
	},
	setup_localstorage: function() {
		if(localStorage) {
			if(app.version==-1) 
				localStorage.clear();
			if(localStorage._version && localStorage._version != app.version) {
				localStorage.clear();
			}
		} 
		localStorage._version = app.version;		
	},
	delegate_hardlinks: function() {
		// hardlinks to softlinks
		$("body").delegate("a", "click", function() {
			var href = $(this).attr('href');
			if(href && 
				href.substr(0,1)!='#' &&
				href.substr(0,6)=='pages/' &&
				href.indexOf('.html')!=-1) {
					location.href = '#' + href.substr(6, href.length-11);
					return false;
			}
			return true;
		});		
	},
	// open default page
	open_default_page: function() {
		$content = $('#main .content-wrap.active');
		if(location.hash && location.hash != '#') {
			// remove the current content - may overlap
			$content.remove();
			$(window).trigger('hashchange');
		} else {
			if($content.length) {
				var cid = $content.attr('id');
				if(app.views[cid]) {
					// loading a view by default
					$content.remove();
					chai.view.open(cid);
				} else {
					// active content is already loaded, 
					// (for static content)
					$content.trigger('_show');					
				}
			} else {
				// no location, open index
				chai.view.open($.index);
			}
		}
	},
	load_session: function() {
		$.call({
			method:'lib.chai.session.load', 
			success:function(session) {
				$.session = session
				// trigger login
				$(document).trigger('login');
			}
		})		
	},
	setup_cms: function() {
		
	}
};

// STARTUP!
$(document).ready(function() {	
	// clear localStorage if version changed
	app.setup_localstorage();		

	// load session
	app.load_session();

	// delete hardliks to softlinks
	app.delegate_hardlinks();

	// open default page
	app.open_default_page();
	
	// setup cms settings
	app.setup_cms();
});