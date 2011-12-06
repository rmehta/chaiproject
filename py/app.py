"""
WSGI handler
============

WSGI server for handling dynamic reqeusts. The requests will be directly passed
on to the relevant python module to be executed and response will be in json.

The method to be called must be explicitly allowed by calling the @whitelist decorator.

method="package.module.method"

the query_string and environ will be passed to the method
"""

req, res, session, out = None, None, None, {}

def handle(db):
	"""handle the request"""
	global req
	import sys
	
	# execute a method
	if '_method' in req.params:
	
		parts = req.params['_method'].split('.')
		module = '.'.join(parts[:-1])
		method = parts[-1]
	
		# import the module
		__import__(module)
	
		from lib.py import whitelisted
					
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

			return t
		else:
			return {"error":"Unable to load method"}
	else:
		return {"error":"Request must have method"}

def json_type_handler(obj):
	"""convert datetime objects to string"""
	if hasattr(obj, 'strftime'):
		return str(obj)
		
def application(environ, start_response):
	import json
	from webob import Request, Response

	global req, res, out, session
	
	req = Request(environ)
	res = Response()
	
	from lib.py import database
	# start db connection
	db = database.get()

	if 'method' in req.params and req.params['method'] != 'lib.py.session.login':
		import lib.py.session
		session = lib.py.session.load()
	
	res.content_type = 'text/html'
	
	try:
		out = handle(db)
	except Exception, e:
		from lib.py.common import traceback
		out['error'] = str(traceback())
		
	if not res.body:
		if type(out) is str:
			res.body = out
		else:
			res.body = json.dumps(out, default=json_type_handler)
		
	db.close()
	
	return res(environ, start_response)
	