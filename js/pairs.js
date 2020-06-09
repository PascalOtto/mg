'use strict';

/**
 * Es dürfen keine "globalen" Variablen außer für das Game Object angelegt werden!
 *
 * Es darf außerdem kein JS Code in der HTML Datei verwendet werden!
 *
 * Die nachfolgenden Klassen und Methoden können als Orientierungshilfe dienen.
 * Andere Varianten sind auch erlaubt.
 */

// Enum
const statusEnum = {
    covered: 0,
    uncovered: 1,
    finished: 2
};

const cardBackground = {
    covered: "green",
    uncovered: "yellow"
}

class Card {
    constructor(symbol, uiTD) {
        this.symbol = symbol; // Unicode
        this.uiTd = uiTD;   // UI Node for displaying symbol
        this.cover();
    }

    /**
     * Vergleiche eine Karte mit einer anderen
     *
     * @param {Card} otherCard
     * @returns {boolean}
     */
    compareWith(otherCard) {
        return this == otherCard;
    }

    /**
     * Setze Status auf verdeckt
     */
    cover() {
        this.status = statusEnum.covered;
        this.uiTd.innerHTML = "";
        this.uiTd.style.backgroundColor = cardBackground.covered;
    }

    /**
     * Setze Status auf aufgedeckt
     */
    uncover() {
        if(this.status != statusEnum.covered) {
            return;
        }
        this.status = statusEnum.uncovered;
        this.uiTd.innerHTML = "&#" + this.symbol;
        this.uiTd.style.backgroundColor = cardBackground.uncovered;
    }

    /**
     * Setze Status auf erledigt
     */
    erase() {
        this.status = statusEnum.finished;
        this.uiTd.style.opacity = "0.0";
    }

    /**
     * Ist Karte verdeckt?
     *
     * @returns {boolean}
     */
    covered() {
        return this.status == statusEnum.covered;
    }

    /**
     * Ist Karte aufgedeckt?
     *
     * @returns {boolean}
     */
    uncovered() {
        return this.status == statusEnum.uncovered;
    }

    /**
     * Ist Karte erledigt?
     *
     * @returns {boolean}
     */
    erased() {
        return this.status == statusEnum.finished;
    }
}

class Memory {
    constructor(rows, columns, countOfSameCards, startSymbol) {
        this.rows = rows;
        this.columns = columns;
        this.countOfSameCards = countOfSameCards;
        this.startSymbol = startSymbol;
        this.guessCount = 0;
        this.cards = [];
        this.timeout = 0;
    }

    initializeUI() {
        /**
         * BOM/DOM Elemente des Spiels
         *
         * Um zum Beispiel auf den Button: Neues Spiel starten zuzugreifen, wäre ein Aufruf möglich wie:
         *
         * this.uiStartGame = document.getElementById("startNewGameButton");
         * this.uiStartGame.onclick = () => this.startGame();
         */
        this.uiStartGame = document.getElementById("startNewGameButton");
        this.uiStartGame.onclick = () => this.startGame();

        this.uiPlayground = document.getElementById("playground");

        this.uiApplySettings = document.getElementById("applySettings");
        this.uiApplySettings.onclick = () => this.applySettings();

        this.uiSettings = document.getElementById("settings");

        this.uiShowSettings = document.getElementById("showSettingsButton");
        this.uiShowSettings.onclick = () => this.toggleSettings();

        this.uiSymbolPreview = document.getElementById("symbolPreview");

        this.uiRows = document.getElementById("rows");
        this.uiRows.oninput = ev => this.showSymbols();
        this.uiColumns = document.getElementById("columns");
        this.uiColumns.oninput = ev => this.showSymbols();

        this.uiSame = document.getElementById("same");
        this.uiSame.oninput = ev => this.showSymbols();


        this.uiStartNumber = document.getElementById("startNumber");
        this.uiStartNumber.oninput = ev => this.showSymbols();

        this.uiTimerOutput = document.getElementById("timerSpan");
        this.uiTimeoutOutput = document.getElementById("timeoutSpan");

        this.uiTimeout = document.getElementById("timeout");
    }

