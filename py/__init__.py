req = None
res = None
sess = None
out = {}
whitelisted = []

def whitelist(fn):
	"""decorator for whitelisting a function"""
	global whitelisted
	whitelisted.append(fn)
	return fn
	
def blank():
	"""start an empty session for testing"""
	global sess, req
	from webob import Request
	req = Request.blank('server/')
	sess = {"user":"test"}