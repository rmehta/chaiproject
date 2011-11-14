"""
generate html pages for all type "page"
records for seo friendliness

files are generated from index_template.html
index_template.html must have `<div class="main container"></div>`
inside which the page html will be rendered
"""

def make():
	import os
	import conf
	import database
	container = '<div class="main container">'

	db = database.Database()
	pages_path = os.path.join(os.path.dirname(__file__), '../..')
	
	index_html = open(os.path.join(os.path.dirname(__file__), '../..', 'index_template.html'),'r').read()
	index_html = index_html.split(container)

	if len(index_html)!=2:
		print "%s not found" % container
		print "did nothing!"
		return
	
	for page in db.sql("select * from page", as_dict=1):
		html = index_html[0] + container +\
			'\n<!-- generated via pages.py -->' +\
			('\n<div class="content active" id="%s">' % page['name']) +\
			'\n' + page.get('html') +\
			(page.get('css') and '\n<style>\n%s\n</style>' % page['css'] or '') +\
			(page.get('js') and '\n<script>\n%s\n</script>' % page['js'] or '') +\
			'\n</div>\n' +\
			index_html[1]
		
		# title
		html = html.split('<title>')
		html = html[0] +\
			'<title>' + page.get('label', page.get('name')) + '</title>' +\
		 	html[1].split('</title>')[1]
		
		out = open(os.path.join(pages_path, page['name'] + '.html'), 'w')
		out.write(html)
		out.close()
		print "wrote %s %sk" % (page['name'] + '.html', len(html)/1024)

if __name__=='__main__':
	make()