    /**
     * Starte ein neues Spiel
     * Falls noch ein aktuelles läuft, frage den Benutzer, ob dieser das aktuelle Spiel abbrechen möchte
     */
    startGame() {
        if(!this.confirmNewGame()) {
            return;
        }
        this.removePlayground();
        this.createGame();
        this.timeElapsed = 0;
        this.uiTimerOutput = "Spielzeit: 0s";
        this.timer = setInterval(() => this.updateClock(this), 1000);
    }

    updateClock(m) {
        m.timeElapsed += 1000;
        document.getElementById("timerSpan").innerHTML ="Spielzeit: " + m.timeElapsed / 1000 + "s";
    }

    updateTimeoutClock(m) {
        m.timeLeft -= 1000;
        document.getElementById("timeoutSpan").innerHTML = "Zeit für Zug: " + m.timeLeft/1000 + "s";
        if(m.timeLeft <= 0) {
            m.fireTimeout();
        }
    }

    fireTimeout() {
        clearInterval(this.timeoutTimer);
        this.guessCount+=1;
        this.cards.filter(c => c.status == statusEnum.uncovered).map(c=>c.cover());
    }

    // Dialog, if game is already running
    confirmNewGame() {
        if(this.cards.length != 0
            && this.cards.filter(c => c.status != statusEnum.finished).length != 0) {
            if(!confirm("Sie haben noch nicht fertig gespielt\n" + "Wollen Sie wirklich ein neues Spiel starten?")) {
                return false;
            }
        }
        return true;
    }

    /**
     * Erzeuge ein neues Spiel
     */
    createGame() {
        this.createPlayground();
    }

    /**
     * Erzeuge das Spielfeld entsprechender Größe
     *
     * Nutzen Sie dafür die von JS bereitgestellte Methoden wie:
     * - document.createElement
     * - *.appendChild
     *
     * falls Sie die Tabelle nutzen
     */
    createPlayground() {
        let symbols = this.createRanSymbols();
        this.cards = [];
        for(let i = 0; i < this.rows; i++) {
            let tr = document.createElement("tr");
            this.uiPlayground.appendChild(tr);
            for(let j = 0; j < this.columns; j++) {
                let td = document.createElement("td");

                let ran = Math.floor(Math.random() * symbols.length);
                let card = new Card(symbols[ran], td);
                symbols.splice(ran, 1);
                this.cards.push(card);

                tr.appendChild(td);
                td.onclick = () => this.turnCard(card);
            }
        }
    }

    createRanSymbols() {
        let symbols = [];
        let lastSymbol = this.startSymbol + (this.rows*this.columns/this.countOfSameCards);
        for(let symbol = this.startSymbol; symbol < lastSymbol; symbol++) {
            for(let i = 0; i < this.countOfSameCards; i++) {
                symbols.push(symbol);
            }
        }
        return symbols;
    }

    /**
     * Passende Methode um das Spielfeld wieder zu löschen
     */
    removePlayground() {
        clearInterval(this.timer);
        clearInterval(this.timeoutTimer);
        document.getElementById("timeoutSpan").innerHTML = "";
        document.getElementById("timerSpan").innerHTML = "";

        while(this.uiPlayground.firstChild) {
            this.uiPlayground.removeChild(this.uiPlayground.firstChild);
        }
        this.guessCount = 0;
        this.cards = [];
    }

