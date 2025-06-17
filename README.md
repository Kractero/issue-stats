# Issue Stat Grabber

My TamperMonkey script that gets issue stats and puts them on your issues page, built from joining ValentineZ's issue github repository data with the MWQ issue effects database.

## Usage

[Add the script](https://github.com/Kractero/issue-stats/raw/main/issueStatGetter.user.js) to Tampermonkey.

If you want to build your own issues json, make sure you have Node.js on your system.

```
git clone https://github.com/Kractero/issue-stats.git
npm install
node generateJson.js
```

## Known Issues

Please file an issue if you run into any bugs, because there will be bugs.

The old version consisted of a lot of issues and required manual fixing due to some inconsistencies in ValentineZ's repo, which I forked and made corrections to. This fixed a vast majority and noted in `/val_z_error`, but can also be found in `old/`'s problem jsons.

### Post-Parser Errors

The current errors are `errors.txt`.

---

![Issue Result Sample](/public/Issue%20Result.png)

## Features

1. See MWQ results directly on your issue pages, no more hopping between tabs or windows.
2. Select the categories relevant to the nation you are in, and store each nation's configuration in local storage.
3. Quickly toggle all, one percent, five percent, ten percent, and unranked badges with one button.
4. See your exact badge icons alongside the results and regenerate them if they are out of date with one click.

![Filter](/public/Filter.png)
