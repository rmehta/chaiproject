import model, http_request

class Page(model.Model):
	def __init__(self, obj):
		super(Page, self).__init__(obj)
		
	def after_post(self):
		"""generated html pages"""
		import pages
		ret = pages.make()
		http_request.req.out['log'] = ret
