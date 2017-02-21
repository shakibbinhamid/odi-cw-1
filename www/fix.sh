sed -n '/^Total,,,,,,/p' Projects_CW1_MessedUp.csv | wc -l
grep -v "Total,,,,,," Projects_CW1_MessedUp.csv > removing_total.csv
grep "^,,,,," removing_total.csv | wc -l
grep -v "^,,,,,,," removing_total.csv > removing_empty.csv
sort removing_empty.csv | sort | uniq -d

if(value.split(",").length() > 1, value.split(",")[0] + value.split(",")[1], value.split(",")[0])
