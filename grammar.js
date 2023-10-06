const
  PREC = {
    primary: 7,
    unary: 6,
    multiplicative: 5,
    additive: 4,
    comparative: 3,
    and: 2,
    or: 1,
    composite_literal: -1,
  },

  UNICODE_LETTER = /\p{L}/,
  LETTER = choice(UNICODE_LETTER, ':', '/', '_', '='),
  multiplicativeOperators = ['*', '/', '%', '<<', '>>', '&', '&^'],
  additiveOperators = ['+', '-', '|', '^'],
  comparativeOperators = ['==', '!=', '<', '<=', '>', '>='],


  newline = '\n',
  terminator = choice(newline, ';', '\0'),

  hexDigit = /[0-9a-fA-F]/,
  octalDigit = /[0-7]/,
  decimalDigit = /[0-9]/,
  binaryDigit = /[01]/,

  hexDigits = seq(hexDigit, repeat(seq(optional('_'), hexDigit))),
  octalDigits = seq(octalDigit, repeat(seq(optional('_'), octalDigit))),
  decimalDigits = seq(decimalDigit, repeat(seq(optional('_'), decimalDigit))),
  binaryDigits = seq(binaryDigit, repeat(seq(optional('_'), binaryDigit))),

  hexLiteral = seq('0', choice('x', 'X'), optional('_'), hexDigits),
  octalLiteral = seq('0', optional(choice('o', 'O')), optional('_'), octalDigits),
  decimalLiteral = choice('0', seq(/[1-9]/, optional(seq(optional('_'), decimalDigits)))),
  binaryLiteral = seq('0', choice('b', 'B'), optional('_'), binaryDigits),

  intLiteral = choice(binaryLiteral, decimalLiteral, octalLiteral, hexLiteral),

  decimalExponent = seq(choice('e', 'E'), optional(choice('+', '-')), decimalDigits),
  decimalFloatLiteral = choice(
    seq(decimalDigits, '.', optional(decimalDigits), optional(decimalExponent)),
    seq(decimalDigits, decimalExponent),
    seq('.', decimalDigits, optional(decimalExponent)),
  ),

  hexExponent = seq(choice('p', 'P'), optional(choice('+', '-')), decimalDigits),
  hexMantissa = choice(
    seq(optional('_'), hexDigits, '.', optional(hexDigits)),
    seq(optional('_'), hexDigits),
    seq('.', hexDigits),
  ),
  hexFloatLiteral = seq('0', choice('x', 'X'), hexMantissa, hexExponent),

  floatLiteral = choice(decimalFloatLiteral, hexFloatLiteral),

  imaginaryLiteral = seq(choice(decimalDigits, intLiteral, floatLiteral), 'i');


