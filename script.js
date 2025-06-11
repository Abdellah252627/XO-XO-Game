document.addEventListener('DOMContentLoaded', () => {
    // تعريف الأصوات
    const sounds = {
        click: new Audio('sounds/click.mp3'),
        win: new Audio('sounds/win.mp3'),
        tie: new Audio('sounds/tie.mp3'),
        restart: new Audio('sounds/restart.mp3')
    };

    // تعيين مستوى الصوت
    Object.values(sounds).forEach(sound => {
        sound.volume = 0.3;
        // إضافة معالجة الأخطاء للأصوات
        sound.onerror = () => {
            console.warn('لم يتم تحميل ملف الصوت: ' + sound.src);
        };
    });

    // العناصر الرئيسية
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const status = document.getElementById('status');
    const restartButton = document.getElementById('restart');
    const difficultySelect = document.getElementById('difficulty');
    const modeRadios = document.querySelectorAll('input[name="mode"]');

    // عناصر النتائج
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const scoreTie = document.getElementById('score-tie');

    // متغيرات اللعبة
    let currentPlayer = 'x';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let gameMode = 'human'; // human أو computer
    let difficulty = 'medium';
    let scores = {
        x: 0,
        o: 0,
        tie: 0
    };

    // تحميل النتائج من localStorage إذا كانت موجودة
    loadScores();

    // تكوينات الفوز (الصفوف والأعمدة والقطريات)
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // الصفوف
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // الأعمدة
        [0, 4, 8], [2, 4, 6]             // القطريات
    ];

    // إضافة مستمعي الأحداث
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    restartButton.addEventListener('click', restartGame);

    modeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            gameMode = radio.value;
            restartGame();
        });
    });

    difficultySelect.addEventListener('change', () => {
        difficulty = difficultySelect.value;
        if (gameMode === 'computer' && currentPlayer === 'o') {
            setTimeout(computerMove, 500);
        }
    });

    // وظائف اللعبة الرئيسية
    function handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));

        // التحقق من صحة الحركة
        if (gameBoard[index] !== '' || !gameActive) return;

        // تشغيل صوت النقر
        try {
            sounds.click.play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
        } catch (e) {
            console.log('خطأ في تشغيل الصوت:', e);
        }

        // إضافة تأثير النقر
        cell.classList.add('clicked');
        setTimeout(() => {
            cell.classList.remove('clicked');
        }, 200);

        // تنفيذ الحركة
        makeMove(index);

        // إذا كانت اللعبة ضد الكمبيوتر وما زالت اللعبة نشطة
        if (gameMode === 'computer' && gameActive) {
            setTimeout(computerMove, 700);
        }
    }

    function makeMove(index) {
        gameBoard[index] = currentPlayer;

        // إضافة تأثير ظهور تدريجي للرمز
        cells[index].textContent = currentPlayer.toUpperCase();
        cells[index].classList.add(currentPlayer, 'fade-in');

        // التحقق من الفوز أو التعادل
        if (checkWin()) {
            endGame(false);
        } else if (checkTie()) {
            endGame(true);
        } else {
            // تبديل اللاعب
            currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
            updateStatus();
        }
    }

    function computerMove() {
        if (!gameActive || currentPlayer === 'x') return;

        let index;

        switch (difficulty) {
            case 'easy':
                index = getRandomMove();
                break;
            case 'medium':
                // 50% فرصة للعب بذكاء، 50% عشوائي
                index = Math.random() > 0.5 ? getSmartMove() : getRandomMove();
                break;
            case 'hard':
                index = getSmartMove();
                break;
            default:
                index = getRandomMove();
        }

        makeMove(index);
    }

    function getRandomMove() {
        // الحصول على قائمة بالخلايا الفارغة
        const emptyCells = gameBoard.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);

        // اختيار خلية عشوائية
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    function getSmartMove() {
        // تحسين الذكاء الاصطناعي باستخدام خوارزمية Minimax المبسطة

        // محاولة الفوز
        for (let i = 0; i < gameBoard.length; i++) {
            if (gameBoard[i] === '') {
                gameBoard[i] = 'o';
                if (checkWinForPlayer('o')) {
                    gameBoard[i] = '';
                    return i;
                }
                gameBoard[i] = '';
            }
        }

        // منع فوز الخصم
        for (let i = 0; i < gameBoard.length; i++) {
            if (gameBoard[i] === '') {
                gameBoard[i] = 'x';
                if (checkWinForPlayer('x')) {
                    gameBoard[i] = '';
                    return i;
                }
                gameBoard[i] = '';
            }
        }

        // إنشاء فرص للفوز (البحث عن صفوف/أعمدة/قطريات بها رمز واحد للكمبيوتر)
        for (const pattern of winPatterns) {
            const oCount = pattern.filter(index => gameBoard[index] === 'o').length;
            const emptyCount = pattern.filter(index => gameBoard[index] === '').length;

            if (oCount === 1 && emptyCount === 2) {
                // البحث عن خلية فارغة في هذا النمط
                for (const index of pattern) {
                    if (gameBoard[index] === '') {
                        return index;
                    }
                }
            }
        }

        // اختيار المركز إذا كان متاحًا
        if (gameBoard[4] === '') {
            return 4;
        }

        // اختيار الزوايا إذا كانت متاحة
        const corners = [0, 2, 6, 8].filter(index => gameBoard[index] === '');
        if (corners.length > 0) {
            return corners[Math.floor(Math.random() * corners.length)];
        }

        // اختيار أي خلية متاحة
        return getRandomMove();
    }

    function checkWinForPlayer(player) {
        return winPatterns.some(pattern => {
            return pattern.every(index => gameBoard[index] === player);
        });
    }

    function checkWin() {
        let winningPattern = null;

        const isWin = winPatterns.some(pattern => {
            const isPatternWin = pattern.every(index => gameBoard[index] === currentPlayer);
            if (isPatternWin) {
                winningPattern = pattern;
            }
            return isPatternWin;
        });

        if (isWin && winningPattern) {
            // تمييز الخلايا الفائزة مع تأثير متتابع
            winningPattern.forEach((index, i) => {
                setTimeout(() => {
                    cells[index].classList.add('winning-cell');
                }, i * 150); // إضافة تأخير تدريجي
            });
        }

        return isWin;
    }

    // وظيفة للحصول على نمط الفوز
    function getWinningPattern() {
        for (const pattern of winPatterns) {
            if (pattern.every(index => gameBoard[index] === currentPlayer)) {
                return pattern;
            }
        }
        return null;
    }

    function checkTie() {
        return gameBoard.every(cell => cell !== '');
    }

    function endGame(isTie) {
        gameActive = false;

        if (isTie) {
            status.textContent = 'تعادل!';
            scores.tie++;
            scoreTie.textContent = scores.tie;

            // تشغيل صوت التعادل وهز اللوحة
            try {
                sounds.tie.play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
            } catch (e) {
                console.log('خطأ في تشغيل الصوت:', e);
            }
            board.classList.add('board-shake');
            setTimeout(() => {
                board.classList.remove('board-shake');
            }, 500);
        } else {
            status.textContent = `اللاعب ${currentPlayer.toUpperCase()} فاز!`;
            scores[currentPlayer]++;

            if (currentPlayer === 'x') {
                scoreX.textContent = scores.x;
            } else {
                scoreO.textContent = scores.o;
            }

            // تشغيل صوت الفوز
            try {
                sounds.win.play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
            } catch (e) {
                console.log('خطأ في تشغيل الصوت:', e);
            }
        }

        // حفظ النتائج
        saveScores();
    }

    function restartGame() {
        // تشغيل صوت إعادة التشغيل
        try {
            sounds.restart.play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
        } catch (e) {
            console.log('خطأ في تشغيل الصوت:', e);
        }

        gameBoard = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'x';

        // إزالة جميع الفئات مع تأثير متتابع
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.textContent = '';
                cell.classList.remove('x', 'o', 'winning-cell', 'fade-in', 'clicked');
            }, index * 50);
        });

        updateStatus();

        // إذا كان وضع اللعب ضد الكمبيوتر والكمبيوتر يبدأ (O)
        if (gameMode === 'computer' && currentPlayer === 'o') {
            setTimeout(computerMove, 800);
        }
    }

    function updateStatus() {
        status.textContent = `دور اللاعب ${currentPlayer.toUpperCase()}`;
    }

    function saveScores() {
        localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
    }

    function loadScores() {
        const savedScores = localStorage.getItem('ticTacToeScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
            scoreX.textContent = scores.x;
            scoreO.textContent = scores.o;
            scoreTie.textContent = scores.tie;
        }
    }
});
