DATA lv_text TYPE string VALUE `Abap`.
DATA lv_amount TYPE decfloat34 VALUE '1234.50'.
DATA lv_date TYPE d VALUE '20260716'.
DATA lv_time TYPE t VALUE '180500'.
DATA lv_timestamp TYPE timestampl VALUE '20260716180500.0000000'.
DATA lv_alignment TYPE c LENGTH 1 VALUE cl_abap_format=>a_center.
DATA lv_timezone TYPE timezone VALUE 'UTC'.

DATA(lv_escapes) = |pipe: \| braces: \{ \} slash: \\ controls: \n\r\t|.
DATA(lv_path) = |C:\\|.
DATA(lv_nested) = |Outer { |Nested { lv_text }| CASE = UPPER }|.

DATA(lv_aligned) = |{ lv_text
  WIDTH = 20 ALIGN = RIGHT PAD = `0` CASE = UPPER }|.
DATA(lv_number) = |{ lv_amount SIGN = LEFTPLUS DECIMALS = 2
  ZERO = YES NUMBER = USER CURRENCY = 'GBP' }|.
DATA(lv_scientific) = |{ lv_amount STYLE = SCIENTIFIC
  EXPONENT = 0 DECIMALS = 2 NUMBER = RAW }|.
DATA(lv_xml) = |{ lv_text XSD = NO }|.
DATA(lv_alpha) = |{ lv_text ALPHA = OUT WIDTH = 18 }|.
DATA(lv_date_text) = |{ lv_date DATE = ISO }|.
DATA(lv_country_date) = |{ lv_date COUNTRY = 'GB ' }|.
DATA(lv_time_text) = |{ lv_time TIME = ENVIRONMENT }|.
DATA(lv_timestamp_text) = |{ lv_timestamp TIMESTAMP = ISO
  TIMEZONE = lv_timezone }|.
DATA(lv_dynamic) = |{ lv_text WIDTH = 30 ALIGN = (lv_alignment) }|.
