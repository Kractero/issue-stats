import os
import json

directory = 'json' 
files = [file for file in os.listdir(directory) if os.path.isfile(os.path.join(directory, file))]

titles = []
for file in files:
    file_path = os.path.join(directory, file)
    with open(file_path) as json_file:
        data = json.load(json_file)
        for key, obj in data.items():
            title = obj.get('title')
            options = obj.get('options', {})
            
            results = set()

            for option in options.values():
                text = option.get('text')
                effect = option.get('effects')
                result = option.get('results')

                if not text or not effect or not result:
                    titles.append({
                        "number": key,
                        "title": title,
                        "issue": "missing value"
                    })
                    break

                if "unknown effect" not in result and "Easter Egg" not in title:
                    results.add(result)

print(len(titles))
with open("problems_v2.json", 'w') as json_file:
    json.dump(titles, json_file)