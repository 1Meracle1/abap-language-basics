TYPES:
  BEGIN OF ty_row,
    id TYPE i,
    text TYPE string,
  END OF ty_row.
TYPES ty_rows TYPE STANDARD TABLE OF ty_row
  WITH NON-UNIQUE SORTED KEY by_id COMPONENTS id
  WITH NON-UNIQUE SORTED KEY by_text COMPONENTS text.
TYPES:
  BEGIN OF ty_group,
    id TYPE i,
    rows TYPE ty_rows,
  END OF ty_group.
TYPES ty_groups TYPE STANDARD TABLE OF ty_group WITH EMPTY KEY.

DATA lt_rows TYPE ty_rows.
DATA lt_groups TYPE ty_groups.
DATA lv_key TYPE string VALUE `BY_ID`.
DATA lv_component TYPE string VALUE `ID`.

INTERFACE zif_worker.
  METHODS preferred.
ENDINTERFACE.

CLASS lcl_worker DEFINITION.
  PUBLIC SECTION.
    INTERFACES zif_worker.
  PRIVATE SECTION.
    METHODS handler.
ENDCLASS.

CLASS lcl_worker IMPLEMENTATION.
  METHOD handler.
    me->handler( ).
  ENDMETHOD.

  METHOD zif_worker~preferred.
    zif_worker~preferred( ).
  ENDMETHOD.
ENDCLASS.

DATA(ls_named) = lt_rows[ KEY by_id COMPONENTS id = 1 ].
DATA(ls_dynamic) = lt_rows[ KEY (lv_key) COMPONENTS
  (lv_component) = 1 ].
DATA(ls_indexed) = lt_rows[ KEY by_text INDEX 1 ].
DATA(lv_text) = lt_rows[ id = 1 ]-text.
DATA(lv_nested) = lt_groups[ id = 1 ]-rows[ id = 2 ]-text.
DATA(lv_exists) = xsdbool( line_exists( lt_rows[ id = 1 ] ) ).

DATA(lr_row) = REF #( lt_rows[ 1 ] ).
DATA(lv_id) = lr_row->*-id.
DATA(lo_type) = cl_abap_typedescr=>describe_by_data( lv_text ).

DATA:
  BEGIN OF ls_keywords,
    !select TYPE string,
    !default TYPE string,
  END OF ls_keywords.
ls_keywords-select = ls_keywords-default.
