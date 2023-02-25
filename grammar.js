const UNICODE_LETTER = /\p{L}/;
const LETTER = choice(UNICODE_LETTER, ":", "/", "_", "=", "->");

module.exports = grammar({
  name: "authzed",

  extras: ($) => [$.comment, $._whitespace],
  word: ($) => $.identifier,

  rules: {
    source_file: ($) => $.body,
    body: ($) => repeat1(choice($.relation, $.permission, $.block)),

    relation: ($) => seq($.relation_literal, $.identifier, $.rel_expression),
    permission: ($) =>
      seq($.permission_literal, $.identifier, $.perm_expression),

    // permission: ($) =>
    //   seq(
    //     "permission",
    //     field("perm_name", $.identifier),
    //     field("equal", "="),
    //     field("relation_expression", $.rel_expression)
    //   ),

    block: ($) =>
      seq(
        $.identifier,
        repeat(choice($.slash_literal, $.identifier)),
        $.block_start,
        optional($.body),
        $.block_end
      ),

    perm_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.plus_literal))),

    rel_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.pipe_literal))),

    relation_literal: ($) => "relation",

    permission_literal: ($) => "permission",
    definition_literal: ($) => "definition",

    plus_literal: ($) => "+",
    pipe_literal: ($) => "|",
    slash_literal: ($) => "/",
    block_start: ($) => "{",
    block_end: ($) => "}",
    equal_literal: ($) => "=",

    identifier: ($) =>
      token(seq(LETTER, repeat(choice(LETTER, UNICODE_LETTER)))),

    identifier_with_parent: ($) =>
      token(
        seq(
          choice(/\p{ID_Start}/, "/"),
          repeat(choice(/\p{ID_Continue}/, "->"))
        )
      ),

    comment: ($) =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"))
      ),

    _whitespace: ($) => token(/\s/),
  },
});
