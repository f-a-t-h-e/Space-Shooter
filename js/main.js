import { Beetlemorph, Enemy, Lobstermorph, Phantommorph } from "./enemy.js";

class AudioControl {
  constructor() {
    /**@type {HTMLAudioElement} */
    this.newgame = document.getElementById("newgame");

    /**@type {HTMLAudioElement} */
    this.boom1 = document.getElementById("boom1");

    /**@type {HTMLAudioElement} */
    this.boom2 = document.getElementById("boom2");

    /**@type {HTMLAudioElement} */
    this.boom3 = document.getElementById("boom3");

    /**@type {HTMLAudioElement} */
    this.boom4 = document.getElementById("boom4");

    /**@type {HTMLAudioElement} */
    this.slide = document.getElementById("slide");

    /**@type {HTMLAudioElement} */
    this.win = document.getElementById("win");

    /**@type {HTMLAudioElement} */
    this.lose = document.getElementById("lose");
    
    /**@type {HTMLAudioElement} */
    this.scream = document.getElementById("scream");
  }
  /**
   *
   * @param {"newgame"|"boom1"|"boom2"|"boom3"|"boom4"|"slide"|"win"|"lose"|"scream"} audio
   */
  play(audio) {
    switch (audio) {
      case "newgame":
      case "boom1":
      case "boom2":
      case "boom3":
      case "boom4":
      case "slide":
      case "win":
      case "lose":
      case "scream":
        this[audio].currentTime = 0;
        this[audio].play();
        break;
      default:
        break;
    }
  }
  randomBoom() {
    const num = Math.floor(Math.random() * 4) + 1;
    this[`boom${num}`].currentTime = 0;
    this[`boom${num}`].play();
  }
}

