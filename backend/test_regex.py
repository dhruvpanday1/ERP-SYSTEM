import re
sql = "```sql\nSELECT style_number, style_name FROM finished_goods;\n```"
sql = re.sub(r"^```(?:sql)?\s*", "", sql, flags=re.MULTILINE)
sql = re.sub(r"\s*```$", "", sql, flags=re.MULTILINE)
print(repr(sql))

sql2 = "```sql\nSELECT\nstyle_number FROM finished_goods```"
sql2 = re.sub(r"^```(?:sql)?\s*", "", sql2, flags=re.MULTILINE)
sql2 = re.sub(r"\s*```$", "", sql2, flags=re.MULTILINE)
print(repr(sql2))
