const
  UNICODE_LETTER = /\p{L}/,
  LETTER = choice(UNICODE_LETTER, ':', '/', '_', '='),
  newline = '\n',
  terminator = choice(newline, ';', '\0');

module.exports = grammar({
  name: 'authzed',

  extras: ($) => [$.comment, $._whitespace],
  word: ($) => $.identifier,

  rules: {
    // source_file: ($) => $.body,
    source_file: ($) => seq(
      repeat(choice(
        seq($._statement, terminator),
      )),
    ),


    _statement: ($) => choice(
      $.relation,
      $.permission,
      $.caveat,
      $.block,
    ),

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

    caveat: ($) =>
      seq(
        'caveat',
        field('name', $.identifier),
        field('type_parameters', $.parameters_list),
        field('body', optional($.block)),
      ),

    parameters_list: ($) => seq(
      '(',
      optional(seq(
        commaSep(choice($.parameter_declaration, $.variadic_parameter_declaration)),
        optional(','),
      )),
      ')',
    ),

    parameter_declaration: ($) => prec.left(seq(
      commaSep(field('name', $.identifier)),
      field('type', $._type),
    )),

    _type: ($) => choice(
      $._simple_type,
      $.parenthesized_type,
    ),

    variadic_parameter_declaration: ($) => seq(
      field('name', optional($.identifier)),
      '...',
      field('type', $._type),
    ),

    perm_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.plus_literal, $.stabby))),

    rel_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.pipe_literal, $.hash_literal))),


    parenthesized_type: ($) => seq('(', $._type, ')'),


    _simple_type: (_) => choice(
      'any',
      'int',
      'uint',
      'bool',
      'string',
      'double',
      'bytes',
      'duration',
      'timestampt'),

    relation_literal: (_) => 'relation',
    permission_literal: (_) => 'permission',
    definition_literal: (_) => 'definition',
    caveat_literal: (_) => 'caveat',

    plus_literal: (_) => '+',
    pipe_literal: (_) => '|',
    slash_literal: (_) => '/',
    stabby: (_) => '->',
    block_start: (_) => '{',
    block_end: (_) => '}',
    equal_literal: (_) => '=',
    hash_literal: (_) => '#',
    paren_open: (_) => '(',
    paren_close: (_) => ')',

    identifier: (_) =>
      token(seq(LETTER, repeat(choice(LETTER, UNICODE_LETTER)))),

    comment: ($) =>
      token(
        choice(seq('//', /.*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
      ),

    _whitespace: ($) => token(/\s/),
  },
});


/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}


// body: ($) => repeat1(choice($.relation, $.permission, $.block, $.caveat)),
