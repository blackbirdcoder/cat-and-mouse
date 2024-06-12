const startBtn = document.getElementById('startButton');
const timerSegment = document.getElementById('timerSegment');
const timerTextNotification = document.getElementById('textTimerNotification');
const sceneMain = document.getElementById('scene');
const pointBoard = document.getElementById('pointsCount');
const statistics = document.getElementById('result');

const settings = {
    timer: {
        limit: 60,
        partColor: '#8F363C',
        delay: 1000,
    },
    hero: {
        emoji: '\u{1F408}',
        identifier: 'hero',
        cssClass: 'hero',
    },
    food: {
        emoji: '\u{1F401}',
        identifier: 'food',
        cssClass: 'food',
        quantity: 3,
    },
    scene: {
        numberCells: 80,
        cellsClass: 'cell',
        colMax: 9,
        rowMax: 7,
    },
    statistics: {
        emojiFailure: '\u{1F34C}',
    },
};

function Timer(segment, notification, delay, limit, color) {
    this.segment = segment;
    this.notification = notification;
    this.delay = delay;
    this.limit = limit;
    this.partColor = color;
    this._state = { timerId: undefined, run: undefined };

    this._activate = function (index, color) {
        const segmentDetails = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
        this.segment['style'][segmentDetails[index]] = color;
    }.bind(this);

    this._displayTime = function (digit) {
        this.notification.textContent = digit;
    };

    this.run = async function () {
        await new Promise((resolve) => {
            const totalParts = 4;
            const partLimit = Math.round(this.limit / totalParts);
            let sectionMomentCounter = 0;
            let currentPartTimer = 0;

            this._state.run = true;
            this._displayTime(this.limit);

            const timerId = setInterval(() => {
                if (++sectionMomentCounter == partLimit) {
                    this._activate(currentPartTimer++, this.partColor);
                    sectionMomentCounter = 0;
                }

                this._displayTime(--this.limit);

                if (!this.limit) {
                    this._state.run = false;
                    resolve();
                }
            }, this.delay);

            this._state.timerId = timerId;
        });
        return this._state.run;
    };

    this.stop = function () {
        const timerId = this._state.timerId;
        if (timerId) {
            clearInterval(timerId);
            this.limit = limit;
            this.segment.style = null;
            return true;
        }
        return false;
    }.bind(this);

    this.getState = function () {
        return this._state.run;
    }.bind(this);
}

function Button(buttonBlank) {
    this.button = buttonBlank;
    this._isActive = undefined;

    this.createLaunchActivation = function (handler) {
        this.button.addEventListener('click', function () {
            handler();
            this._isActive = true;
        });
    };

    this.toggleActivity = function (state) {
        switch (state) {
            case 'off':
                this.button.disabled = true;
                this._isActive = false;
                break;
            case 'on':
                this.button.disabled = false;
                this._isActive = true;
                break;
        }
    };

    this.getActivity = function () {
        return this._isActive;
    };
}

function Scene(scene, numberCells, cssClass, colMaximum, rowMaximum) {
    this.scene = scene;
    this.numberCells = numberCells;
    this.css = cssClass;
    this._cells = null;
    this.colMax = colMaximum;
    this.rowMax = rowMaximum;

    this.create = function () {
        let rowPointer = 0;
        let rowCounterSwitching = 0;
        let colPointer = 0;

        for (let i = 0; i < this.numberCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add(this.css);
            cell.dataset.row = rowPointer;
            ++rowCounterSwitching;
            if (rowCounterSwitching > this.colMax) {
                ++rowPointer;
                rowCounterSwitching = 0;
            }
            cell.dataset.col = colPointer;
            ++colPointer;
            if (colPointer > this.colMax) colPointer = 0;
            this.scene.appendChild(cell);
        }

        this._cells = this.scene.children;
    };

    this.destruction = function () {
        for (const cell of Array.from(this._cells)) {
            cell.remove();
        }
    };

    this.getCells = function () {
        return this._cells;
    };

    this.getSettings = function () {
        return { rowMax: this.rowMax, colMax: this.colMax };
    };
}

