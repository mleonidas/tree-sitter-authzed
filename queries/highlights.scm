; highlights.scm
((identifier) @keyword
 (#match? @keyword "^(definition|permission|relation)$"))

((permission_literal) @function)
((relation_literal) @function)

(permission (identifier) @type)
(relation (identifier) @constant)
(perm_expression (identifier) @property)
(rel_expression (identifier) @property)
((block_start) @punctuation)
((block_end) @punctuation)
(block (identifier) (identifier) @constructor)
((plus_literal) @punctuation)
