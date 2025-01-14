class MagicWall {
    constructor() {
        try {
            // 修改基本属性设置为默认值
            this.width = 20;      // 宽度：20
            this.height = 20;     // 高度：20
            this.cellSize = 28;   // 魔方大小：28
            this.diffCount = 5;   // 差异数量：5
            this.isCustomMode = true;
            this.isMouseTracking = false;
            this.showHints = false;
            this.isGameRunning = false;
            
            // 颜色方案 - 对调方案一和方案二
            this.colorScheme1 = [
                'Red',      // 红
                'Yellow',   // 黄
                'Blue',     // 蓝
                'LimeGreen',// 绿
                'Orange',   // 橙
                'White'     // 白 (原方案二)
            ];
            
            this.colorScheme2 = [
                'Red',      // 红
                'Yellow',   // 黄
                'Blue',     // 蓝
                'LimeGreen',// 绿
                'Orange',   // 橙
                'Black'     // 黑 (原方案一)
            ];

            // 修改默认颜色方案为方案一（白色）
            this.currentColorScheme = this.colorScheme1;
            
            // 颜色规则系统 - 与原程序保持一致
            this.colorRules = {
                'Yellow': ['Red', 'Blue'],               // 黄色可以变成红色或蓝色
                'White': ['Red', 'Blue'],               // 白色可以变成红色或蓝色
                'LimeGreen': ['Red', 'Blue'],           // 绿色可以变成红色或蓝色
                'Orange': ['Blue'],                     // 橙色只能变成蓝色
                'Red': ['White', 'Yellow', 'LimeGreen', 'Blue'], // 红色可以变成白色、黄色、绿色或蓝色
                'Blue': ['LimeGreen', 'Yellow', 'White', 'Red', 'Orange'] // 蓝色可以变成绿色、黄色、白色、红色或橙色
            };

            // 初始化画布
            this.initCanvas();
            this.setupEventListeners();
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            alert('游戏初始化失败，请尝试减小方块数量或方块大小');
        }
    }

    initCanvas() {
        this.leftPanel = document.getElementById('leftPanel');
        this.rightPanel = document.getElementById('rightPanel');
        
        if (!this.leftPanel || !this.rightPanel) {
            throw new Error('Cannot find game panels');
        }
        
        this.leftCtx = this.leftPanel.getContext('2d');
        this.rightCtx = this.rightPanel.getContext('2d');
        
        if (!this.leftCtx || !this.rightCtx) {
            throw new Error('Cannot get canvas context');
        }

        this.initPanels();
    }

    initPanels() {
        try {
            // 计算画布尺寸
            const panelWidth = this.width * this.cellSize;
            const panelHeight = this.height * this.cellSize;
            
            // 添加画布大小限制
            const maxCanvasSize = 16384; // 大多数浏览器的最大画布尺寸
            if (panelWidth > maxCanvasSize || panelHeight > maxCanvasSize) {
                throw new Error(`画布尺寸过大 (${panelWidth}x${panelHeight}). 请减小方块数量或方块大小.`);
            }

            // 计算总内存使用
            const totalPixels = panelWidth * panelHeight;
            const estimatedMemoryMB = (totalPixels * 4 * 2) / (1024 * 1024); // 两个画布，每像素4字节
            if (estimatedMemoryMB > 500) { // 设置500MB的限制
                throw new Error(`预计内存使用过大 (${Math.round(estimatedMemoryMB)}MB). 请减小方块数量或方块大小.`);
            }

            console.log('Initializing panels with dimensions:', {
                width: this.width,
                height: this.height,
                cellSize: this.cellSize,
                panelWidth,
                panelHeight,
                estimatedMemoryMB: Math.round(estimatedMemoryMB)
            });

            // 设置画布尺寸
            this.leftPanel.width = panelWidth;
            this.leftPanel.height = panelHeight;
            this.rightPanel.width = panelWidth;
            this.rightPanel.height = panelHeight;

            // 设置画布样式尺寸
            this.leftPanel.style.width = `${panelWidth}px`;
            this.leftPanel.style.height = `${panelHeight}px`;
            this.rightPanel.style.width = `${panelWidth}px`;
            this.rightPanel.style.height = `${panelHeight}px`;

            // 清空画布
            this.leftCtx.clearRect(0, 0, panelWidth, panelHeight);
            this.rightCtx.clearRect(0, 0, panelWidth, panelHeight);

            // 重新生成颜色
            this.generateColors();
            
            // 重新绘制面板
            this.drawPanels();

            return true;
        } catch (error) {
            console.error('Error initializing panels:', error);
            alert(error.message || '初始化游戏失败，请尝试减小方块数量或方块大小');
            return false;
        }
    }

    getRandomColor() {
        let color;
        do {
            color = this.currentColorScheme[Math.floor(Math.random() * this.currentColorScheme.length)];
        } while (!this.colorRules[color]); // 确保选中的颜色在规则系统中
        return color;
    }

    generateColors() {
        // 生成左侧面板的颜色
        this.leftColors = Array(this.height).fill().map(() => 
            Array(this.width).fill().map(() => this.getRandomColor())
        );
        
        // 复制左侧面板的颜色到右侧
        this.rightColors = JSON.parse(JSON.stringify(this.leftColors)); // 深拷贝
        
        // 生成差异点
        this.generateDifferences();
        
        console.log('Colors generated'); // 调试信息
    }

    drawPanel(ctx, colors) {
        ctx.clearRect(0, 0, this.leftPanel.width, this.leftPanel.height);
        
        // 先绘制黑色背景作为网格线
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);
        
        // 在黑色背景上绘制颜色方块，留出1像素的间隔
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                const color = colors[y][x];
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * this.cellSize + 1, 
                    y * this.cellSize + 1, 
                    this.cellSize - 1,  // 留出1像素的间隔
                    this.cellSize - 1   // 留出1像素的间隔
                );
            }
        }

        // 如果开启提示且是右侧面板，绘制提示
        if (this.showHints && ctx === this.rightCtx && this.diffPoints) {
            this.drawHints();
        }
    }

    drawPanels() {
        this.drawPanel(this.leftCtx, this.leftColors);
        this.drawPanel(this.rightCtx, this.rightColors);
    }

    setupEventListeners() {
        // 移除所有旧的事件监听器
        this.leftPanel.removeEventListener('click', this._handleLeftClick);
        this.rightPanel.removeEventListener('click', this._handleRightClick);
        this.leftPanel.removeEventListener('mousemove', this._handleLeftMouseMove);
        this.rightPanel.removeEventListener('mousemove', this._handleRightMouseMove);
        
        // 创建绑定到实例的事件处理函数
        this._handleLeftClick = (e) => this.handleClick(e, 'left');
        this._handleRightClick = (e) => this.handleClick(e, 'right');
        this._handleLeftMouseMove = (e) => this.handleMouseMove(e, 'left');
        this._handleRightMouseMove = (e) => this.handleMouseMove(e, 'right');
        
        // 添加新的事件监听器
        this.leftPanel.addEventListener('click', this._handleLeftClick);
        this.rightPanel.addEventListener('click', this._handleRightClick);
        this.leftPanel.addEventListener('mousemove', this._handleLeftMouseMove);
        this.rightPanel.addEventListener('mousemove', this._handleRightMouseMove);
    }

    startGame() {
        // 重置游戏状态
        this.isGameRunning = true;
        this.resetStats();
        
        // 生成新的颜色和差异点
        this.generateColors();
        
        // 绘制面板
        this.drawPanels();
        
        // 开始计时
        this.startTimer();
        
        console.log('Game started');
        console.log('Panel dimensions:', this.width, this.height);
        console.log('Cell size:', this.cellSize);
        console.log('Diff count:', this.diffCount);
    }

    stopGame() {
        this.isGameRunning = false;
        this.stopTimer();
    }

    resetStats() {
        document.getElementById('errorCount').textContent = '0';
        document.getElementById('foundCount').textContent = '0';
        document.getElementById('timer').textContent = '0.000';
    }

    handleClick(e, side) {
        if (!this.isGameRunning) {
            console.log('Game is not running');
            return;
        }

        const rect = e.target.getBoundingClientRect();
        const scaleX = this.rightPanel.width / rect.width;
        const scaleY = this.rightPanel.height / rect.height;
        
        const x = Math.floor(((e.clientX - rect.left) * scaleX) / this.cellSize);
        const y = Math.floor(((e.clientY - rect.top) * scaleY) / this.cellSize);
        
        // 边界检查
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            console.log('Click outside bounds');
            return;
        }

        // 只在右侧面板点击时检查差异点
        if (side === 'right') {
            const key = `${x},${y}`;
            if (this.diffPoints && this.diffPoints.has(key)) {
                console.log('Found difference point!');
                this.rightColors[y][x] = this.leftColors[y][x];
                this.diffPoints.delete(key);
                
                // 更新找到的差异点数量
                const foundCount = this.diffCount - this.diffPoints.size;
                document.getElementById('foundCount').textContent = foundCount;
                
                this.drawPanels();
                
                // 检查是否找到所有差异点
                if (this.diffPoints.size === 0) {
                    this.gameComplete();
                }
            } else {
                console.log('Missed difference point');
                const errorCount = parseInt(document.getElementById('errorCount').textContent) + 1;
                document.getElementById('errorCount').textContent = errorCount;
            }
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const milliseconds = elapsed % 1000;
            document.getElementById('timer').textContent = 
                `${(seconds + milliseconds/1000).toFixed(3)}`;
        }, 16); // 约60fps的更新频率
    }

    stopTimer() {
        if(this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    gameComplete() {
        if (this.isCustomMode) {
            // 先更新最后的计数和时间
            document.getElementById('foundCount').textContent = this.diffCount;
            const totalTime = document.getElementById('timer').textContent;
            const errorCount = document.getElementById('errorCount').textContent;
            const foundCount = this.diffCount;  // 使用总差异点数量
            
            // 停止游戏和计时器
            this.stopGame();
            
            // 等待一小段时间让界面更新后再显示弹窗
            setTimeout(() => {
                // 使用自定义弹窗
                this.showCustomAlert(`恭喜全部找到！\n差异个数: ${foundCount} 点错次数: ${errorCount}\n总时间: ${totalTime}秒`);
            }, 50);
        } else {
            // 闯关模式下的完成处理
            const totalTime = document.getElementById('timer').textContent;
            const errors = document.getElementById('errorCount').textContent;
            
            const message = `
                完成第 ${this.currentLevel + 1} 关！
                用时：${totalTime}
                错误次数：${errors}
                是否继续下一关？
            `;
            
            if (confirm(message)) {
                this.currentLevel++;
                if (this.currentLevel < this.challengeLevels.length) {
                    this.startChallengeMode();
                } else {
                    alert('恭喜！你已完成所有关卡！');
                    this.currentLevel = 0;
                    this.stopGame();
                    document.getElementById('challengeModeDialog').style.display = 'none';
                }
            } else {
                this.stopGame();
                document.getElementById('challengeModeDialog').style.display = 'none';
            }
        }
    }

    generateDifferences() {
        let diffPoints = new Set();
        let attempts = 0;
        const maxAttempts = this.width * this.height * 2; // 防止无限循环
        
        while (diffPoints.size < this.diffCount && attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const key = `${x},${y}`;
            
            if (!diffPoints.has(key)) {
                const currentColor = this.leftColors[y][x];
                const allowedColors = this.colorRules[currentColor];
                
                if (allowedColors && allowedColors.length > 0) {
                    const newColor = allowedColors[Math.floor(Math.random() * allowedColors.length)];
                    if (newColor !== currentColor) {
                        diffPoints.add(key);
                        this.rightColors[y][x] = newColor;
                        console.log(`Created diff point at ${x},${y}: ${currentColor} -> ${newColor}`);
                    }
                }
            }
        }
        
        this.diffPoints = diffPoints;
        console.log(`Generated ${this.diffPoints.size} difference points:`, Array.from(this.diffPoints));
    }

    isValidColorChange(fromColor, toColor) {
        const allowedColors = this.colorRules[fromColor];
        return allowedColors && allowedColors.includes(toColor);
    }

    handleMouseMove(e, side) {
        if (!this.isGameRunning || !this.isMouseTracking) return;

        const rect = e.target.getBoundingClientRect();
        const scaleX = this.rightPanel.width / rect.width;
        const scaleY = this.rightPanel.height / rect.height;
        
        const x = Math.floor(((e.clientX - rect.left) * scaleX) / this.cellSize);
        const y = Math.floor(((e.clientY - rect.top) * scaleY) / this.cellSize);
        
        // 边界检查
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        // 重新绘制面板
        this.drawPanels();

        // 在两侧面板上显示跟踪效果
        this.leftCtx.save();
        this.rightCtx.save();

        // 绘制左侧面板的跟踪效果
        this.drawCrossHair(x, y, this.leftCtx);
        this.drawHighlightBox(x, y, this.leftCtx);

        // 绘制右侧面板的跟踪效果
        this.drawCrossHair(x, y, this.rightCtx);
        this.drawHighlightBox(x, y, this.rightCtx);

        this.leftCtx.restore();
        this.rightCtx.restore();
    }

    drawCrossHair(x, y, ctx) {
        // 绘制半透明的十字线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        
        // 使用虚线
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        // 垂直线
        ctx.moveTo(x * this.cellSize + this.cellSize/2, 0);
        ctx.lineTo(x * this.cellSize + this.cellSize/2, this.rightPanel.height);
        
        // 水平线
        ctx.moveTo(0, y * this.cellSize + this.cellSize/2);
        ctx.lineTo(this.rightPanel.width, y * this.cellSize + this.cellSize/2);
        
        ctx.stroke();
        
        // 重置虚线设置
        ctx.setLineDash([]);
    }

    drawHighlightBox(x, y, ctx) {
        // 绘制当前方块的高亮边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        
        // 绘制高亮边框
        ctx.strokeRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
        );
        
        // 添加内部阴影效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(
            x * this.cellSize + 1,
            y * this.cellSize + 1,
            this.cellSize - 2,
            this.cellSize - 2
        );
    }

    drawHints() {
        this.rightCtx.save();
        
        this.diffPoints.forEach(point => {
            const [x, y] = point.split(',').map(Number);
            // 同时绘制十字线和高亮框
            this.drawCrossHair(x, y, this.rightCtx);
            this.drawHighlightBox(x, y, this.rightCtx);
        });
        
        this.rightCtx.restore();
    }

    initChallengeMode() {
        this.challengeLevels = [
            { width: 10, height: 10, diffCount: 3 },
            { width: 15, height: 15, diffCount: 5 },
            { width: 20, height: 20, diffCount: 7 },
            { width: 25, height: 25, diffCount: 10 },
            { width: 30, height: 30, diffCount: 15 },
            { width: 40, height: 40, diffCount: 20 }
        ];
        this.currentLevel = 0;
    }

    startChallengeMode() {
        if (!this.challengeLevels) {
            this.initChallengeMode();
        }
        const level = this.challengeLevels[this.currentLevel];
        this.width = level.width;
        this.height = level.height;
        this.diffCount = level.diffCount;
        this.initPanels();
        this.startGame();
        
        // 更新关卡信息
        document.getElementById('currentLevel').textContent = this.currentLevel + 1;
        document.getElementById('challengeModeDialog').style.display = 'flex';
    }

    saveGame() {
        const gameState = {
            leftColors: this.leftColors,
            rightColors: this.rightColors,
            diffPoints: Array.from(this.diffPoints),
            stats: {
                errorCount: document.getElementById('errorCount').textContent,
                foundCount: document.getElementById('foundCount').textContent,
                timer: document.getElementById('timer').textContent
            },
            settings: {
                width: this.width,
                height: this.height,
                diffCount: this.diffCount,
                isCustomMode: this.isCustomMode,
                currentLevel: this.currentLevel,
                colorScheme: this.currentColorScheme === this.colorScheme2
            }
        };
        
        try {
            localStorage.setItem('magicWallSave', JSON.stringify(gameState));
            alert('游戏已保存');
        } catch (error) {
            console.error('保存游戏失败:', error);
            alert('保存游戏失败');
        }
    }

    loadGame() {
        try {
            const savedState = localStorage.getItem('magicWallSave');
            if (savedState) {
                const gameState = JSON.parse(savedState);
                
                // 恢复设置
                this.width = gameState.settings.width;
                this.height = gameState.settings.height;
                this.diffCount = gameState.settings.diffCount;
                this.isCustomMode = gameState.settings.isCustomMode;
                this.currentLevel = gameState.settings.currentLevel;
                this.currentColorScheme = gameState.settings.colorScheme ? 
                    this.colorScheme2 : this.colorScheme1;
                
                // 初始化面板
                this.initPanels();
                
                // 恢复颜色数据
                this.leftColors = gameState.leftColors;
                this.rightColors = gameState.rightColors;
                this.diffPoints = new Set(gameState.diffPoints);
                
                // 恢复统计信息
                document.getElementById('errorCount').textContent = gameState.stats.errorCount;
                document.getElementById('foundCount').textContent = gameState.stats.foundCount;
                document.getElementById('timer').textContent = gameState.stats.timer;
                
                // 重绘面板
                this.drawPanels();
                this.isGameRunning = true;
                this.startTimer();
                
                alert('游戏已加载');
            } else {
                alert('没有找到存档');
            }
        } catch (error) {
            console.error('加载游戏失败:', error);
            alert('加载游戏失败');
        }
    }

    applyCustomMode() {
        const width = parseInt(document.getElementById('widthInput').value);
        const height = parseInt(document.getElementById('heightInput').value);
        const cellSize = parseInt(document.getElementById('cellSizeInput').value);
        const diffCount = parseInt(document.getElementById('diffCountInput').value);
        const isScheme1 = document.getElementById('scheme1').checked;

        // 添加更严格的验证
        const totalCells = width * height;
        if (totalCells > 40000) { // 限制总方块数
            alert('方块总数不能超过40000个，请减小宽度或高度');
            return;
        }

        const panelSize = width * cellSize;
        if (panelSize > 16384) { // 浏览器画布尺寸限制
            alert('画布尺寸过大，请减小方块数量或方块大小');
            return;
        }

        console.log('Applying custom mode settings:', {
            width,
            height,
            cellSize,
            diffCount,
            isScheme1
        });

        // 修改验证输入的限制
        if (width < 10 || width > 200 || height < 10 || height > 200) {
            alert('宽度和高度必须在10-200之间');
            return;
        }

        if (cellSize < 5 || cellSize > 50) {
            alert('魔方大小必须在5-50之间');
            return;
        }

        // 修改差异点数量的验证，防止数量过大导致性能问题
        const maxDiffPoints = Math.min(width * height, 1000); // 限制最大差异点数为1000
        if (diffCount < 1 || diffCount > maxDiffPoints) {
            alert(`差异数量必须大于0且小于${maxDiffPoints}`);
            return;
        }

        // 更新游戏设置
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.diffCount = diffCount;
        this.currentColorScheme = isScheme1 ? this.colorScheme1 : this.colorScheme2;
        
        // 初始化面板
        if (this.initPanels()) {
            document.getElementById('customModeDialog').style.display = 'none';
            this.startGame();
        }
    }

    // 添加自定义弹窗函数
    showCustomAlert(message) {
        // 创建弹窗容器
        const alertContainer = document.createElement('div');
        alertContainer.className = 'custom-alert';

        // 创建弹窗内容
        const alertBox = document.createElement('div');
        alertBox.className = 'custom-alert-content';

        // 添加消息内容
        const messageText = document.createElement('p');
        messageText.textContent = message;

        // 添加确定按钮
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.onclick = () => document.body.removeChild(alertContainer);

        // 组装弹窗
        alertBox.appendChild(messageText);
        alertBox.appendChild(okButton);
        alertContainer.appendChild(alertBox);
        document.body.appendChild(alertContainer);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MagicWall();
});

// 菜单功能实现
function startGame() {
    window.game.startGame();
}

function stopGame() {
    window.game.stopGame();
}

function setCustomMode() {
    window.game.isCustomMode = true;
    document.getElementById('customModeDialog').style.display = 'flex';
}

function setChallengeMode() {
    window.game.isCustomMode = false;
    window.game.startChallengeMode();
}

function setMouseTracking(enabled) {
    window.game.isMouseTracking = enabled;
    // 如果关闭跟踪，重新绘制面板以清除十字线
    if (!enabled) {
        window.game.drawPanels();
    }
}

function setHints(enabled) {
    window.game.showHints = enabled;
    window.game.drawPanels();
}

function applyCustomMode() {
    window.game.applyCustomMode();
}

function closeCustomModeDialog() {
    document.getElementById('customModeDialog').style.display = 'none';
}

function closeChallengeDialog() {
    document.getElementById('challengeModeDialog').style.display = 'none';
    // 停止当前游戏
    window.game.stopGame();
    // 重置关卡
    window.game.currentLevel = 0;
}

function saveGame() {
    window.game.saveGame();
}

function loadGame() {
    window.game.loadGame();
} 