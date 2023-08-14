# Issue Stat Grabber

My TamperMonkey script that gets issue stats and puts them on your issues page.

## Usage
[Add the script](https://github.com/Kractero/issue-stats/raw/main/issueStatGetter.user.js) to Tampermonkey.

If you want to build your own issues_list.json, make sure you have Python on your system (I manually fixed a ton so this might not be identical)

```
git clone https://github.com/Kractero/issue-stats.git
pip install -r requirements.txt
python generate_json.py
```

---

## Known Issues

Please file an issue if you run into any bugs, because there will be bugs.

A select few issues may be wrong, this is because I am relying on multiple parties to have their data correct, these being MWQ and the Valentine Z megathread. I manually fixed most of the problematic ones.

The recent changes to issues for athieism vs religiousness resulted in many changes to issues but I ignored most of them, as the choice variation still results in the same stat changes.

Some stats may be stale (miniscule amount tbh), as MWQ's mean stats change very often and this is essentially a snapshot of MWQ.

---

![Issue Result Sample](/public/Issue%20Result.png)

## Features

1. See MWQ results directly on your issue pages, no more hopping between tabs or windows.
2. Select the categories relevant to the nation you are in, and store each nation's configuration in local storage.
3. Quickly toggle all, one percent, five percent, ten percent, and unranked badges with one button.
4. See your exact badge icons alongside the results and regenerate them if they are out of date with one click.

![Filter](/public/Filter.png)

---

## Legality
The script should be legal, it makes api calls with a user-agent client-side.

--- 

## Contributing
Contributions are welcome, especially to the json generation script. Just make a PR.

---

### Dev Notes
I care about the stats on a select few of my puppets, and I became tired of flipping through MWQ and NSIndex for issues to pick the right choice, sometimes even tanking stats because of mismatching the numbers and the actual issue choice. I then had the idea to make a TamperMonkey script that would inject MWQ results onto the issues page.

Initially, this was to be an edge function route (mainly for personal use), and this was because of CORS, which would prevent me from getting both NSIndex and MWQ data. It would then scrape MWQ Issue results (a data repository by Trotterdam) and NSIndex (a now read-only wiki by Minoa), and would use the two to map the issue choices presented by a nation to the issue choices from NSIndex and effect lines and results from MWQ. This worked relatively well and can be seen in earlier commits and most of the current code is adjusted from this era.

Sherpdawerp made me aware of an unfinished python script they made that would generate a json based off the issue megathread. I was aware of the issue megathread but it did not seem easy to map its large and inconsistently formatted issues to MWQ, but using their script as a springboard, I finished it and made it more robust to account for megathread edgecases and added the MWQ feature that was yet to be added. I then installed these jsons in place of NSIndex and MWQ and continued to use the edge solution. I added fastify around this time so people could potentially self host it.

I then realized that since the only fetch calls left were to github's raw.githubusercontent.com domain and nationstates itself, I was probably not going to run into any cors, so there was no point in having any api route at all. I then merged all the function into the TamperMonkey script, and that is where it is today.

Most of the core function is the same as when I was still scraping NSIndex and MWQ data, but this was an interesting journey and I have to thank Sherpdawerp for making me aware of their script.

### To Do:
Export local host stuff to local file so not all is lost after clearing browser data.
