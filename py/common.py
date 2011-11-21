"""
common functions
"""

def directory_root():
	"""path to www (parent of parent of current directory)"""
	import os
	return os.path.join(os.path.dirname(__file__), '../..')

def update_path():
	"""add the directory_root to path"""
	import sys
	sys.path.append(directory_root())
	
def log(msg):
	"""log some info to publish in client console"""
	from http_request import req
	if not req: return
		
	if not req.out.get('_log'):
		req.out['_log'] = []
	req.out['_log'].append(msg)