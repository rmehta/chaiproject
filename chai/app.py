"""
WSGI handler
============

WSGI server for handling dynamic reqeusts. The requests will be directly passed
on to the relevant python module to be executed and response will be in json.

The method to be called must be explicitly allowed by calling the @whitelist decorator.

Usage:
------
_method="package.module.method"

If there is no method, index.html will be served

the query_string and environ will be passed to the method
"""
from lib.chai import db
from lib.chai.cms import page
import sys

def handle():
	from lib.chai import req
	
	"""handle the request"""
	# execute a method
	if '_method' in req.params:
		return handle_method()
	elif 'page' in req.params:
		return page.get(name=req.params['page'])
	else:
		return page.get(name='index')

def handle_method():
	"""pass control to a whitelisted method"""
	from lib.chai import req

	parts = req.params['_method'].split('.')
	module = '.'.join(parts[:-1])
	method = parts[-1]

	# import the module
	__import__(module)

	from lib.chai import whitelisted
				
	if module in sys.modules:
		# check if the method is whitelisted
		if getattr(sys.modules[module], method) not in whitelisted:
			return {"error":"Method `%s` not allowed" % method}

		# execute
		if req.method=='POST':
			db.begin()
							
		t = getattr(sys.modules[module], method)(**req.params)

		if req.method=='POST':
			db.commit()
		
		if type(t) in (str, unicode):
			t = {"message": t}

		return t or {"message":"no response"}
	else:
		return {"error":"Unable to load method"}
		
def json_type_handler(obj):
	"""convert datetime objects to string"""
	if hasattr(obj, 'strftime'):
		return str(obj)

def setup_request(environ):
	"""setup global req, res"""
	from webob import Request, Response
	import lib.chai
	import conf
	
	# clear session
	lib.chai.sess = {}
	lib.chai.req = Request(environ)
	lib.chai.res = Response()
	lib.chai.out = {}
	lib.chai.site = conf.default_site
	
def application(environ, start_response):
	import json

	setup_request(environ)
	
	import lib.chai
	from lib.chai import db, req, res
	
	# start db connection
	if '_method' in req.params and req.params['_method'] != 'lib.chai.session.login':
		import lib.chai.session
		lib.chai.sess = lib.chai.session.load()
	
	res.content_type = 'text/html'
	
	try:
		out = handle()
		if type(out) is dict:
			lib.chai.out.update(out)
		else:
			lib.chai.out = out
	except Exception, e:
		from lib.chai.common import traceback
		lib.chai.out['error'] = str(traceback())
		
	if not res.body:
		if type(lib.chai.out) in (str, unicode):
			res.body = str(lib.chai.out)
		else:
			res.body = json.dumps(lib.chai.out, default=json_type_handler)
			
	return res(environ, start_response)
	