function Actor(figure, figureIdentifier, figureCssClass) {
    this.figure = figure;
    this.identifier = figureIdentifier;
    this.css = figureCssClass;
    this._readyActor = null;

    this.build = function () {
        const actor = document.createElement('div');
        actor.classList.add(this.css);
        actor.setAttribute('id', this.identifier);
        actor.textContent = this.figure;
        this._readyActor = actor;
        return this._readyActor;
    };
}

function Hero(actor, identifier, sceneSetting) {
    this.actor = actor;
    this.identifier = identifier;
    this.sceneSetting = sceneSetting;
    this._trap = null;

    this._generationNumber = function () {
        return Math.floor(Math.random() * (2 - 0) + 0);
    };

    this._randomStep = function (num, numMax, callbackGenerationNum) {
        if (num == 0) {
            return (num += 1);
        }
        if (num == numMax) {
            return (num -= 1);
        }
        if (num > 0 && num < numMax) {
            if (callbackGenerationNum()) {
                return (num += 1);
            }
            return (num -= 1);
        }
    };

    this._direction = function (oldNum, newNum, character) {
        character.style.transform = oldNum < newNum ? 'scale(-1, 1)' : 'scale(1, 1)';
    };

    this.moving = function (cells) {
        let targetCell = null;

        Array.from(cells).find((cell) => {
            if (cell.dataset.busy === this.identifier) {
                targetCell = cell;
            }
        });

        if (targetCell) {
            const yourself = targetCell.children[this.identifier];
            let currentPosition = String(targetCell.dataset.currentPosition);

            if (currentPosition.length == 1) currentPosition = '0' + currentPosition;

            let row = Number(currentPosition[0]);
            let col = Number(currentPosition[1]);
            let oldCol = col;

            delete targetCell.dataset.busy;
            delete targetCell.dataset.currentPosition;

            switch (this._generationNumber()) {
                case 1:
                    row = this._randomStep(row, this.sceneSetting.rowMax, this._generationNumber);
                    break;
                case 0:
                    col = this._randomStep(col, this.sceneSetting.colMax, this._generationNumber);
                    this._direction(oldCol, col, yourself);
                    break;
            }

            Array.from(cells).find((cell) => {
                if (cell.dataset.row === String(row) && cell.dataset.col === String(col)) {
                    if (cell.dataset.busy !== undefined) this._trap = cell;
                    cell.dataset.busy = this.identifier;
                    cell.dataset.currentPosition = String(row) + String(col);
                    cell.appendChild(yourself);
                }
            });
        }
    };

    this.getTrap = function () {
        return this._trap;
    };

    this.clearTrap = function () {
        if (this._trap) this._trap = null;
    };

    this.eat = function (prey) {
        if (prey) {
            prey.children[0].remove();
            return true;
        }
        return false;
    };
}

function Food(actor) {
    this.actor = actor;
}

function Scoreboard(board, maxPoints) {
    this.board = board;
    this.maxPoints = maxPoints;
    this._points = 0;

    this.init = function () {
        board.textContent = 0;
        this._points = 0;
    };

    this.increase = function () {
        board.textContent = Number(board.textContent) + 1;
        this._points += 1;
    };

    this.getPointState = function () {
        return { current: this._points, max: this.maxPoints };
    };
}

