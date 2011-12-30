"""simple replacement script"""

def replace(start, txt1, txt2, extn):
	"""replace all txt1 by txt2 in files with extension (extn)"""
	import os, re
	for wt in os.walk(start, followlinks=1):
		for fn in wt[2]:
			if fn.split('.')[-1]==extn:
				fpath = os.path.join(wt[0], fn)
				with open(fpath, 'r') as f:
					content = f.read()
				
				if re.search(txt1, content):
				
					with open(fpath, 'w') as f:
						f.write(re.sub(txt1, txt2, content))
				
					print 'updated in %s' % fpath