((identifier) @function)

(block
  (relation
    (relation_literal) @function
     (identifier) @property))

(block
  (permission
    (permission_literal) @function
     (identifier) @property))


((permission_literal) @variable.builtin)

(permission (identifier) @type)
(relation (identifier) @constant)
(perm_expression (identifier) @property)



((plus_literal) @punctuation)
((hash_literal) @comment)

; relations
((relation_literal) @function)
(rel_expression (identifier) @property)


((pipe_literal) @punctuation)

(relation
  (rel_expression
    (
  (hash_literal)
  .
  (identifier) @constant
  ) @coment))

(call_expression
  (selector_expression
    (identifier) @constant))

(call_expression
  function: (selector_expression
    field: (field_identifier) @function.method))


(permission
 (perm_expression
   (
    (stabby)
    .
    (identifier)
    @function) @punctuation))


[
  (true)
  (false)
  (nil)
] @constant.builtin

[
 "caveat"
 "definition"
] @keyword


((comment) @comment)
