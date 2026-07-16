DATA lv_carrid TYPE scarr-carrid VALUE 'LH'.
DATA lv_table TYPE string VALUE 'SCARR'.
DATA lv_where TYPE string VALUE `carrid = @lv_carrid`.
DATA lv_fields TYPE string VALUE `carrid`.
DATA lv_set TYPE string VALUE `carrname = @lv_carrname`.
DATA lt_carrids TYPE STANDARD TABLE OF scarr-carrid WITH EMPTY KEY.
DATA ls_stats TYPE zflight_stats.
DATA lt_stats TYPE STANDARD TABLE OF zflight_stats WITH EMPTY KEY.

SELECT SINGLE carrname
  FROM scarr
  WHERE carrid = @lv_carrid
  INTO @DATA(lv_carrname)
  BYPASSING BUFFER.

SELECT FROM scarr AS carrier
  LEFT OUTER JOIN spfli AS connection
    ON connection~carrid = carrier~carrid
  FIELDS carrier~carrid,
         COALESCE( connection~cityfrom, connection~cityto ) AS city,
         CASE WHEN connection~distance > 0
              THEN DIVISION( connection~distance, 100, 2 )
              ELSE 0
         END AS distance_hundreds
  FOR ALL ENTRIES IN @lt_carrids
  WHERE carrier~carrid = @lt_carrids-table_line
    AND connection~cityfrom LIKE 'L%'
  GROUP BY carrier~carrid, connection~cityfrom, connection~cityto,
           connection~distance
  HAVING COUNT( * ) > 0
  UNION DISTINCT
  SELECT FROM scarr AS other
    FIELDS other~carrid, other~carrname, 0
  ORDER BY carrid ASCENDING
  INTO TABLE @DATA(lt_carriers)
  UP TO 100 ROWS.

SELECT (lv_fields)
  FROM (lv_table)
  WHERE (lv_where)
  APPENDING CORRESPONDING FIELDS OF TABLE @lt_carriers
  PACKAGE SIZE 20.

INSERT INTO zflight_stats VALUES @ls_stats.
INSERT zflight_stats FROM TABLE @lt_stats
  ACCEPTING DUPLICATE KEYS.
INSERT zflight_stats FROM
  SELECT FROM sflight
    FIELDS carrid, connid, COUNT( * ).

UPDATE (lv_table)
  SET (lv_set)
  WHERE (lv_where).
MODIFY zflight_stats FROM TABLE @lt_stats.
DELETE FROM zflight_stats WHERE carrid = @lv_carrid.
