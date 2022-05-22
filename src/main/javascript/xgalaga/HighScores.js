/**
 * Copyright (C) 2010 Klaus Reimer <k@ailis.de>
 * See LICENSE.TXT for licensing information
 * 
 * @require jade.js
 */

/**
 * Constructs a new instance of the highscores.
 * 
 * @constructor
 * @class The highscores.
 * 
 */
xgalaga.HighScores = function()
{
    this.scores = [];
    this.load();
};

/**
 * The singleton instance.
 * @private
 * @type {?xgalaga.HighScores} 
 */
xgalaga.HighScores.instance = null;

/**
 * Array with the scores (Entries:name,level,score).
 * @private
 * @type {!Array.<!{name:string,level:number,score:number}>} 
 */
xgalaga.HighScores.prototype.scores;

/**
 * The maximum number of entries in the high score list.
 * @type {number} 
 */
xgalaga.HighScores.prototype.entries = 10;

/**
 * Returns the singleton instance of the high scores list.
 * 
 * @return {!xgalaga.HighScores} The high scores
 */
xgalaga.HighScores.getInstance = function()
{
    if (!xgalaga.HighScores.instance) xgalaga.HighScores.instance = new xgalaga.HighScores();
    return xgalaga.HighScores.instance;
};

/**
 * Loads the high scores.
 * 
 * @private
 */
xgalaga.HighScores.prototype.load = function()
{
    var cookie, data, encodedScores, scoreFrags, name, level, score, i;

    // First check if there is something stored in localStorage
    if (localStorage)
    {
        cookie = localStorage.getItem("highscores");
        if (cookie !== null) {
            this.scores = JSON.parse(cookie);
            return;
        }
    }
    else // If there is nothing, check in the cookie
    {
        cookie = document.cookie.split(';');
        for (i = 0; i < cookie.length; i++)
        {
            if (cookie[i].indexOf("highscores=") == 0) {
                data = cookie[i].substring("highscores=".length, cookie[i].length);
                break;
            }
        }
        if (data != null)
        {
            // The cookie is saved in the following format: encoded(name),level,score|...
            encodedScores = data.split("|");
            for (i = 0; i < this.entries; i++)
            {
                scoreFrags = encodedScores[i].split(",");
                level = parseInt(scoreFrags[1]);
                name = decodeURIComponent(scoreFrags[0]);
                score = parseInt(scoreFrags[2]);
                this.scores.push({
                    "name": name,
                    "level": level,
                    "score": score
                });
            }
            return;
        }
    }
    // If get here it is because there are no saved scores, so default scores are used
    this.reset();
};

/**
 * Saves the high scores.
 */
xgalaga.HighScores.prototype.save = function()
{
    var data, max, entry, i;
    
    // Save scores in localStorage
    if (localStorage)
        localStorage.setItem("highscores", JSON.stringify(this.scores));
    else // If localStorage is not available, cookies are used as failback
    {
        data = Array();
        for (i = 0, max = this.scores.length; i < max; i++)
        {
            entry = this.scores[i];
            data[i] = encodeURIComponent(entry["name"]) + "," + entry["level"] + "," + entry["score"];
        }
        document.cookie = "highscores=" + data.join("|") + "; path=/";
    }
};


/**
 * Resets the high scores.
 */

xgalaga.HighScores.prototype.reset = function()
{
    this.scores = [];
    
    for (i = 0; i < this.entries; i++)
    {
        this.scores[i] = { "name": "-", "level": 1, "score": 0 };
    }
    
};


/**
 * Returns the rank in the high score list the specified score would get.
 * Returns 0 if this score is not good enough to be recorded in the list at
 * all.
 * 
 * @param {number} score
 *             The score
 * @return {number} The rank or 0 if not in the list.
 */

xgalaga.HighScores.prototype.determineRank = function(score)
{
    var rank, entries, entry;
    
    for (rank = 0, entries = this.scores.length; rank < entries; rank++)
    {
        entry = this.scores[rank];
        if (score > entry["score"]) return rank + 1;
    }
    if (rank < this.entries) return rank + 1;
    return 0;
};


/**
 * Adds a new high score entry.
 * 
 * @param {string} name
 *            The name to add
 * @param {number} level
 *            The level to add
 * @param {number} score
 *            The score to add
 */

xgalaga.HighScores.prototype.add = function(name, level, score)
{
    var rank;
    
    // Get the rank in the list
    rank = this.determineRank(score);
    
    // If no rank then do nothing
    if (!rank) return;
    
    // Insert the new entry
    this.scores.splice(rank - 1, 0, {
        "name": name,
        "level": level,
        "score": score
    });
    
    // Truncate the list if needed
    if (this.scores.length > this.entries)
        this.scores = this.scores.slice(0, this.entries);
    
    this.save();
};


/**
 * Returns the scores.
 * 
 * @return {Array} The scores
 */

xgalaga.HighScores.prototype.getScores = function()
{
    return this.scores;
};
