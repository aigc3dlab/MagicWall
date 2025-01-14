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

            // 初始化音效
            this.sounds = {};
            this.initSounds();
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

            // 在游戏开始前绘制初始图案
            if (!this.isGameRunning) {
                this.drawInitialPattern();
            } else {
                // 重新生成颜色
                this.generateColors();
                // 重新绘制面板
                this.drawPanels();
            }

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

        this.playSound('start');
    }

    stopGame() {
        this.isGameRunning = false;
        this.stopTimer();
        
        // 清空游戏数据
        this.leftColors = null;
        this.rightColors = null;
        this.diffPoints = null;
        
        // 重置统计信息
        document.getElementById('errorCount').textContent = '0';
        document.getElementById('foundCount').textContent = '0';
        document.getElementById('timer').textContent = '00:00:00';
        
        // 重新初始化面板，显示初始图案
        this.initPanels();
        
        console.log('Game stopped');
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
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }

        if (side === 'right') {
            const key = `${x},${y}`;
            if (this.diffPoints && this.diffPoints.has(key)) {
                this.playSound('correct');
                console.log('Found difference point!');
                
                // 更新颜色和状态
                this.rightColors[y][x] = this.leftColors[y][x];
                this.diffPoints.delete(key);
                
                const foundCount = this.diffCount - this.diffPoints.size;
                document.getElementById('foundCount').textContent = foundCount;
                
                // 在两边同时播放特效
                this.createParticles(x, y, this.leftCtx);
                this.createParticles(x, y, this.rightCtx);
                
                // 延迟重绘面板，让特效有时间显示
                setTimeout(() => {
                    this.drawPanels();
                    
                    if (this.diffPoints.size === 0) {
                        setTimeout(() => {
                            this.playSound('complete');
                            this.gameComplete();
                        }, 500);
                    }
                }, 500);
                
            } else {
                this.playSound('wrong');
                console.log('Missed difference point');
                const errorCount = parseInt(document.getElementById('errorCount').textContent) + 1;
                document.getElementById('errorCount').textContent = errorCount;
                
                // 点错时也在两边显示特效，但使用不同的颜色
                this.createErrorParticles(x, y, this.leftCtx);
                this.createErrorParticles(x, y, this.rightCtx);
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

    // 添加绘制初始图案的方法
    drawInitialPattern() {
        // 随机选择一个图案
        const patterns = [this.drawHexagonPattern, this.drawCirclePattern, 
                         this.drawSquarePattern, this.drawStarPattern];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        randomPattern.call(this);
    }

    // 1. 六边形蜂窝图案
    drawHexagonPattern() {
        const colors = [
            'rgba(147, 112, 219, 0.8)',  // 浅紫色
            'rgba(138, 43, 226, 0.8)',   // 紫罗兰
            'rgba(106, 90, 205, 0.9)',   // 深紫色
            'rgba(153, 50, 204, 0.8)',   // 深兰花紫
            'rgba(186, 85, 211, 0.8)'    // 中兰花紫
        ];

        const centerX = (this.width * this.cellSize) / 2;
        const centerY = (this.height * this.cellSize) / 2;

        [this.leftCtx, this.rightCtx].forEach(ctx => {
            ctx.save();
            
            // 设置背景
            ctx.fillStyle = 'rgba(28, 27, 34, 1)';
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            // 六边形参数
            const hexSize = this.cellSize * 2;
            const hexHeight = hexSize * Math.sqrt(3);
            const hexWidth = hexSize * 2;
            const hexVertical = hexHeight * 0.75;

            // 绘制六边形网格
            for (let row = -2; row < this.height + 2; row++) {
                for (let col = -2; col < this.width + 2; col++) {
                    const x = col * hexWidth * 0.75;
                    const y = row * hexVertical;
                    const offset = (row % 2) * (hexWidth * 0.375);

                    // 计算到中心的距离
                    const dx = x + offset - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 创建渐变
                    const gradient = ctx.createRadialGradient(
                        x + offset, y, 0,
                        x + offset, y, hexSize
                    );

                    const colorIndex = Math.floor((distance / (hexSize * 2)) % colors.length);
                    const nextColorIndex = (colorIndex + 1) % colors.length;

                    gradient.addColorStop(0, colors[colorIndex]);
                    gradient.addColorStop(1, colors[nextColorIndex]);

                    // 绘制六边形
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3;
                        const xPos = x + offset + hexSize * Math.cos(angle);
                        const yPos = y + hexSize * Math.sin(angle);
                        if (i === 0) {
                            ctx.moveTo(xPos, yPos);
                        } else {
                            ctx.lineTo(xPos, yPos);
                        }
                    }
                    ctx.closePath();
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // 添加发光效果
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            // 添加中心光晕效果
            const centerGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, this.cellSize * 10
            );
            centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            centerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = centerGradient;
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            // 添加文字和装饰
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制主标题
            ctx.fillText('魔方墙找茬', centerX, centerY - 20);
            
            // 绘制副标题
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('AIGC_3D视觉实验室', centerX, centerY + 30);

            // 添加装饰线条
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 150, centerY - 50);
            ctx.lineTo(centerX + 150, centerY - 50);
            ctx.moveTo(centerX - 150, centerY + 60);
            ctx.lineTo(centerX + 150, centerY + 60);
            ctx.stroke();

            ctx.restore();
        });
    }

    // 2. 同心圆图案
    drawCirclePattern() {
        const colors = [
            'rgba(75, 0, 130, 0.8)',     // 靛蓝
            'rgba(147, 112, 219, 0.8)',  // 浅紫色
            'rgba(138, 43, 226, 0.8)',   // 紫罗兰
            'rgba(106, 90, 205, 0.9)',   // 深紫色
            'rgba(153, 50, 204, 0.8)'    // 深兰花紫
        ];

        const centerX = (this.width * this.cellSize) / 2;
        const centerY = (this.height * this.cellSize) / 2;

        [this.leftCtx, this.rightCtx].forEach(ctx => {
            ctx.save();
            
            // 设置背景
            ctx.fillStyle = 'rgba(28, 27, 34, 1)';
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            // 绘制同心圆
            const maxRadius = Math.max(centerX, centerY) * 1.5;
            for (let radius = maxRadius; radius > 0; radius -= this.cellSize) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                const colorIndex = Math.floor((radius / this.cellSize) % colors.length);
                ctx.fillStyle = colors[colorIndex];
                ctx.fill();
            }

            // 添加发光效果
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, maxRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            this.drawText(ctx, centerX, centerY);
            ctx.restore();
        });
    }

    // 3. 方形螺旋图案
    drawSquarePattern() {
        const colors = [
            'rgba(147, 112, 219, 0.8)',  // 浅紫色
            'rgba(138, 43, 226, 0.8)',   // 紫罗兰
            'rgba(106, 90, 205, 0.9)',   // 深紫色
            'rgba(153, 50, 204, 0.8)',   // 深兰花紫
            'rgba(186, 85, 211, 0.8)'    // 中兰花紫
        ];

        const centerX = (this.width * this.cellSize) / 2;
        const centerY = (this.height * this.cellSize) / 2;

        [this.leftCtx, this.rightCtx].forEach(ctx => {
            ctx.save();
            
            // 设置背景
            ctx.fillStyle = 'rgba(28, 27, 34, 1)';
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            // 绘制方形螺旋
            const size = Math.min(this.width, this.height) * this.cellSize / 2;
            for (let i = size; i > 0; i -= this.cellSize) {
                ctx.beginPath();
                ctx.rect(centerX - i, centerY - i, i * 2, i * 2);
                const colorIndex = Math.floor((i / this.cellSize) % colors.length);
                ctx.fillStyle = colors[colorIndex];
                ctx.fill();
                
                // 旋转方形
                ctx.translate(centerX, centerY);
                ctx.rotate(Math.PI / 32);
                ctx.translate(-centerX, -centerY);
            }

            this.drawText(ctx, centerX, centerY);
            ctx.restore();
        });
    }

    // 4. 星形图案
    drawStarPattern() {
        const colors = [
            'rgba(147, 112, 219, 0.8)',  // 浅紫色
            'rgba(138, 43, 226, 0.8)',   // 紫罗兰
            'rgba(106, 90, 205, 0.9)',   // 深紫色
            'rgba(153, 50, 204, 0.8)',   // 深兰花紫
            'rgba(186, 85, 211, 0.8)'    // 中兰花紫
        ];

        const centerX = (this.width * this.cellSize) / 2;
        const centerY = (this.height * this.cellSize) / 2;

        [this.leftCtx, this.rightCtx].forEach(ctx => {
            ctx.save();
            
            // 设置背景
            ctx.fillStyle = 'rgba(28, 27, 34, 1)';
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            // 绘制多层星形
            const maxRadius = Math.max(centerX, centerY);
            for (let radius = maxRadius; radius > 0; radius -= this.cellSize * 2) {
                this.drawStar(ctx, centerX, centerY, 8, radius, radius/2, 
                             colors[Math.floor((radius / this.cellSize) % colors.length)]);
            }

            // 添加发光效果
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, maxRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);

            this.drawText(ctx, centerX, centerY);
            ctx.restore();
        });
    }

    // 辅助方法：绘制星形
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            ctx.lineTo(cx + Math.sin(angle) * radius, cy - Math.cos(angle) * radius);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    // 辅助方法：绘制文字
    drawText(ctx, centerX, centerY) {
        // 添加文字和装饰
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制主标题
        ctx.fillText('魔方墙找茬', centerX, centerY - 20);
        
        // 绘制副标题
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('AIGC_3D视觉实验室', centerX, centerY + 30);

        // 添加装饰线条
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 150, centerY - 50);
        ctx.lineTo(centerX + 150, centerY - 50);
        ctx.moveTo(centerX - 150, centerY + 60);
        ctx.lineTo(centerX + 150, centerY + 60);
        ctx.stroke();
    }

    // 添加散花特效方法
    createParticles(x, y, ctx) {
        const particles = [];
        const rings = [];
        const particleCount = 40; // 增加粒子数量
        const colors = [
            'rgba(255, 255, 255, 0.9)',  // 白色
            'rgba(147, 112, 219, 0.9)',  // 浅紫色
            'rgba(138, 43, 226, 0.9)',   // 紫罗兰
            'rgba(106, 90, 205, 0.9)',   // 深紫色
            'rgba(186, 85, 211, 0.9)'    // 中兰花紫
        ];

        // 创建爆炸粒子
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 3 + Math.random() * 3; // 增加速度
            particles.push({
                x: x * this.cellSize + this.cellSize / 2,
                y: y * this.cellSize + this.cellSize / 2,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }

        // 创建扩散环
        for (let i = 0; i < 3; i++) {
            rings.push({
                x: x * this.cellSize + this.cellSize / 2,
                y: y * this.cellSize + this.cellSize / 2,
                radius: 0,
                life: 1,
                maxRadius: 50 + i * 20,
                speed: 2 + i * 0.5
            });
        }

        // 保存原始画布内容
        const originalCanvas = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 动画函数
        const animate = () => {
            // 恢复原始画布内容
            ctx.putImageData(originalCanvas, 0, 0);
            
            // 绘制扩散环
            rings.forEach((ring, index) => {
                if (ring.life > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${ring.life * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
                    ctx.stroke();

                    // 更新环
                    ring.radius += ring.speed;
                    ring.life -= ring.radius / (ring.maxRadius * 2);
                }
            });

            // 更新和绘制粒子
            particles.forEach((particle, index) => {
                // 更新位置
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vx *= 0.98; // 添加阻力
                particle.vy *= 0.98;
                particle.rotation += particle.rotationSpeed;
                particle.life -= 0.02;

                // 如果粒子还活着就绘制
                if (particle.life > 0) {
                    ctx.save();
                    ctx.translate(particle.x, particle.y);
                    ctx.rotate(particle.rotation);
                    
                    // 绘制星形粒子
                    ctx.beginPath();
                    const points = 4;
                    for (let i = 0; i < points * 2; i++) {
                        const radius = i % 2 === 0 ? particle.size : particle.size / 2;
                        const angle = (Math.PI * i) / points;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    
                    // 创建渐变填充
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
                    gradient.addColorStop(0, particle.color.replace('0.9', '1'));
                    gradient.addColorStop(1, particle.color.replace('0.9', '0'));
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    // 添加发光效果
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = particle.color;
                    
                    ctx.restore();
                }
            });

            // 如果还有活跃的粒子或环，继续动画
            if (particles.some(p => p.life > 0) || rings.some(r => r.life > 0)) {
                requestAnimationFrame(animate);
            } else {
                // 动画结束后重绘面板
                this.drawPanels();
            }
        };

        // 开始动画
        animate();
    }

    // 添加错误特效方法
    createErrorParticles(x, y, ctx) {
        // 复制原有的createParticles方法，但使用红色系的颜色
        const particles = [];
        const rings = [];
        const particleCount = 40;
        const colors = [
            'rgba(255, 0, 0, 0.9)',    // 红色
            'rgba(255, 69, 0, 0.9)',   // 红橙色
            'rgba(255, 99, 71, 0.9)',  // 番茄红
            'rgba(220, 20, 60, 0.9)',  // 猩红色
            'rgba(178, 34, 34, 0.9)'   // 深红色
        ];

        // ... 其余代码与createParticles相同，只是使用新的颜色数组 ...
        // 复制createParticles方法的其余部分，保持逻辑不变
    }

    // 添加播放音效的方法
    playSound(soundName) {
        try {
            if (this.sounds[soundName]) {
                const sound = this.sounds[soundName];
                sound.currentTime = 0;
                const playPromise = sound.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error(`Error playing sound ${soundName}:`, error);
                    });
                }
            } else {
                console.warn(`Sound not found: ${soundName}`);
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    // 添加音效初始化方法
    initSounds() {
        const soundFiles = {
            correct: 'sounds/correct.mp3',
            wrong: 'sounds/wrong.mp3',
            start: 'sounds/start.mp3',
            complete: 'sounds/complete.mp3'
        };

        // 初始化每个音效
        for (const [name, path] of Object.entries(soundFiles)) {
            this.sounds[name] = new Audio(path);
            this.sounds[name].load();
            this.sounds[name].volume = 0.5; // 设置音量为50%
            
            // 添加加载错误处理
            this.sounds[name].onerror = () => {
                console.error(`Failed to load sound: ${path}`);
            };
            
            // 添加加载成功日志
            this.sounds[name].oncanplaythrough = () => {
                console.log(`Sound loaded successfully: ${path}`);
            };
        }
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