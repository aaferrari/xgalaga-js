/**
 * $Id$
 * Copyright (C) 2010 Klaus Reimer <k@ailis.de>
 * See LICENSE.TXT for licensing information
 * 
 * @fileoverview
 * Provides the xgalaga.Player class.
 * 
 * @author Klaus Reimer (k@ailis.de)
 * @version $Revision: 910 $
 */


/**
 * Constructs a new player.
 *
 * @param {xgalaga.Game} game
 *            The game
 * @constructor
 * @class The player
 */

xgalaga.Player = function(game)
{
    var i;
    this.game = game;
    this.image = new Image();
    this.image.src = "images/player.png";
    this.torps = [];
    for (i = 0; i < xgalaga.MAX_TORPS; i++)
        this.torps[i] = new xgalaga.PlayerTorpedo(game);
};

/** The game. @private @type {xgalaga.Game} */
xgalaga.Player.prototype.game = null;

/** The score. @private @type {Number} */
xgalaga.Player.prototype.score = 0;

/** The X position. @private @type {Number} */
xgalaga.Player.prototype.x = null;

/** The Y position. @private @type {Number} */
xgalaga.Player.prototype.y = null;

/** The X position to move to. @private @type {Number} */
xgalaga.Player.prototype.mx = null;

/** If player is alive. @private @type {Boolean} */
xgalaga.Player.prototype.alive = true;

/** The current move speed. @private @type {Number} */
xgalaga.Player.prototype.moveSpeed = null;

/** The currently installed weapon. @private @type {Number} */
xgalaga.Player.prototype.weapon = null;

/** The current number of torpedos. @private @type {Number} */
xgalaga.Player.prototype.numTorps = null;

/** The maximum torpedos. @private @type {Number} */
xgalaga.Player.prototype.maxTorps = null;

/** The torpedo timer. @private @type {Number} */
xgalaga.Player.prototype.torpOk = 0;

/** The number of ships. @private @type {Number} */
xgalaga.Player.prototype.ships = null;

/** The shields left. @private @type {Number} */
xgalaga.Player.prototype.shieldsLeft = null;

/** The ship image. @private @type {Number} */
xgalaga.Player.prototype.image = null;

/** The current frame. @private @type {Number} */
xgalaga.Player.prototype.frame = 0;

/** The torpedos. @private @type {Array} */
xgalaga.Player.prototype.torps = null;

/** If player is dead. @private @type {Boolean} */
xgalaga.Player.prototype.dead = null;

/** If dead time. @private @type {Number} */
xgalaga.Player.prototype.deadTime = null;

/** The flashing timer. @private @type {Number} */
xgalaga.Player.prototype.flashing = null;


/**
 * Resets the Player.
 */

xgalaga.Player.prototype.reset = function()
{
    var i;

    this.mx = this.x = parseInt(this.game.getWidth() / 2);
    this.moveSpeed = xgalaga.MIN_SPEED;
    this.shieldsLeft = 0;
    this.score = 0;
    this.ships = 2;
    this.alive = true;
    this.deadTime = 0;
    this.flashing = 50;
    this.weapon = xgalaga.WEAPON_SINGLESHOT;
    this.maxTorps = xgalaga.MIN_TORPS;

    for(i = 0; i < xgalaga.MAX_TORPS; i++)
        this.torps[i].setAlive(false);
};


/**
 * Returns the current X position of the player.
 * 
 * @return {Number} The current X position
 */

xgalaga.Player.prototype.getX = function()
{
    return this.x;
};


/**
 * Resets the player for the next level.
 */

xgalaga.Player.prototype.nextLevel = function()
{
    this.numTorps = 0;
    // TODO this.gotLemon = false;
};


/**
 * Fires a new torpedo if a torpedo slot is free.
 *
 * @param {Number} x
 *            Starting X position
 * @param {Number} y
 *            Starting Y position
 * @param {Number} xs
 *            The X speed
 * @param {Number} ys
 *            The Y speed
 * @private
 */

xgalaga.Player.prototype.newTorp = function(x, y, xs, ys)
{
    var i, torp;

    for (i = 0; i < this.maxTorps; i++)
    {
        torp = this.torps[i];
        if (!torp.isAlive())
        {
            torp.reset(x, y, xs, ys);
            this.numTorps++;
            // TODO play_sound(SND_FIRETORP);
            return;
        }
    }
};


/**
 * Updates the player
 */

