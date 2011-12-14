"""
Simple query service
"""

from lib.py import whitelist, database, out

typemethod = type

@whitelist(allow_guest=True)
def get(**args):
	"""
	execute a select query
	
	Parameters:
	type
	columns = "a,b,c"
	filters = [["a","=","5"],]
	order_by = "a asc"
	limit = "20"
	"""
	import json
	db = database.get()
	
	if 'json' in args:
		args.update(args['json'])

	if 'order_by' in args:
		args['order_by'] = ' order by ' + args['order_by']

	if 'limit' in args:
		args['limit'] = ' limit ' + args['limit']
	
	args.setdefault('order_by','')
	args.setdefault('limit','')
	args.setdefault('conditions','')
	args.setdefault('values', ())

	# conditions
	if 'filters' in args:
		if typemethod(args['filters']) in (str, unicode):
			args['filters'] = json.loads(args['filters'])
			
		args['conditions'] = 'where ' + \
			' and '.join(['`%s` %s %s' % (f[0], f[1], '%s') for f in args['filters']])
		args['values'] = tuple([f[2] for f in args['filters']])
	
	return {"result": db.sql("""select %(columns)s 
		from `%(type)s` 
		%(conditions)s 
		%(order_by)s %(limit)s""" % args, args['values'], as_dict=1)}