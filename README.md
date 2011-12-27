# chaiproject

Collection of Python/JS libraries for a standard web project

## Features

1. Python ORM + MVC
2. Session management and Routing (via python modules)
3. User management - login / logout / register / forgot password
4. JS form library
5. Virtual (AJAX) views and manager
6. Static (HTML) page generator for SEO
7. Twitter Bootstrap CSS
8. File upload management
9. Email tools

## Requirements

1. MySQL
2. Python Modules:
	- mysql-python (mysqldb)
	- markdown2 (for emails)
	- html2text (for emails)
	- requests
	- webob
3. WSGI web server

## Start a new app

1. start a new git repository
2. add chaiproject as a submodule in "lib"
3. use lib/py/chai.py startup scripts
	chai newapp

## Sample App:

[Whiteboard App](https://github.com/rmehta/whiteboardapp)

## Web server

all requests are fed to the / of the url of execution
set your server to handle / to app.py via wsgi

## Sample nginx settings

	# u-wsgi
	location / {
		include uwsgi_params;
		uwsgi_pass unix:///tmp/myapp.sock;
	}
	
	# redirect index to / (there is no index.html)
	rewrite /index.html / permanent;

	# write condition to restrict conf, models, controllers, lib/py,
	# lib/controllers, lib/models
	location ~* /(conf|models|controllers|py) {
		return 403;
	}

## License

MIT