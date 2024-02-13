function randBetween(fromNum, ratioNum) {
  return Math.random() * ratioNum + fromNum;
}

// ****************************** UTIL CLASSES *******************************
export class EnemyState {
  /**
   * @type {const}
   */
  static action = {
    /**
     *
     * @param {Enemy} enemy
     */
    hit: (enemy) => {},
  };
  constructor() {}

  /**
   *
   * @param {Enemy} enemy
   */
  static update(enemy) {}
  /**
   *
   * @param {Enemy} enemy
   */
  static start(enemy) {}
  /**
   * @param {Enemy} enemy
   * @param {keyof typeof Enemy.action} action
   */
  static effect(enemy, action) {
    EnemyState.action[action](enemy);
  }
}

export class Flying extends EnemyState {
  static action = {
    /**
     *
     * @param {Enemy} enemy
     */
    hit: (enemy, { damage }) => {
      enemy.hit(damage);
      enemy.state = 1;
      Enemy.states[enemy.state].start(enemy);
    },
  };
  /**
   *
   * @param {Enemy} enemy
   */
  static start(enemy) {
    enemy.newInState = true;
    enemy.frameX = enemy.flyingFrameMin;
    enemy.speedX = enemy.defaultSpeedX * randBetween(-4, 2);
    enemy.speedY = enemy.defaultSpeedY * randBetween(3, 3);
  }
  /**
   *
   * @param {Enemy} enemy
   */
  static update(enemy) {
    enemy.frameX = (enemy.frameX + 1) % enemy.flyingForFrames;
  }
  /**
   * @param {Enemy} enemy
   * @param {keyof typeof Enemy.action} action
   */
  static effect(enemy, action, options) {
    Flying.action[action](enemy, options);
  }
}
export class Phasing extends EnemyState {
  static action = {
    /**
     *
     * @param {Enemy} enemy
     */
    hit: (enemy, _options) => {
      enemy.y += randBetween(40, 60);
      enemy.x += randBetween(-16, 8);
      enemy.state = 0;
      enemy.game.sound.play("slide")
      Enemy.states[enemy.state].start(enemy);
    },
  };
  /**
   *
   * @param {Enemy} enemy
   */
  static start(enemy) {
    enemy.newInState = true;
    enemy.frameX = enemy.phasingFrameMin;
    enemy.speedX = enemy.defaultSpeedX * randBetween(-0.25, 0.125);
    enemy.speedY = enemy.defaultSpeedY * randBetween(0.5, 0.25);
  }
  /**
   *
   * @param {Enemy} enemy
   */
  static update(enemy) {
    enemy.frameX =
      ((enemy.frameX - enemy.phasingFrameMin + 1) % enemy.phasingForFrames) +
      enemy.phasingFrameMin;
  }

  /**
   * @param {Enemy} enemy
   * @param {keyof typeof Enemy.action} action
   */
  static effect(enemy, action, options) {
    Phasing.action[action](enemy, options);
  }
}
export class Imploding extends EnemyState {
  static action = {
    /**
     *
     * @param {Enemy} enemy
     */
    hit: (_enemy, _options) => {},
  };
  /**
   *
   * @param {Enemy} enemy
   */
  static start(enemy) {
    enemy.newInState = true;
    enemy.frameX = enemy.implodingFrameMin;
    enemy.speedX = enemy.defaultSpeedX;
    enemy.speedY = enemy.defaultSpeedY;
    enemy.game.sound.randomBoom();
  }
  /**
   *
   * @param {Enemy} enemy
   */
  static update(enemy) {
    ++enemy.frameX;
    if (enemy.frameX > enemy.implodingFrameMax - 1) {
      enemy.frameX = enemy.implodingFrameMax - 1;
      enemy.reset();
    }
  }

  /**
   * @param {Enemy} enemy
   * @param {keyof typeof Enemy.action} action
   */
  static effect(enemy, action, options) {
    Imploding.action[action](enemy, options);
  }
}

// ********************************************* MAIN CLASSES *************************************************