xgalaga.Player.prototype.update = function()
{
    var moveSpeed, winWidth, winHeight, game, i, torp, alien, aliens, j, k, ne,
        explosions;

    moveSpeed = this.moveSpeed;
    game = this.game;
    explosions = game.getExplosions();
    winWidth = game.getWidth();
    winHeight = game.getHeight();

    // Move the ship
    if ((this.mx / moveSpeed) > (this.x / moveSpeed))
        this.x += moveSpeed;
    else if ((this.mx / moveSpeed) < (this.x / moveSpeed))
        this.x -= moveSpeed;
    this.y = winHeight - 10;

    // Make sure ship stays on screen
    this.x = Math.max(10, Math.min(winWidth - 10, this.x));

    // Increase image frame index
    this.frame++;

    // Decrease the torpedo timer
    this.torpOk--;

    // Try to fire the weapon if requested
    if (this.firing) this.fire();

    // Handles player death
    if (!this.alive)
    {
        this.deadTime++;
        if(this.deadTime >= 100)
        {
            if (this.ships <= 0)
            {
                this.game.endGame();
            }
            else
            {
                this.ships--;
                this.game.getHud().setShips(this.ships);
                this.maxTorps = xgalaga.MIN_TORPS;
                this.weapon = 0;
                this.moveSpeed = xgalaga.MIN_SPEED;
                this.alive = true;
                this.flashing = 50;
                this.deadTime = 0;
                this.mx = this.x = parseInt(winWidth / 2);
            }
        }
    }

    // Update player torpedos
    for (i = 0; i < xgalaga.MAX_TORPS; i++)
    {
        torp = this.torps[i];
        if (torp.isAlive())
        {
            torp.update();
            if (!torp.isAlive()) this.numTorps--;

            aliens = this.game.getAliens();
            for (j = 0; j < xgalaga.MAX_ALIENS; j++)
            {
                alien = aliens.getAlien(j);
                if (alien.isAlive() && !alien.isDying() &&
                   (Math.abs(torp.getX() - alien.getX()) < 8) &&
                   ((Math.abs(torp.getY() - alien.getY()) < 8) ||
                    (Math.abs((torp.getY() + torp.getYSpeed()/2) - alien.getY()) < 8)))
                {
                    aliens.destroy(alien);
                    torp.setAlive(false);
                    this.numTorps--;
                    if (j >= 10)
                    {
                        if (alien.getDirection() < 0)
                            this.addScore(50);
                        else
                        {
                            this.addScore((6 - parseInt(j / 10)) * 100);
                            /* TODO
                            if (!Math.parseInt(Math.random() * (this.gotLemon ? 3 : xgalaga.PRIZE_CHANCE)))

                                new_prize(aliens[j].x, aliens[j].y);
                            */
                        }
                        explosions.newExplosion(alien.getX(), alien.getY(), 0);
                    }
                    else
                    {
                        if (alien.getDirection() < 0)
                            this.addScore(200);
                        else
                        {
                            ne=0; /* count how many escorts */
                            for (k = j + 9; k < j + 12; k++)
                            {
                                if (aliens.getAlien(k).getEscorting() == j)
                                    ne++;
                            }
                            /*
                            TODO
                            score_flagship(aliens[j].x, aliens[j].y, ne);
                            */
                        }
                        explosions.newExplosion(alien.getX(), alien.getY(), 1);
                    }
                }
            }
        }
    }
};


/**
 * Renders the player.
 *
 * @param {Object} ctx
 *            The graphics context. This is either a HTML container element
 *            (For HTML render mode) or a canvas 2D context (For Canvas render
 *            mode)
 */

xgalaga.Player.prototype.render = function(ctx)
{
    var e, s, tmp, img, i, visible;

    visible = this.alive && !(this.flashing % 2);
    if (this.flashing) this.flashing--;
    switch (this.game.getRenderMode())
    {
        case xgalaga.RENDER_MODE_CANVAS:
            if (visible)
            {
                img = this.image;
                if (!img.width || !img.height) return;
                ctx.drawImage(img, 0, (this.frame % 4) * 20, 20, 20,
                    this.x - 10, this.y - 10, 20, 20);
            }
            break;

        default:
            e = this.element;
            if (!e)
            {
                e = this.element = document.createElement("div");
                ctx.appendChild(e);
                s = e.style;
                s.left = "-20px";
                s.top = "-20px";
                s.width = "20px";
                s.height = "20px";
                s.overflow = "hidden";
                s.position = "absolute";
                s.display = "none";
                s.backgroundImage = "url(" + this.image.src + ")";
                e.prevVisible = false;
                e.prevShape = -1;
                e.prevX = -20;
                e.prevY = -20;
                e.prevFrame = -1;
            } else s = e.style;

            if ((tmp = visible) != e.prevVisible)
                s.display = (e.prevVisible = tmp) ? "block" : "none";
            if (tmp)
            {
                if ((tmp = this.x) != e.prevX)
                    s.left = ((e.prevX = tmp) - 10) + "px";
                if ((tmp = this.y) != e.prevY)
                    s.top = ((e.prevY = tmp) - 10) + "px";
                if ((tmp = this.frame) != e.prevFrame)
                    s.backgroundPosition = "0 " +
                    (-((e.prevFrame = tmp) % 4) * 20) + "px";
            }
    }

    // Render player torpedos
    for (i = 0; i < xgalaga.MAX_TORPS; i++)
    {
        this.torps[i].render(ctx);
    }
};