function Manager(button, timer, scene, hero, foods, board, statistics, failure) {
    this.startButton = button;
    this.gameTimer = timer;
    this.gameScene = scene;
    this.hero = hero;
    this.foods = foods;
    this.board = board;
    this.statistics = statistics;
    this.failure = failure;

    this.positioning = function (cells, worker) {
        // WARN: Be careful, slippery place!
        const index = Math.floor(Math.random() * (cells.length + 1 - 0) + 0);
        try {
            if (!cells[index].dataset.busy) {
                cells[index].dataset.busy = worker.actor.classList.value;
                cells[index].dataset.currentPosition = index;
                cells[index].appendChild(worker.actor);
            } else {
                this.positioning(cells, worker);
            }
        } catch (error) {
            console.warn(error, cells);
            console.warn(cells[index]);
            this.positioning(cells, worker);
        }
    };

    this.process = function (
        delay,
        divider,
        actorHero,
        sceneCells,
        pointBoard,
        scene,
        button,
        callbackTimerState,
        callbackTimerStop,
        callbackShowStatistic
    ) {
        if (!callbackTimerState()) return true;
        actorHero.moving(sceneCells);

        const prey = actorHero.getTrap();
        if (prey) {
            if (actorHero.eat(prey)) pointBoard.increase();
            actorHero.clearTrap();
        }

        const points = pointBoard.getPointState();
        if (points.current == points.max) {
            if (callbackTimerStop()) {
                scene.destruction();
                button.toggleActivity('on');
                callbackShowStatistic('on');
                return;
            }
        }
        
        setTimeout(() => {
            this.process(
                delay,
                divider,
                actorHero,
                sceneCells,
                pointBoard,
                scene,
                button,
                callbackTimerState,
                callbackTimerStop,
                callbackShowStatistic
            );
        }, delay / divider);
    };

    this.showStatistic = function (state) {
        switch (state) {
            case 'off':
                this.statistics.style.display = 'none';
                this.statistics.children[1].textContent = '';
                break;
            case 'on':
                this.statistics.style.display = 'block';
                const points = this.board.getPointState();
                if (points.current > 0) {
                    for (let i = 0; i < points.current; i++) {
                        this.statistics.children[1].textContent += this.foods[0].actor.innerText;
                    }
                } else {
                    this.statistics.children[1].textContent = this.failure;
                }
                break;
        }
    }.bind(this);

    this._mainHandler = function () {
        this.showStatistic('off');
        this.board.init();
        this.gameScene.create();
        const gameSceneCells = this.gameScene.getCells();
        this.positioning(gameSceneCells, this.hero);
        for (let i = 0; i < this.foods.length; i++) {
            this.positioning(gameSceneCells, this.foods[i]);
        }
        const promiseGameTimer = this.gameTimer.run();
        this.startButton.toggleActivity('off');
        this.process(
            this.gameTimer.delay,
            2,
            this.hero,
            gameSceneCells,
            this.board,
            this.gameScene,
            this.startButton,
            this.gameTimer.getState,
            this.gameTimer.stop,
            this.showStatistic
        );
        promiseGameTimer.then((state) => {
            if (!state) {
                if (this.gameTimer.stop()) this.gameScene.destruction();
                this.startButton.toggleActivity('on');
                this.showStatistic('on');
            }
        });
    }.bind(this);

    this.mainSimulationInitializer = function () {
        this.startButton.createLaunchActivation(this._mainHandler);
    };
}

function main() {
    const startButton = new Button(startBtn);
    const gameTimer = new Timer(
        timerSegment,
        timerTextNotification,
        settings.timer.delay,
        settings.timer.limit,
        settings.timer.partColor
    );
    const scene = new Scene(
        sceneMain,
        settings.scene.numberCells,
        settings.scene.cellsClass,
        settings.scene.colMax,
        settings.scene.rowMax
    );
    const actorHero = new Actor(settings.hero.emoji, settings.hero.identifier, settings.hero.cssClass).build();
    const roleHero = new Hero(actorHero, settings.hero.identifier, scene.getSettings());
    const roleFoods = [];

    for (let i = 0; i < settings.food.quantity; i++) {
        const roleFood = new Food(
            new Actor(settings.food.emoji, settings.food.identifier + i, settings.food.cssClass).build()
        );
        roleFoods.push(roleFood);
    }

    const scoreboard = new Scoreboard(pointBoard, settings.food.quantity);

    const manager = new Manager(
        startButton,
        gameTimer,
        scene,
        roleHero,
        roleFoods,
        scoreboard,
        statistics,
        settings.statistics.emojiFailure
    );
    manager.mainSimulationInitializer();
}
document.addEventListener('DOMContentLoaded', main);
