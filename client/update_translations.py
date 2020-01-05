# you just need Pandas and Python 3
import pandas as pd

df = pd.read_csv('https://docs.google.com/spreadsheets/u/0/d/16egSOjgZcFjY4vWNZ5QeTGXdj5z0c8fZ43IpwrPGmS8/export?format=csv&id=16egSOjgZcFjY4vWNZ5QeTGXdj5z0c8fZ43IpwrPGmS8&gid=0',
                 index_col='field')
# export to json
for lang in ['fr', 'en']:
    df[lang].to_json("public/locales/{}/translation.json".format(lang), force_ascii=False)