/**
 * Starts moving the player to the left.
 */

xgalaga.Player.prototype.startMoveLeft = function()
{
    if (this.alive) this.mx = 0;
};


/**
 * Stops moving the player to the left.
 */

xgalaga.Player.prototype.stopMoveLeft = function()
{
    this.mx = Math.max(this.mx, this.x);
};


/**
 * Starts moving the player to the right.
 */

xgalaga.Player.prototype.startMoveRight = function()
{
    if (this.alive) this.mx = 32767;
};


/**
 * Stops moving the player to the right.
 */

xgalaga.Player.prototype.stopMoveRight = function()
{
    this.mx = Math.min(this.mx, this.x);
};


/**
 * Starts firing.
 */

xgalaga.Player.prototype.startFire = function()
{
    if (this.alive) this.firing = true;
};


/**
 * Stops firing.
 */

xgalaga.Player.prototype.stopFire = function()
{
    this.firing = false;
};


/**
 * Fires a torpedo if possible.
 *
 * @private
 */

xgalaga.Player.prototype.fire = function()
{
    var winHeight;

    if (this.torpOk <= 0 && this.game.getStarField().getSpeed() == 1)
    {
        winHeight = this.game.getHeight();
        switch (this.weapon)
        {
            case xgalaga.WEAPON_SINGLESHOT:
                if (this.numTorps < this.maxTorps)
                    this.newTorp(this.x, winHeight - 20, 0, -xgalaga.TORP_SPEED);
                this.torpOk = xgalaga.TORP_DELAY;
                break;

            case xgalaga.WEAPON_DOUBLESHOT:
                if (this.numTorps < this.maxTorps - 1)
                {
                    this.newTorp(this.x - 5, winHeight - 20, 0, -xgalaga.TORP_SPEED);
                    this.newTorp(this.x + 5, winHeight - 20, 0, -xgalaga.TORP_SPEED);
                }
                this.torpOk = xgalaga.TORP_DELAY;
                break;

            case xgalaga.WEAPON_TRIPLESHOT:
                if (this.numTorps < this.maxTorps - 2)
                {
                    this.newTorp(this.x - 5, winHeight - 20, -2, 1 - xgalaga.TORP_SPEED);
                    this.newTorp(this.x, winHeight - 20, 0, -xgalaga.TORP_SPEED);
                    this.newTorp(this.x + 5, winHeight - 20, 2, 1 - xgalaga.TORP_SPEED);
                }
                this.torpOk = xgalaga.TORP_DELAY;
                break;
        }
    }
};


/**
 * Checks if player is dead.
 *
 * @return {Boolean} True if player is dead, false if not
 */

xgalaga.Player.prototype.isDead = function()
{
    return !this.alive;
};


/**
 * Checks if player is flashing (invulnerable).
 *
 * @return {Boolean} True if player is flashing, false if not
 */

xgalaga.Player.prototype.isFlashing = function()
{
    return !!this.flashing;
};


/**
 * Checks if player has shield.
 *
 * TODO Implement me
 *
 * @return {Boolean} True if player has shield, false if not
 */

xgalaga.Player.prototype.hasShield = function()
{
    return false;
};


/**
 * Destroys the player ship.
 */

xgalaga.Player.prototype.destroy = function()
{
    this.alive = false;
    this.stopMoveLeft();
    this.stopMoveRight();
    this.stopFire();
};


/**
 * Returns the currently installed weapon.
 *
 * @return {Number} The currently installed weapon
 */

xgalaga.Player.prototype.getWeapon = function()
{
    return this.weapon;
};


/**
 * Adds points to the score.
 */

xgalaga.Player.prototype.addScore = function(score)
{
    this.score += score;
    this.game.getHud().setScore(this.score);
};


/**
 * Returns the current score.
 *
 * @return {Number} The current score
 */

xgalaga.Player.prototype.getScore = function()
{
    return this.score;
};


/**
 * Returns the current number of ships.
 *
 * @return {Number} The current number of ships
 */

xgalaga.Player.prototype.getShips = function()
{
    return this.ships;
};