    /**
     * Decke eine Karte auf
     * @param card
     */
    turnCard(card) {
        // uncoverd cards:
        let uncCards = this.cards.filter(card => card.status == statusEnum.uncovered);
        if(uncCards.length == this.countOfSameCards) {
            this.guessCount++;
            clearInterval(this.timeoutTimer);
            document.getElementById("timeoutSpan").innerHTML = "";

            if(this.checkCardEquality(uncCards)) {
                uncCards.map(card => card.erase());
                this.checkGameEnd();
                return;
            }
            else {
                uncCards.forEach(card => card.cover());
                return;
            }
        }
        card.uncover();

        // Start Timeout
        if(this.timeout != 0 && uncCards.length == 0) {
            document.getElementById("timeoutSpan").innerHTML = "Zeit für Zug:" + this.timeout + "s";
            this.timeLeft = this.timeout * 1000;
            this.timeoutTimer = setInterval(() => this.updateTimeoutClock(this), 1000);
        }
    }

    /**
     * Überprüfe ob die aufgedeckten Karten gleich sind
     *
     * @returns {boolean}
     */
    checkCardEquality(cards) {
        if(cards.length == 0) {
            return false;
        }
        for(let c of cards) {
            if(c.symbol != cards[0].symbol) {
                return false;
            }
        }
        return true;
    }

    /**
     * Wenn Spiel zu Ende, dann zeige entprechende Statistik an
     */
    checkGameEnd() {
        for(let c of this.cards) {
            if(c.status != statusEnum.finished) {
                return;
            }
        }
        clearInterval(this.timer);
        clearInterval(this.timeoutTimer);
        let pairCount = this.rows*this.columns/this.countOfSameCards;
        alert("geschafft!\n\n" +
            pairCount + " von " + this.guessCount + " Versuchen erfolgreich\n"
        + "Quote: " + Math.round(pairCount/this.guessCount * 10000)/100 + "%");
        this.removePlayground();
    }

    /**
     * Einstellungen übernehmen
     */
    applySettings() {
        if(!this.confirmNewGame()) {
            return;
        }
        this.removePlayground();
        this.rows = Number.parseInt(this.uiRows.value);
        this.columns = Number.parseInt(this.uiColumns.value);
        this.countOfSameCards = Number.parseInt(this.uiSame.value);
        this.startSymbol = Number.parseInt(this.uiStartNumber.value);
        this.timeout = Number.parseInt(this.uiTimeout.value);
        this.startGame();
    }

    /**
     * Zeige die Einstellungen an bzw. verstecke sie
     */
    toggleSettings() {
        if(this.uiSettings.style.display == "none") {
            this.uiSettings.style.display = "block";
            this.uiShowSettings.textContent = "Einstellungen verbergen...";
        }
        else {
            this.hideSettings();
        }
    }

    /**
     * Verstecke die Einstellungen.
     * Diese Funktion ist evtl. nötig, um beim Laden der Website die Einstellungen zunächst auszublenden.
     */
    hideSettings() {
        this.uiSettings.style.display = "none";
        this.uiShowSettings.textContent = "Einstellungen anzeigen...";
    }

    /**
     * Zeige die verwendeten Symbole für dieses Spiel an.
     * Wenn z.b. der Startwert geändert wird, aktualisiere die Symbole
     */
    showSymbols() {
        this.uiSymbolPreview.innerHTML = "";
        let symbolCount = this.uiRows.value * this.uiColumns.value
            / this.uiSame.value;
        if(symbolCount < 0 || !Number.isInteger(symbolCount)) {
            this.uiSame.style.color = "red";
            this.uiApplySettings.disabled = true;
            return;
        }
        this.uiSame.style.color = "black";
        this.uiApplySettings.disabled = false;

        let startNumber = parseInt(this.uiStartNumber.value);
        for(let i = 0; i < symbolCount; i++) {
            this.uiSymbolPreview.innerHTML += this.toUnicode(startNumber + i)
        }
    }

    toUnicode(i) {
        return "&#" + i;
    }
}

let game = new Memory(3, 3, 3, 128569);
game.initializeUI();
game.hideSettings();
game.startGame();
game.showSymbols();