export class Game {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} context
   */
  constructor(canvas, context) {
    this.isNewGame = true;
    // ********************** Fixed values *********************
    this.canvas = canvas;
    this.ctx = context;
    this.sound = new AudioControl();
    this.resetBtn = document.getElementById("reset-button");
    this.fullScreenBtn = document.getElementById("full-screen-button");
    this.crewImage = document.getElementById("crewSprite");
    this.crewImageWidth = 20;
    this.crewImageHeight = 45;
    // ********************** Main values **********************
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.level = 1;

    this.activeEnemies = [];
    this.maxHealth = 10;
    this.health = 10;
    this.healthBarBottomY = (this.maxHealth - 1) * 10 + 51;
    // MESSAGES
    this.msg1 = "Run!";
    this.msg2 = "Or get eaten!";
    this.msg3 = `Press "Enter" or "P" to start!`;
    this.msgColor = "white";

    this.resetBtn.addEventListener("click", (e) => {
      if (this.gameOver) {
        this.start();
      } else {
        this.togglePaused();
      }
    });
    this.fullScreenBtn.addEventListener("click", (e) => {
      this.toggleFullScreen();
    });
    this.start();

    window.addEventListener("resize", () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("keydown", (e) => {
      switch (e.code.toLocaleLowerCase()) {
        case "keyr":
          if (this.gameOver) {
            this.start();
          }
          break;
        case "keyp":
          if (!this.gameOver) {
            this.togglePaused();
          }
          break;
        case "enter":
          if (this.gameOver) {
            this.start();
          } else {
            this.togglePaused();
          }
          break;
        case "keyf":
          this.toggleFullScreen();
          break;
        case "keyd":
          this.debug = !this.debug;
          break;

        default:
          switch (e.key.toLocaleLowerCase()) {
            case "r":
              if (this.gameOver) {
                this.start();
              }
              break;
            case "p":
              if (!this.gameOver) {
                this.togglePaused();
              }
              break;
            case "enter":
              if (this.gameOver) {
                this.start();
              } else {
                this.togglePaused();
              }
              break;
            case "f":
              this.toggleFullScreen();
              break;
            case "d":
              this.debug = !this.debug;
              break;
            default:
              break;
          }
          break;
      }
    });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });

    window.addEventListener("touchmove", (e) => {
      this.mouse.x = e.changedTouches[0].pageX;
      this.mouse.y = e.changedTouches[0].pageY;
    });

    window.addEventListener("mousedown", (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
      this.mouse.fired = false;
      if (this.mouse.pressed) {
        return;
      }
      this.checkMouseCollision = this._checkMouseCollisionPressed;
      this.mouse.pressed = true;
    });
    window.addEventListener("mouseup", (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
      if (this.mouse.pressed) {
        this.checkMouseCollision = (...args) => false;
        this.mouse.pressed = false;
      }
    });
    window.addEventListener("touchstart", (e) => {
      this.mouse.x = e.changedTouches[0].pageX;
      this.mouse.y = e.changedTouches[0].pageY;
      this.mouse.fired = false;
      if (this.mouse.pressed) {
        return;
      }
      this.checkMouseCollision = this._checkMouseCollisionPressed;
      this.mouse.pressed = true;
    });
    window.addEventListener("touchend", (e) => {
      this.mouse.x = e.changedTouches[0].pageX;
      this.mouse.y = e.changedTouches[0].pageY;
      if (this.mouse.pressed) {
        this.checkMouseCollision = (...args) => false;
        this.mouse.pressed = false;
      }
    });
  }

  //   ************************* SETUP Methods ************************
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    for (let i = 0; i < this.activeEnemies.length; i++) {
      const enemy = this.activeEnemies[i];
      enemy.update = enemy._unVisibleUpdate;
    }
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "white";
    this.ctx.font = "30px Bangers";
  }

  start(winningScore=5) {
    this.resize(window.innerWidth, window.innerHeight);

    this.gameOver = false;
    this.resetBtn.innerText = "P";

    // turn methods on
    this.scoreModifier = this._runningscoreModifier;
    this.hit = this._runningHit;

    // reset defaults
    this.score = 0;
    this.maxHealth = 10;
    this.health = this.maxHealth;
    this.winningScore = winningScore * this.level;
    this.debug = false;
    /** @type {{frameX:number;frameY:number}[]} */
    this.crewMembers = [];
    this.reGenerateCrew();

    // CONTROLS
    this.keys = {};
    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.5,
      pressed: true,
      height: 5,
      width: 5,
      radius: 5,
      fired: false,
    };

    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 150;

    // MANAGE Enemies
    /**
     * @type {Enemy[]}
     */
    this.enemiesPool = [];
    this.activeEnemies = [];
    this.numOfEnemies = 25;
    this.enemyTimer = 0;
    this.enemyInterval = 1000 * 3;
    this.createEnemies();
    if (this.isNewGame) {
      this.paused = true;
      this.isNewGame = false;
    } else {
      this.paused = false;
      this.render = this._runningRender;
      this.sound.play("newgame");
    }
  }

  applyPauseState(paused = this.paused) {
    this.sound.play("newgame");
    this.applyPauseState = this._applyPauseState;
  }
  _applyPauseState(paused = this.paused) {
    this.paused = paused;
    if (paused) {
      this.render = this._pausedRender;
      this.scoreModifier = this._pausedscoreModifier;
      this.hit = this._pausedHit;

      this.msg1 = "Run!";
      this.msg2 = "Or get eaten!";
      this.msg3 = `Press "Enter" or "P" to resume!`;
      this.msgColor = "white";
    } else {
      this.render = this._runningRender;
      this.scoreModifier = this._runningscoreModifier;
      this.hit = this._runningHit;
    }
  }
  togglePaused() {
    this.paused = !this.paused;
    this.applyPauseState(this.paused);
  }

  // ************************* RENDER ****************************
  /**
   *
   * @param {number} deltaTime
   */
  render(deltaTime) {
    if (this.paused) {
      this.drawStatusAndText();
      // @todo make this work the way of paused and running
      this.ctx.save();
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = this.msgColor;
      this.ctx.font = "80px Bangers";
      this.ctx.fillText(this.msg1, this.width * 0.5, this.height * 0.5 - 25);
      this.ctx.font = "20px Banders";
      this.ctx.fillText(this.msg2, this.width * 0.5, this.height * 0.5 + 25);
      this.ctx.fillText(this.msg3, this.width * 0.5, this.height * 0.5 + 50);
      this.ctx.restore();
    } else {
      this.render = this._runningRender;
      this.render(deltaTime);
    }
  }

  /**
   *
   * @param {number} deltaTime
   */
  _runningRender(deltaTime) {
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true;
      this.spriteTimer = 0;
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }
    this.handleNewEnemy(deltaTime);

    // render enemies
    for (let i = this.activeEnemies.length - 1; i > -1; --i) {
      const enemy = this.activeEnemies[i];
      enemy.update(deltaTime);
      //   enemy.applyStateEffect()
    }
    this.mouse.fired = false;

    this.activeEnemies = this.activeEnemies.filter((enemy) => {
      enemy.draw();
      return !enemy.free;
    });

    // drawings
    this.drawMouse();
    this.drawStatusAndText();
  }

  /**
   *
   * @param {number} deltaTime
   */
  _pausedRender(deltaTime) {
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true;
      this.spriteTimer = 0;
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }

    this.enemiesPool.forEach((enemy) => {
      if (!enemy.free) {
        enemy.draw();
      }
    });

    this.drawStatusAndText();
    // @todo make this work the way of paused and running
    this.ctx.save();
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = this.msgColor;
    this.ctx.font = "80px Bangers";
    this.ctx.fillText(this.msg1, this.width * 0.5, this.height * 0.5 - 25);
    this.ctx.font = "20px Banders";
    this.ctx.fillText(this.msg2, this.width * 0.5, this.height * 0.5 + 25);
    this.ctx.fillText(this.msg3, this.width * 0.5, this.height * 0.5 + 50);
    this.ctx.restore();
  }
  _gameOverRender(deltaTime) {
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true;
      this.spriteTimer = 0;
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }

    this.enemiesPool.forEach((enemy) => {
      if (!enemy.free) {
        enemy.update(deltaTime);
        // enemy.applyStateEffect();
        enemy.draw();
      }
    });

    this.drawStatusAndText();
    // @todo make this work the way of paused and running
    this.ctx.save();
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = this.msgColor;
    this.ctx.font = "80px Bangers";
    this.ctx.fillText(this.msg1, this.width * 0.5, this.height * 0.5 - 25);
    this.ctx.font = "20px Banders";
    this.ctx.fillText(this.msg2, this.width * 0.5, this.height * 0.5 + 25);
    this.ctx.fillText(this.msg3, this.width * 0.5, this.height * 0.5 + 50);
    this.ctx.restore();
  }

  // *************************** DRAW ****************************
  drawStatusAndText() {
    this.ctx.save();
    this.ctx.textAlign = "start";
    this.ctx.font = "30px Bangers";
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Score: " + this.score + " / " + this.winningScore, 20, 30);
    this.drawHealth();
    this.ctx.restore();
  }
  drawHealth() {
    // for (let i = 0; i < this.maxHealth; i++) {
    //     this.ctx.strokeRect(30, 50 + 10 * i, 32, 7);
    //   }
    //   this.ctx.fillStyle = "gold";
    //   for (let i = 0; i < this.health; i++) {
    //     this.ctx.fillRect(31, this.healthBarBottomY - 10 * i, 30, 5);
    //   }
    for (let i = 0; i < this.health; i++) {
      this.ctx.drawImage(
        this.crewImage,
        this.crewMembers[i].frameX * this.crewImageWidth,
        this.crewMembers[i].frameY * this.crewImageHeight,
        this.crewImageWidth,
        this.crewImageHeight,
        20 + 25 * i,
        60,
        this.crewImageWidth,
        this.crewImageHeight
      );
    }
  }
  drawMouse() {
    this.ctx.save();
    this.ctx.translate(this.mouse.x, this.mouse.y);
    // this.ctx.drawImage(
    //   this.image,
    //   this.frameX * this.width,
    //   this.frameY * this.height,
    //   this.width,
    //   this.height,
    //   -this.radius,
    //   -this.radius,
    //   this.width,
    //   this.height
    // );
    this.ctx.fillStyle = "black";
    this.ctx.strokeStyle = "white";
    this.ctx.strokeRect(0, 0, this.mouse.radius, this.mouse.radius);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.mouse.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // ************************** ENEMIES Handlers *********************************
  createEnemies() {
    for (let i = 0; i < this.numOfEnemies; i++) {
      const randNum = Math.random();
      //   this.enemiesPool.push(new Enemy(this, {}));
      if (randNum > 0.75) {
        this.enemiesPool.push(new Beetlemorph(this));
      } else if (randNum > 0.5) {
        this.enemiesPool.push(new Lobstermorph(this));
      } else if (randNum > 0.1) {
        this.enemiesPool.push(new Phantommorph(this));
        //   this.enemiesPool.push(new Rhinomorph(this));
      } else {
        //   this.enemiesPool.push(new Asteroid(this));
      }
    }
  }
  getEnemy() {
    return this.enemiesPool.find((enemy) => enemy.free);
  }
  handleNewEnemy(deltaTime) {
    if (this.enemyTimer < this.enemyInterval) {
      this.enemyTimer += deltaTime;
    } else {
      const newEnemy = this.getEnemy();
      if (newEnemy) {
        newEnemy.start({});
        if (this.enemyTimer < 2 * this.enemyInterval) {
          this.enemyTimer = this.enemyTimer + deltaTime - this.enemyInterval;
        } else {
          this.enemyTimer = deltaTime;
        }
      }
    }
  }
  // ************************* COLLISION *******************************
  checkMouseCollision(obj) {
    if (this.mouse.pressed) {
      this.checkMouseCollision = this._checkMouseCollisionPressed;
      return this.checkMouseCollision(obj);
    } else {
      return false;
    }
  }
  _checkMouseCollisionPressed(obj) {
    return (
      obj.x < this.mouse.x + this.mouse.width &&
      obj.x + obj.width > this.mouse.x &&
      obj.y < this.mouse.y + this.mouse.height &&
      obj.y + obj.height > this.mouse.y
    );
  }

  //   ***************************** SCORE AND STATES ********************************
  /**
   *
   * @param {number} points
   */
  scoreModifier(points) {
    if (this.paused) {
      this.scoreModifier = this._pausedscoreModifier;
    } else {
      this.scoreModifier = this._runningscoreModifier;
    }
    this.scoreModifier(points);
  }
  _runningscoreModifier(points) {
    this.score += points;
    if (this.score < 0) {
      this.score = 0;
      //   this.gameOver = true;
      //   this.paused = false;
      //   this.togglePaused();
    } else if (this.score >= this.winningScore) {
      this.triggerGameOver();
    }
  }

  _pausedscoreModifier(points) {}

  /**
   *
   * @param {number} damage
   */
  hit(damage) {
    if (this.paused) {
      this.hit = this._pausedHit;
    } else {
      this.hit = this._runningHit;
    }
    this.hit(damage);
  }
  _runningHit(damage) {
    this.health -= damage;
    if (this.health < 0) {
      this.triggerGameOver();
    }
  }
  _pausedHit(damage) {}

  /**
   * Remember to use it only after setting the health correctly
   */
  reGenerateCrew() {
    this.crewMembers = [];
    for (let i = this.health; i > 0; --i) {
      this.crewMembers.push({
        frameX: Math.floor(Math.random() * 5),
        frameY: Math.floor(Math.random() * 5),
      });
    }
  }
  // ***************************** CONTROL *************************
  triggerGameOver() {
    this.gameOver = true;
    this.applyPauseState(true);
    this.render = this._gameOverRender;
    this.resetBtn.innerText = "R";
    if (this.health > 0) {
      if (this.score >= this.winningScore) {
        this.sound.play("win");
        ++this.level
        this.msg1 = `WELL DONE!`;
        this.msg2 = `Your score : ${this.score}`;
        this.msg3 = `Press "Enter" or "R" to restart!`;
        this.msgColor = "green";
        this.enemiesPool.forEach((enemy) => {
          enemy.applyDestroy(0);
        });
      } else {
        // It's set from the applyPauseState method
      }
    } else {
      this.sound.play("lose");
      this.level = 1;
      this.msg1 = `You lose!`;
      this.msg2 = `Try again!`;
      this.msg3 = `Press "Enter" or "R" to restart!`;
      this.msgColor = "red";
    }
  }
  _doNothing(...args) {}
  // ****************** SETTINGS METHODS **************************
  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

window.addEventListener("load", startGame);
// function restartGame(e) {
//   if (e.code === "KeyR" || e.key === "r") {
//     startGame();
//   }
// }
function startGame() {
  //   window.removeEventListener("keydown", restartGame);
  /**
   * @type {HTMLCanvasElement}
   */
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.font = "30px Bangers";

  const game = new Game(canvas, ctx);
  let lastTime = 0;
  /**
   * @type {FrameRequestCallback}
   */
  function animate(timesTamp) {
    const deltaTime = timesTamp - lastTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(deltaTime);
    lastTime = timesTamp;
    window.requestAnimationFrame(animate);
  }
  animate(0);
}
