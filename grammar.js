const UNICODE_LETTER = /\p{L}/, LETTER = choice(UNICODE_LETTER, ':', '/', '_', '=');

module.exports = grammar({
  name: 'authzed',

  extras: ($) => [$.comment, $._whitespace],
  word: ($) => $.identifier,

  rules: {
    source_file: ($) => $.body,
    body: ($) => repeat1(choice($.relation, $.permission, $.block)),

    relation: ($) =>
      seq(
        field('relation', $.relation_literal),
        field('relation_name', $.identifier),
        field('relation_expression', $.rel_expression),
      ),

    permission: ($) =>
      seq(
        field('permission', $.permission_literal),
        field('param_name', $.identifier),
        field('permission_expresssion', $.perm_expression),
      ),

    block: ($) =>
      seq(
        $.identifier,
        repeat(choice($.slash_literal, $.identifier)),
        $.block_start,
        optional(repeat(choice($.relation, $.permission))),
        $.block_end,
      ),

    perm_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.plus_literal, $.stabby))),

    rel_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.pipe_literal, $.hash_literal))),

    relation_literal: ($) => 'relation',
    permission_literal: ($) => 'permission',
    definition_literal: ($) => 'definition',

    plus_literal: ($) => '+',
    pipe_literal: ($) => '|',
    slash_literal: ($) => '/',
    stabby: ($) => '->',
    block_start: ($) => '{',
    block_end: ($) => '}',
    equal_literal: ($) => '=',
    hash_literal: ($) => '#',

    identifier: ($) =>
      token(seq(LETTER, repeat(choice(LETTER, UNICODE_LETTER)))),

    comment: ($) =>
      token(
        choice(seq('//', /.*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
      ),

    _whitespace: ($) => token(/\s/),
  },
});
