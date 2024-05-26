# Issue Stat Grabber

My TamperMonkey script that gets issue stats and puts them on your issues page, built from joining ValentineZ's issue github repository data with the MWQ issue effects database.

Last fully updated with MWQ data: `2024-03-14`
Last updated with new issues and old issues from 1620-1628: `2024-05-26`

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

The current errors are `errors.txt`, which are Brasilistan Go Boom (there are no effects) and a new issue.

### Technically complete but potentially problematic

Some issues that have choices that differ slightly based on a nation's policy can mess with the algorithm that matches the choice to the corresponding issue since the text is usually extremely similar or exactly the same. Usually, the effects of these are identical, but may differ slightly, I would take caution with these.

Below is an incomplete list of some issues that may act funky:

### Issues that do not appear with corresponding effects in MWQ

1 - Where's The Love Gone - random 5th choice in Valentine Z

32 - One Wife Is Never Enough, Say Polygamists - random 5th

123 - Now, Vat's Food For Thought - random 7th

279 - A Vat Lot of Trouble - random 6th

411 -  Outed Teacher Ousted - random 4th

488 - Bright Orange is the New Black - random 6th and 7th issue

### Some Branching Issues

70 - Purge the Infidels
134 - The Truth Is Out There
271 - Vigilantes: Heroes or Hoodlums
274 - Brother Love - a Bit too close to home
456 - Heads Will Roll
472 - Rise of the machines

982
1030
1270
1358

684 - Murder Most Deniable?

180 - Mobile Maladies

596 - Primogeniture Problems

862

1308

1317

527

---

Some stats may be stale (miniscule amount tbh), as MWQ's mean stats change very often when new data points are entered and this is essentially a snapshot of MWQ.

---

![Issue Result Sample](/public/Issue%20Result.png)

## Features

1. See MWQ results directly on your issue pages, no more hopping between tabs or windows.
2. Select the categories relevant to the nation you are in, and store each nation's configuration in local storage.
3. Quickly toggle all, one percent, five percent, ten percent, and unranked badges with one button.
4. See your exact badge icons alongside the results and regenerate them if they are out of date with one click.

![Filter](/public/Filter.png)