export class Enemy {
  static states = [/*EnemyState,*/ Flying, Phasing, Imploding];
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(
    game,
    {
      // basic
      image,
      health = 1,
      score = 1,
      defaultSpeedX = 1,
      defaultSpeedY = 1,
      width = 100,
      height = 100,
      size = 1,

      maxFrameY = 4,

      // STATES
      flyingFrameMin = 0,
      flyingFrameMax = 0,
      phasingFrameMin = 0,
      phasingFrameMax = 0,
      implodingFrameMin = 0,
      implodingFrameMax = 0,
    }
  ) {
    /**
     * @type {HTMLImageElement}
     */
    this.image = image;

    this.game = game;

    this.frameWidth = width;
    this.frameHeight = height;

    this.maxHealth = health;
    this.score = score;

    // this.width = this.frameWidth * size;
    // this.height = this.frameHeight * size;

    // this.size = size;
    this.defaultSize = size;

    // this.frameX = frameX;
    // this.frameY = frameY;

    this.defaultSpeedX = defaultSpeedX;
    this.defaultSpeedY = defaultSpeedY;

    this.free = true;
    this.colliededPlayer = false;

    this.maxFrameY = maxFrameY;

    // ******* STATE *******
    this.flyingFrameMin = flyingFrameMin;
    this.flyingFrameMax = flyingFrameMax;
    this.flyingForFrames = flyingFrameMax - flyingFrameMin;
    this.phasingFrameMin = phasingFrameMin;
    this.phasingFrameMax = phasingFrameMax;
    this.phasingForFrames = phasingFrameMax - phasingFrameMin;
    this.implodingFrameMin = implodingFrameMin;
    this.implodingFrameMax = implodingFrameMax;
    this.implodingForFrames = implodingFrameMax - implodingFrameMin;

    this.switchStateTimer = 0;
    this.state = +(Math.random() < 0.5);
  }

  start({
    health = this.maxHealth,
    frameY = Math.floor(Math.random() * this.maxFrameY),
    frameX = 0,

    colliededPlayer = false,
    size = randBetween(0.2, 0.9) * this.defaultSize,
    speedX = this.defaultSpeedX,
    speedY = this.defaultSpeedY * 0.2,

    state = +(Math.random() < 0.5),

    switchStateInterval = randBetween(4000, 6000),
  }) {
    this.size = size;
    this.width = this.frameWidth * size;
    this.height = this.frameHeight * size;

    this.speedX = speedX;
    this.speedY = speedY;

    this.health = health;

    this.frameX = frameX;
    this.frameY = frameY;

    this.x = Math.random() * this.game.width;
    this.y = -this.height;

    this.free = false;
    this.colliededPlayer = colliededPlayer;
    this.game.activeEnemies.push(this);
    this.state = state;
    this.switchStateInterval = switchStateInterval;
    Enemy.states[this.state].start(this);
  }
  reset() {
    this.free = true;
    this.update = this._unVisibleUpdate;
  }

  draw() {
    this.updateFrame();
    this.game.ctx.save();
    this.game.ctx.drawImage(
      this.image,
      this.frameX * this.frameWidth,
      this.frameY * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
    if (this.game.debug) {
      this.game.ctx.strokeRect(this.x, this.y, this.width, this.height);
      this.drawStatus();
      this.writeStatus();
    }
    this.game.ctx.restore();
  }

  drawStatus() {
    // Define the dimensions and position of the health bar
    const barWidth = 100; // Width of the health bar
    const barHeight = 10; // Height of the health bar
    const barX = this.x; // X position of the health bar
    const barY = this.y - 20; // Y position of the health bar (adjust as needed)

    // Calculate the percentage of current health relative to max health
    const healthPercentage = this.health / this.maxHealth;

    // Draw the background of the health bar
    this.game.ctx.fillStyle = "gray";
    this.game.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw the actual health bar
    this.game.ctx.fillStyle = "green";
    this.game.ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

    // Optionally, you can also draw the text for current and max health
    this.game.ctx.fillStyle = "red";
    this.game.ctx.fillText(
      Math.round(this.health) + " / " + this.maxHealth,
      barX,
      barY - 10
    );
  }

  writeStatus() {
    this.game.ctx.textAlign = "center";
    this.game.ctx.textBaseline = "middle";
    this.game.ctx.fillStyle = "white";
    this.game.ctx.font = "40px Bangers";
    this.game.ctx.fillText(
      Math.round(this.health),
      this.x + this.width * 0.5,
      this.y + this.height * 0.5
    );
  }
  update(deltaTime) {
    if (this.y < 0) {
      this.update = this._unVisibleUpdate;
    } else {
      this.update = this._visibleUpdate;
    }
    this.update();
  }
  _unVisibleUpdate(deltaTime) {
    if (this.x > this.game.width - this.width) {
      this.x = this.game.width - this.width;
    } else if (this.x < 0) {
      this.x = 0;
    }
    if (this.y < 0) {
      this.y += this.height / 10;
    } else {
      this.update = this._visibleUpdate;
      this.update();
    }
  }
  _visibleUpdate(deltaTime) {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.health > 0) {
      this.checkStateSwitch(deltaTime);
      if (this.x > this.game.width - this.width) {
        this.speedX = -Math.abs(this.speedX);
      } else if (this.x < 0) {
        this.speedX = Math.abs(this.speedX);
      }
      if (this.game.spriteUpdate) {
        if (this.game.checkMouseCollision(this) && !this.game.mouse.fired) {
          Enemy.states[this.state].effect(this, "hit", { damage: 1 });
          this.game.mouse.fired = true;
          if (this.health <= 0) {
            this.applyDestroy(1);
            return;
          }
        }
        if (this.y > this.game.height) {
          this.game.hit(this.health);
        //   this.applyDestroy(-1);
        this.game.sound.play("scream")
        this.reset();
        }
      }
    } else {
      //   Enemy.states[2].update(this);
    }
  }
  /**
   *
   * @param {number} damage
   */
  hit(damage) {
    this.health -= damage;
    // this.frameX =
    //   this.destroyFrameX -
    //   Math.ceil(this.destroyFrameX * (this.health / this.maxHealth));
  }

