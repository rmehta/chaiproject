#!/usr/bin/python

import http_request

def get(**args):
	"""
	execute a select query
	
	Parameters:
	type
	columns = "a,b,c"
	filters = [["a","=","5"],]
	order_by = "a"
	limit = "20"
	"""
	req = http_request.req
	
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
		args['conditions'] = 'where ' + \
			' and '.join(['`%s` %s %s' % (f[0], f[1], '%s') for f in args['filters']])
		args['values'] = tuple([f[2] for f in args['filters']])
	
	return {"result": req.db.sql("""select %(columns)s 
		from `%(type)s` 
		%(conditions)s 
		%(order_by)s %(limit)s""" % args, args['values'], as_dict=1)}

if __name__=="__main__":
	http_request.main()
