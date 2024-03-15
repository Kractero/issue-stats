import json
import requests
import re
import time
from lxml import etree

BASE_REPO_URL = "https://raw.githubusercontent.com/Clarissa-Valentine-Z/NationStates-Issue-Megathread/master/002%20-%20Issue%20Megalist%20(MAIN)/"
EFFECTS_URL = "http://www.mwq.dds.nl/ns/results/"

with open("./repo_files.txt", "r") as f:
	filenames = f.read().split("\n")

parsed = {
    "issues": { }
}

counter = 0

for filename in filenames:
    text = requests.get(f'{BASE_REPO_URL}{filename}').text
    text = re.sub(r"\r\n", "\n", text)
    issues = re.split(r"\n[\-]+ ?\n", text)
    
    for issue in issues:
            options = {}
            effects = {}
            
            issue = re.sub(r"\[(\d+)\]", r"\g<1>", issue) # replace [#] options with just the number
            issue = re.sub(r"\*+(\d+)", r"\g<1>", issue) # replace *# options with just the number
            issue = re.sub(r"\[\[.+?\]\]", "", issue) # remove [[color]validites[/color]]
            issue = re.sub(r"[\[\}].*?[\]\}]", "", issue) # remove [bbcode] and {notes}
            
            s = re.search(r"#(\d+)[\:\;\,][ ](.+?)[\s+]\n", issue); # search for #num: title
            if s is None:
                if issue.startswith("#1579"):
                    break
                raise RuntimeError()
            else:
                num = s.group(1)
                title = s.group(2)
            start_index = issue.find("The Debate")
            substring = issue[start_index + len("The Debate"):].strip()
            if start_index < 0:
                if re.search(r"The Debate[:]{0,1}[ ]{0,1}\n", issue) is not None: # handle no options
                    raise RuntimeError()
            else:
                lines = []
                for i in substring.split('\n'):
                    # doing it this way fixes like a few issues like #70 in the megathread,
                    # where same choice is formatted as 1 & 2
                    if i != "" and ('. ' in i or '.' in i):
                        if '. ' in i:
                            ides = i.split('. ', 1)[0]
                            ides = ides.replace(" ", "")
                            match = re.search(r"\d+", ides)
                            if match:
                                lines.append(i.split('. ', 1)[1])
                                remaining_string = ides[match.end():]
                                second_match = re.search(r"\d+", remaining_string)
                                if second_match:
                                    lines.append(i.split('. ', 1)[1])
                        else:
                            ides = i.split('.', 1)[0]
                            ides = ides.replace(" ", "")
                            match = re.search(r"\d+", ides)
                            if match:
                                lines.append(i.split('. ', 1)[1])
                                remaining_string = ides[match.end():]
                                second_match = re.search(r"\d+", remaining_string)
                                if second_match:
                                    lines.append(i.split('. ', 1)[1])
                for count, line in enumerate(lines, start=1):
                    options[str(count)] = {
                        "text": line,
                    }

            effects = requests.get(f'{EFFECTS_URL}{str(num)}.html').text
            mwq_document = etree.HTML(effects)
            mwq_options = mwq_document.xpath('//tr/td[1]')
            mwq_results = mwq_document.xpath('//tr/td[2]')
            mwq_options_text = []
            mwq_results_text = []
            pattern = r'\d+/\d+\.'
            for count, result in enumerate(mwq_options):
                if result.xpath('.//small'):
                    result.xpath('.//small')[0].clear()

                option_text = etree.tostring(result, method='text', encoding='unicode').strip()
                result_text = etree.tostring(mwq_results[count], method='text', encoding='unicode').strip()
                if re.search(pattern, option_text):
                    tester = option_text.find('.')
                    testy_tester = option_text[0:tester].split('/')
                    mwq_options_text.append(testy_tester[0] + option_text[tester:])
                    mwq_options_text.append(testy_tester[1] + option_text[tester:])
                    mwq_results_text.append(result_text)
                    mwq_results_text.append(result_text)
                else:
                    mwq_options_text.append(option_text)
                    mwq_results_text.append(result_text)
            for count, effect in enumerate(mwq_options_text):
                issue_num = effect.split('. ', 1)
                key_num = issue_num[0]
                issue_text = issue_num[1]
                if key_num not in options:
                    options[key_num] = {"text": ""}
                options[key_num]["effects"] = issue_text
                options[key_num]["results"] = mwq_results_text[count]
            parsed["issues"][num] = {
                "title": title,
                "options": options,
            }

            counter += 1

            if counter == 100:
                with open(f"./{int(num)-99}-{num}.json", "w") as f:
                    parsed = parsed["issues"]
                    json.dump(parsed, f, indent=4)
                parsed = {
                    "issues": { }
                }
                counter = 0
with open("./issues_list.json", "w") as f:
    f.write(str(json.dumps(parsed, indent=4, sort_keys=False)))