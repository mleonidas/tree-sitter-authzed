module.exports = grammar({
  name: "authzed",

  extras: ($) => [$.comment, $._whitespace],

  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) => $.body,
    body: ($) => repeat1(choice($.relation, $.permission, $.block)),

    relation: ($) =>
      seq($.relation_literal, $.identifier, ":", $.perm_expression),

    permission: ($) =>
      seq($.permission_literal, $.identifier, "=", $.rel_expression),

    block: ($) =>
      seq(
        $.identifier,
        repeat(choice($.slash_literal, $.identifier)),
        $.block_start,
        optional($.body),
        $.block_end
      ),

    perm_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.pipe_literal))),

    rel_expression: ($) =>
      prec.right(
        repeat1(choice($.identifier, $.plus_literal, $.identifier_with_parent))
      ),

    relation_literal: ($) => "relation",

    permission_literal: ($) => "permission",

    plus_literal: ($) => "+",
    pipe_literal: ($) => "|",
    slash_literal: ($) => "/",
    block_start: ($) => "{",
    block_end: ($) => "}",

    identifier: ($) =>
      token(
        seq(choice(/\p{ID_Start}/, "/"), repeat(choice(/\p{ID_Continue}/, "/")))
      ),

    identifier_with_parent: ($) =>
      token(
        seq(
          choice(/\p{ID_Start}/, "/"),
          repeat(choice(/\p{ID_Continue}/, "->"))
        )
      ),

    comment: ($) =>
      token(
        choice(
          seq("#", /.*/),
          seq("//", /.*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")
        )
      ),

    _whitespace: ($) => token(/\s/),
  },
});
