" Composite keywords recognized by the parser and grammar.
AUTHORITY-CHECK BIT-AND BIT-OR BIT-XOR BREAK-POINT BYTE-ORDER CUSTOMER-FUNCTION EXIT-COMMAND LINE-SELECTION LIST-PROCESSING NO-GAPS PF-STATUS SAP-SPOOL SELECTION-SET SELECTION-SETS SELECTION-TABLE.
CLASS-DATA CLASS-EVENTS CLASS-METHODS.
END-ENHANCEMENT-SECTION END-OF-DEFINITION END-OF-PAGE.
END-OF-SELECTION END-TEST-INJECTION END-TEST-SEAM.
ENHANCEMENT-SECTION EXCEPTION-TABLE FIELD-GROUPS FIELD-SYMBOLS.
FUNCTION-POOL HELP-REQUEST LINE-COUNT LINE-SIZE LOAD-OF-PROGRAM.
LOG-POINT MESSAGE-ID MOVE-CORRESPONDING NEW-LINE NEW-PAGE.
NO-DISPLAY NO-EXTENSION NON-UNIQUE PARAMETER-TABLE READ-ONLY.
SELECT-OPTIONS SELECTION-SCREEN START-OF-SELECTION SYSTEM-EXCEPTIONS.
TEST-INJECTION TEST-SEAM TOP-OF-PAGE TYPE-POOLS USER-COMMAND VALUE-REQUEST.

" Executable report and selection-screen declarations and events.
REPORT z_highlighting_demo LINE-SIZE 120 LINE-COUNT 60 MESSAGE-ID zmsg.
DATA gv_button TYPE string.

SELECTION-SCREEN BEGIN OF BLOCK b_main WITH FRAME TITLE text-t01.
PARAMETERS p_check AS CHECKBOX USER-COMMAND refresh MODIF ID main.
PARAMETERS p_mode_a RADIOBUTTON GROUP mode DEFAULT 'X'.
PARAMETERS p_mode_b RADIOBUTTON GROUP mode.
SELECT-OPTIONS s_carrid FOR scarr-carrid OBLIGATORY NO-EXTENSION.
SELECTION-SCREEN BEGIN OF LINE.
SELECTION-SCREEN COMMENT 1(20) text-c01 FOR FIELD p_check.
SELECTION-SCREEN POSITION 25.
SELECTION-SCREEN PUSHBUTTON 25(20) gv_button USER-COMMAND choose.
SELECTION-SCREEN END OF LINE.
SELECTION-SCREEN END OF BLOCK b_main.

INITIALIZATION.
  gv_button = `Choose`.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN.
  ENDLOOP.

AT SELECTION-SCREEN ON BLOCK b_main.
  CHECK p_check IS NOT INITIAL.

START-OF-SELECTION.
  WRITE / gv_button.

" Keywords inside selectors and qualified names must remain identifiers.
IF sy-subrc = 0 AND ls_row-field IS NOT INITIAL.
  lo_object->method( ).
  zif_interface~method( ).
ENDIF.

" String, template, comment, number, and declaration-name scopes.
DATA lv_text TYPE string VALUE 'IF CLASS-METHODS sy-subrc'. " trailing comment
DATA lv_raw TYPE string VALUE `LOOP ENDLOOP`.
DATA(lv_template) = |Value: { lv_text WIDTH = 20 }|.
CONSTANTS lc_number TYPE i VALUE 42.
FIELD-SYMBOLS <ls_row> TYPE any.

INTERFACE lif_example.
  METHODS run.
ENDINTERFACE.

INTERFACE lif_worker.
  METHODS run
    IMPORTING iv_input TYPE string
    RETURNING VALUE(rv_output) TYPE string
    RAISING cx_static_check.
  EVENTS finished EXPORTING VALUE(ev_output) TYPE string.
ENDINTERFACE.

CLASS lcl_factory DEFINITION DEFERRED.
CLASS lcl_worker DEFINITION FINAL CREATE PRIVATE FRIENDS lcl_factory.
  PUBLIC SECTION.
    INTERFACES lif_worker.
    ALIASES run FOR lif_worker~run.
    CLASS-METHODS create
      RETURNING VALUE(ro_worker) TYPE REF TO lcl_worker.
  PRIVATE SECTION.
    TYPES ty_numbers TYPE STANDARD TABLE OF i WITH EMPTY KEY.
    TYPES:
      BEGIN OF ty_source,
        name TYPE string,
      END OF ty_source,
      BEGIN OF ty_target,
        text TYPE string,
      END OF ty_target.
    CLASS-DATA gv_instances TYPE i READ-ONLY.
    METHODS constructor.
ENDCLASS.

FORM perform_action.
  CASE sy-subrc.
    WHEN 0.
    WHEN OTHERS.
  ENDCASE.
ENDFORM.

FUNCTION z_example.
  TRY.
      DO 2 TIMES.
      ENDDO.
    CATCH cx_root.
  ENDTRY.
ENDFUNCTION.

MODULE status_0100 OUTPUT.
  WHILE sy-index < 2.
  ENDWHILE.
ENDMODULE.

CLASS lcl_example DEFINITION.
  PUBLIC SECTION.
    METHODS run.
ENDCLASS.

SELECT carrid FROM scarr INTO @DATA(lv_carrid).
ENDSELECT.

CLASS lcl_example IMPLEMENTATION.
  METHOD run.
    IF sy-subrc = 0.
      LOOP AT lt_rows ASSIGNING FIELD-SYMBOL(<ls_row>).
      ENDLOOP.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_worker IMPLEMENTATION.
  METHOD lif_worker~run.
    DATA(lt_numbers) = VALUE ty_numbers( ( 1 ) ( 2 ) ).
    DATA(lt_more) = VALUE ty_numbers( BASE lt_numbers ( 3 ) ).
    DATA(lt_filtered) = FILTER #( lt_more WHERE table_line > 1 ).
    DATA(ls_source) = VALUE ty_source( name = iv_input ).
    DATA(ls_target) = CORRESPONDING ty_target(
      ls_source MAPPING text = name
    ).
    DATA(lv_total) = REDUCE i(
      INIT total = 0
      FOR number IN lt_filtered
      NEXT total = total + number
    ).
    DATA(lv_text) = CONV string( lv_total ).
    DATA(lv_exact) = EXACT i( lv_text ).
    DATA(lv_result) = COND string(
      LET normalized = to_upper( iv_input ) IN
      WHEN normalized IS INITIAL THEN `empty`
      ELSE normalized
    ).
    rv_output = SWITCH string(
      lv_result
      WHEN `EMPTY` THEN `none`
      ELSE lv_result
    ).
    DATA(lr_output) = REF #( rv_output ).
    DATA(lo_type) = CAST cl_abap_elemdescr(
      cl_abap_typedescr=>describe_by_data( rv_output )
    ).
    RAISE EVENT lif_worker~finished EXPORTING ev_output = rv_output.
  ENDMETHOD.

  METHOD create.
    ro_worker = NEW lcl_worker( ).
  ENDMETHOD.

  METHOD constructor.
    gv_instances = gv_instances + 1.
  ENDMETHOD.
ENDCLASS.