module.exports = grammar({
  name: 'authzed',

  extras: ($) => [$.comment, $._whitespace],
  word: ($) => $.identifier,

  rules: {
    // source_file: ($) => $.body,
    source_file: ($) => seq(
      repeat(
        seq($._top_level_declaration, terminator),
      ),
    ),


    _top_level_declaration: ($) => choice(
      $.caveat,
      $.definition,
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


    block: ($) => seq(
      '{',
      optional(repeat(choice($.relation, $.permission))),
      '}',
    ),

    definition: ($) =>
      seq(
        $.definition_literal,
        field('name', repeat(choice($.slash_literal, $.identifier))),
        field('body', $.block),
      ),

    caveat: ($) =>
      seq(
        $.caveat_literal,
        field('name', $.identifier),
        field('type_parameters', $.parameters_list),
        field('body', optional($.block_c)),
      ),


    block_c: ($) => seq(
      '{',
      optional($._statement_list),
      '}',
    ),

    if_statement: ($) => seq(
      optional(seq(
        field('initializer', $._simple_statement),
        ';',
      )),
      field('condition', $._expression),
      field('consequence', $.block),
      optional(seq(
        'else',
        field('alternative', choice($.block, $.if_statement)),
      )),
    ),

    expression_statement: ($) => $._expression,

    _simple_statement: ($) => choice(
      $.expression_statement,
    ),

    expression_list: ($) => commaSep1($._expression),

    _expression: ($) => choice(
      $.binary_expression,
      $.call_expression,
      $.identifier,
      $._string_literal,
      $.int_literal,
      $.float_literal,
      $.imaginary_literal,
      $.nil,
      $.true,
      $.false,
      $.selector_expression,
      $.parenthesized_expression,
    ),

    int_literal: (_) => token(intLiteral),
    float_literal: (_) => token(floatLiteral),
    imaginary_literal: (_) => token(imaginaryLiteral),

    _field_identifier: ($) => alias($.identifier, $.field_identifier),

    _string_literal: ($) => choice(
      $.raw_string_literal,
      $.interpreted_string_literal,
    ),

    raw_string_literal: (_) => token(seq(
      '`',
      repeat(/[^`]/),
      '`',
    )),

    selector_expression: ($) => prec(PREC.primary, seq(
      field('operand', $._expression),
      '.',
      field('field', $._field_identifier),
    )),

    interpreted_string_literal: ($) => seq(
      '"',
      repeat(choice(
        $._interpreted_string_literal_basic_content,
        $.escape_sequence,
      )),
      token.immediate('"'),
    ),

    _interpreted_string_literal_basic_content: (_) => token.immediate(prec(1, /[^"\n\\]+/)),

    escape_sequence: (_) => token.immediate(seq(
      '\\',
      choice(
        /[^xuU]/,
        /\d{2,3}/,
        /x[0-9a-fA-F]{2,}/,
        /u[0-9a-fA-F]{4}/,
        /U[0-9a-fA-F]{8}/,
      ),
    )),


    parenthesized_expression: ($) => seq(
      '(',
      $._expression,
      ')',
    ),

    call_expression: ($) => prec(PREC.primary, choice(
      seq(
        field('function', $.identifier),
        field('arguments', alias($.special_argument_list, $.argument_list)),
      ),
      seq(
        field('function', $._expression),
        field('type_arguments', optional($.type_arguments)),
        field('arguments', $.argument_list),
      ),
    )),

    argument_list: ($) => seq(
      '(',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression)),
        optional(','),
      )),
      ')',
    ),

    special_argument_list: ($) => seq(
      '(',
      $._type,
      repeat(seq(',', $._expression)),
      optional(','),
      ')',
    ),


    type_arguments: ($) => prec.dynamic(2, seq(
      '[',
      commaSep1($._type),
      optional(','),
      ']',
    )),


    binary_expression: ($) => {
      const table = [
        [PREC.multiplicative, choice(...multiplicativeOperators)],
        [PREC.additive, choice(...additiveOperators)],
        [PREC.comparative, choice(...comparativeOperators)],
        [PREC.and, '&&'],
        [PREC.or, '||'],
      ];

      return choice(...table.map(([precedence, operator]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $._expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $._expression),
        )),
      ));
    },

    _statement: ($) => $._simple_statement,

    _statement_list: ($) => choice(
      seq(
        $._statement,
        repeat(seq(terminator, $._statement)),
        optional(seq(
          terminator,
          optional(alias($.empty_labeled_statement, $.labeled_statement)),
        )),
      ),
      alias($.empty_labeled_statement, $.labeled_statement),
    ),

    empty_labeled_statement: ($) => seq(
      field('label', alias($.identifier, $.label_name)),
      ':',
    ),

    parameters_list: ($) => seq(
      '(',
      optional(seq(
        commaSep($.parameter_declaration),
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
      prec.right(repeat1(choice($.identifier, $.plus_literal, $.minus_literal, $.amp_literal, $.stabby, $.parenthesized_perm_expression))),

    parenthesized_perm_expression: ($) =>
      seq('(', $.perm_expression, ')'),

    rel_expression: ($) =>
      prec.right(repeat1(choice($.identifier, $.pipe_literal, $.hash_literal, $.wildcard_literal))),


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


    nil: (_) => 'nil',
    true: (_) => 'true',
    false: (_) => 'false',

    relation_literal: (_) => 'relation',
    permission_literal: (_) => 'permission',
    definition_literal: (_) => 'definition',
    caveat_literal: (_) => 'caveat',

    plus_literal: (_) => '+',
    minus_literal: (_) => '-',
    amp_literal: (_) => '&',
    pipe_literal: (_) => '|',
    slash_literal: (_) => '/',
    stabby: (_) => '->',
    block_start: (_) => '{',
    block_end: (_) => '}',
    equal_literal: (_) => '=',
    hash_literal: (_) => '#',
    paren_open: (_) => '(',
    paren_close: (_) => ')',
    wildcard_literal: (_) => '*',

    identifier: (_) =>
      token(seq(LETTER, repeat(choice(LETTER, UNICODE_LETTER)))),

    comment: (_) =>
      token(
        choice(seq('//', /.*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
      ),

    _whitespace: (_) => token(/\s/),
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
