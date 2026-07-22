REPORT z_operand_keywords.

DATA:
  a TYPE string,
  b TYPE string,
  component TYPE string,
  color TYPE i,
  handle TYPE REF TO object,
  number TYPE btcjobcnt,
  reset TYPE abap_bool,
  user TYPE syuname.

CREATE OBJECT handle AREA HANDLE handle.

CREATE OBJECT handle
  EXPORTING
    iv_value = a.

IF a EQ b OR a NE b
   OR a LT b OR a LE b
   OR a GT b OR a GE b
   OR a CO b OR a CN b
   OR a CA b OR a NA b
   OR a CS b OR a NS b
   OR a CP b OR a NP b.
ENDIF.

ASSIGN COMPONENT 'READ_POINT-ID' OF STRUCTURE a
       TO FIELD-SYMBOL(<component>).
ASSIGN a INCREMENT 1 TO <component> RANGE a.

FORMAT COLOR COL_HEADING
       INTENSIFIED ON INVERSE OFF HOTSPOT ON INPUT OFF FRAMES ON.
FORMAT RESET.

SUBMIT (a)
       USER user
       VIA JOB b NUMBER number
       WITH component IN component
       WITH color = color
       AND RETURN.
