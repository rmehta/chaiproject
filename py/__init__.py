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