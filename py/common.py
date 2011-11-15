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