  updateFrame() {
    if (this.game.spriteUpdate) {
      if (this.newInState) {
        this.newInState = false;
      } else {
        Enemy.states[this.state].update(this);
      }
    }
  }
  /**
   * This has to run even if paused
   * @param {1|-|-1} increase
   */
  applyDestroy(increase = 0) {
    // this.frameX = this.destroyFrameX;
    this.health = 0;
    this.state = 2;
    Enemy.states[2].start(this);

    this.game.scoreModifier(this.score * increase);
  }

  //   destroyed() {
  //     if (this.game.spriteUpdate) {
  //       //   if (this.explosionFrames > 0) {
  //       //     --this.explosionFrames;
  //       //     ++this.frameX;
  //       //   } else {
  //       //     this.reset();
  //       //   }
  //       this.reset();
  //     }
  //   }

  switchState() {
    this.state = (this.state + 1) % 2;
    Enemy.states[this.state].start(this);
  }
  checkStateSwitch(deltaTime) {
    if (this.switchStateTimer < this.switchStateInterval) {
      this.switchStateTimer += deltaTime;
    } else {
      this.switchState();
      if (this.switchStateTimer < 2 * this.switchStateInterval) {
        this.switchStateTimer =
          this.switchStateTimer + deltaTime - this.switchStateInterval;
      } else {
        this.switchStateTimer = deltaTime;
      }
    }
  }
}

export class Beetlemorph extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("beetlemorph100x100"),
      health: 1,
      score: 1,
      defaultSpeedX: 1 * randBetween(-1, 0.5),
      defaultSpeedY: 1 * randBetween(1, 0.5),
      width: 100,
      height: 100,
      size: 1 * randBetween(0.5, 0.8),

      maxFrameY: 4,

      // STATES
      flyingFrameMin: 0,
      flyingFrameMax: 1,
      phasingFrameMin: 1,
      phasingFrameMax: 2,
      implodingFrameMin: 2,
      implodingFrameMax: 3,
    });
  }
}

export class Lobstermorph extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("lobstermorph100x100"),
      health: 3,
      score: 3,
      defaultSpeedX: 1 * randBetween(-0.25, 0.125),
      defaultSpeedY: 1 * randBetween(0.25, 0.1),
      width: 100,
      height: 100,
      size: 1 * randBetween(0.5, 0.8),

      maxFrameY: 4,

      // STATES
      flyingFrameMin: 0,
      flyingFrameMax: 4,
      phasingFrameMin: 4,
      phasingFrameMax: 8,
      implodingFrameMin: 8,
      implodingFrameMax: 14,
    });
  }
}
export class Phantommorph extends Enemy {
  /**
   *
   * @param {import("./main").Game} game
   */
  constructor(game) {
    super(game, {
      image: document.getElementById("phantommorph100x100"),
      health: 2,
      score: 2,
      defaultSpeedX: 1 * randBetween(-0.8, 0.4),
      defaultSpeedY: 1 * randBetween(0.5, 0.7),
      width: 100,
      height: 100,
      size: 1 * randBetween(0.5, 0.8),

      maxFrameY: 4,

      // STATES
      flyingFrameMin: 0,
      flyingFrameMax: 3,
      phasingFrameMin: 3,
      phasingFrameMax: 6,
      implodingFrameMin: 6,
      implodingFrameMax: 12,
    });
  }
}
