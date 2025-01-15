# 魔方墙找茬模拟器【AIGC_3D视觉实验室出品】

这是一个有趣的找茬游戏，玩家需要在两个看似相同的图案中找出所有的差异点。

## 游戏特点

- 支持自定义模式和闯关模式
- 实时统计游戏数据
- 支持游戏存档功能
- 带有音效反馈
- 可选的鼠标跟踪和提示功能

## 操作说明

### 菜单栏功能

1. **开始游戏**
   - 点击开始新的游戏
   - 游戏开始后计时器会自动启动

2. **游戏模式**
   - 自定义模式：可以自定义游戏参数
   - 闯关模式：共20个关卡，难度逐步提升
     * 第1-5关：初级难度（10x10到50x50方块，1-5个差异点）
     * 方块大小：从28x28像素开始，每关递减1像素
     * 差异点大小：与方块大小相同，随关卡递减
     * 第6-10关：中级难度（60x60到100x100方块，6-10个差异点）
     * 第11-15关：高级难度（110x110到150x150方块，11-15个差异点）
     * 第16-20关：终极挑战（160x160到200x200方块，16-20个差异点）

3. **停止**
   - 终止当前游戏
   - 重置所有游戏数据

4. **鼠标跟踪**
   - 跟踪：显示鼠标移动轨迹
   - 不跟踪：关闭鼠标轨迹显示

5. **提示**
   - 显示：开启游戏提示功能
   - 不显示：关闭游戏提示

6. **魔方存档**
   - 存档：保存当前游戏进度
   - 读档：读取之前保存的游戏进度

### 自定义模式设置

- **宽度**：设置游戏区域宽度（10-200）
- **高度**：设置游戏区域高度（10-200）
- **魔方大小**：设置每个方块的大小（5-50）
- **差异数量**：设置需要找出的差异点数量
- **颜色方案**：选择游戏使用的颜色主题

## 游戏玩法

1. 直接开始游戏或选择游戏模式（自定义/闯关）后点击开始游戏
2. 闯关模式下需要按顺序完成关卡：
   - 每关都有特定的目标和时间限制
   - 完成当前关卡后自动解锁下一关
   - 可以随时回到已解锁的关卡重玩
   - 关卡设计规律：
     * 方块数：从10x10开始，每关增加10x10，最终到200x200
     * 差异点：从1个开始，每关增加1个，最终到20个
     * 难度随关卡提升：方块数增加导致方块变小，差异点增多
3. 仔细观察左右两个面板的差异
4. 用鼠标点击发现的差异点
   - 点击正确：播放正确音效
   - 点击错误：错误计数增加，播放错误音效
5. 找出所有差异点即完成游戏

## 游戏统计

游戏界面底部显示实时统计信息：
- 点击错误次数
- 已找到的差异点数量
- 游戏用时

## 游戏技巧

1. 可以开启鼠标跟踪功能，帮助记录已经检查过的区域
2. 遇到困难时可以开启提示功能
3. 重要关卡建议及时存档
4. 闯关模式建议：
   - 前5关：熟悉游戏机制，练习基本找茬技巧
   - 6-10关：建议开启鼠标跟踪，帮助记录已检查区域
   - 11-15关：需要更细致的观察，建议分区域系统性查找
   - 16-20关：可以适当使用提示功能，注意时间管理

## 注意事项

- 游戏过程中请勿刷新页面，以免丢失游戏进度
- 建议使用电脑浏览器运行游戏以获得最佳体验 