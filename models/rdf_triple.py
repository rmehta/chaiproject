"""
maintain list of parent-child relation
"""

from lib.chai import model

class RDFTriple(model.Model):
	_name = 'rdf_triple'
	_create_table = """create table rdf_triple (
		`subject` varchar(240) not null,
		`predicate` varchar(240) not null,
		`object` varchar(240) not null,
		index `s_p`(`subject`, `predicate`),
		index `p_o`(`predicate`, `object`),
		unique key `s_p_o`(`subject`, `predicate`, `object`)
	) engine = InnoDB
	"""

