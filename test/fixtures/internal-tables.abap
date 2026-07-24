TYPES:
  BEGIN OF ty_row,
    id TYPE i,
    text TYPE string,
  END OF ty_row.
TYPES ty_rows TYPE STANDARD TABLE OF ty_row
  WITH NON-UNIQUE SORTED KEY by_id COMPONENTS id
  WITH NON-UNIQUE SORTED KEY by_text COMPONENTS text.

DATA lt_rows TYPE ty_rows.
DATA lt_more TYPE ty_rows.
DATA ls_row TYPE ty_row.
DATA lr_row TYPE REF TO ty_row.

READ TABLE lt_rows WITH TABLE KEY by_id COMPONENTS id = 1
  TRANSPORTING NO FIELDS.
READ TABLE lt_rows WITH KEY text = `one`
  BINARY SEARCH
  INTO DATA(ls_first).
READ TABLE lt_rows INDEX 1
  USING KEY by_text
  REFERENCE INTO lr_row.

APPEND INITIAL LINE TO lt_rows ASSIGNING FIELD-SYMBOL(<ls_row>).
<ls_row>-id = 1.
<ls_row>-text = `one`.
APPEND LINES OF lt_more TO lt_rows.
INSERT LINES OF lt_more INTO TABLE lt_rows.
INSERT VALUE ty_row( id = 2 text = `two` ) INTO lt_rows INDEX 1.
MODIFY lt_rows FROM ls_row INDEX 1 TRANSPORTING text.
MODIFY lt_rows FROM ls_row USING KEY by_text TRANSPORTING id
  WHERE text = `one`.
DELETE lt_rows INDEX 1 USING KEY by_text.
DELETE ADJACENT DUPLICATES FROM lt_rows COMPARING id text.
SORT lt_rows BY text ASCENDING id DESCENDING.
COLLECT VALUE ty_row( id = 3 text = `three` ) INTO lt_rows.
DESCRIBE TABLE lt_rows LINES DATA(lv_lines).

LOOP AT lt_rows USING KEY by_text INTO DATA(ls_current)
  WHERE id > 0.
  ls_row = ls_current.
ENDLOOP.

LOOP AT lt_rows INTO DATA(ls_group_source)
  GROUP BY ls_group_source-id INTO DATA(group_id).
  LOOP AT GROUP group_id INTO DATA(ls_group_member)
    WHERE text IS NOT INITIAL.
    ls_row = ls_group_member.
  ENDLOOP.
ENDLOOP.

DATA(lt_selected) = VALUE ty_rows(
  FOR ls_source IN lt_more WHERE ( id > 0 )
  ( ls_source )
).

CALL FUNCTION 'Z_PROCESS_ROWS'
  TABLES
    it_rows = lt_rows
  EXCEPTIONS
    OTHERS = 1.

DATA(lv_text_literal) = 'Don''t'.
DATA(lv_string_literal) = `Use `` inside`.
DATA lv_large_number TYPE p LENGTH 16
  VALUE 9999999999999999999999999999999.
DATA(lv_decimal_text) = '-123.45E+6'.
