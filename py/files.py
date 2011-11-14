#!/usr/bin/python

"""file upload manager"""

import os, conf, http_request

conf.files_path = os.path.join(os.path.dirname(__file__), '../..', conf.files_path)

def post(**args):
	"""save files in uploads folder"""
	import json
	
	req = http_request.req
	out = {'message':'start'}
	
	try:
		if 'filedata' in req.formdata:
			# read the content
			fdata = req.formdata['filedata']
			fname, content = scrub(fdata.filename), fdata.file.read()
		
			# check size
			if len(content) > conf.max_file_size:
				out = {"error":"file exceeds limit %sMB" % (int(conf.max_file_size / 1024**3))}
			else:
				save(fname, content)
				out = {"message":"ok", "fname":fname}
	except Exception, e:
		out = {'error': str(e)}

	req.out_text = json.dumps(out)

def save(fname, content):
	"""save the file"""
	f = open(os.path.join(conf.files_path, fname), 'w+')
	f.write(content)
	f.close()

def scrub(fname):
	"""get scrubbed filename"""
	# some browsers return the full path
	if '\\' in fname:
		return fname.split('\\')[-1]
	if '/' in fname:
		return fname.split('/')[-1]
	return fname

def get(**args):
	"""retun list of files"""
	ret = []
	import os, conf
	import datetime
	
	for wt in os.walk(os.path.join(conf.files_path)):
		for fn in wt[2]:
			fpath = os.path.join(wt[0], fn)
			ret.append([os.path.relpath(fpath, conf.files_path), \
				str(datetime.datetime.fromtimestamp(os.stat(fpath).st_mtime)), \
				os.stat(fpath).st_size])

	return {'files':ret}

def delete(**args):
	"""delete file (user must be logged in)"""
	req = http_request.req
	if req.session.user == 'guest':
		return {"message":"must be logged in"}
	import os
	os.remove(os.path.join(conf.files_path, args['name']))
	return {"message":"ok"}
	

# request handling
if __name__=="__main__":
	http_request.main()