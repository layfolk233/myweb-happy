const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_URL = path.join(__dirname, '..', 'new', 'paint', 'index.html');

// 辅助函数：获取 canvas 在视口中的位置
async function getCanvasCenter(page) {
    return page.evaluate(() => {
        const canvas = document.getElementById('paintCanvas');
        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(rect.left + rect.width / 2),
            y: Math.floor(rect.top + rect.height / 2)
        };
    });
}

// 辅助函数：获取格子中心的视口坐标
async function getCellViewportPos(page, cellX, cellY) {
    return page.evaluate(({ cx, cy }) => {
        const canvas = document.getElementById('paintCanvas');
        const rect = canvas.getBoundingClientRect();
        const CELL = 40;
        return {
            x: Math.floor(rect.left + cx * CELL + CELL / 2),
            y: Math.floor(rect.top + cy * CELL + CELL / 2)
        };
    }, { cx: cellX, cy: cellY });
}

test.describe('Paint Tool - 画图工具', () => {
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(`file://${PAGE_URL}`);
        // Wait for canvas to be ready
        await page.waitForSelector('#paintCanvas', { state: 'attached' });
        await page.waitForTimeout(300);
    });

    test.afterEach(async () => {
        if (page) await page.close();
    });

    // ── DOM 结构验证 ──
    test('页面标题和头部元素正确', async () => {
        const titleText = await page.evaluate(() => document.title);
        expect(titleText).toContain('画图');
        await expect(page.locator('h1.page-header__title')).toHaveText('画图');
        await expect(page.locator('body')).toHaveAttribute('data-nav-current', 'paint');
    });

    test('画布元素存在且尺寸正确', async () => {
        const canvas = page.locator('#paintCanvas');
        await expect(canvas).toBeVisible();
        await expect(canvas).toHaveAttribute('width', '400');
        await expect(canvas).toHaveAttribute('height', '400');
    });

    test('工具栏按钮存在', async () => {
        await expect(page.locator('#btnBrush')).toBeVisible();
        await expect(page.locator('#btnEraser')).toBeVisible();
        await expect(page.locator('#btnClear')).toBeVisible();
        await expect(page.locator('#leftColor')).toBeVisible();
        await expect(page.locator('#rightColor')).toBeVisible();
    });

    test('画笔按钮默认选中', async () => {
        await expect(page.locator('#btnBrush')).toHaveClass(/active/);
        await expect(page.locator('#btnEraser')).not.toHaveClass(/active/);
    });

    // ── 颜色选择器验证 ──
    test('默认颜色正确', async () => {
        // color input 会将大写转为小写，用正则匹配
        await expect(page.locator('#leftColor')).toHaveValue(/#2c2c2c/i);
        await expect(page.locator('#rightColor')).toHaveValue(/#e07a5f/i);
    });

    test('色块显示默认颜色', async () => {
        await expect(page.locator('#leftSwatch')).toHaveCSS('background-color', 'rgb(44, 44, 44)');
        await expect(page.locator('#rightSwatch')).toHaveCSS('background-color', 'rgb(224, 122, 95)');
    });

    // ── 画笔功能验证 ──
    test('左键点击画布应上色', async () => {
        // 格子 (0,0) 的视口坐标
        const pos = await getCellViewportPos(page, 0, 0);
        await page.mouse.click(pos.x, pos.y);

        const pixelColor = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(20, 20, 1, 1).data;
            return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        });

        expect(pixelColor).toBe('rgb(44, 44, 44)');
    });

    test('左键拖拽应绘制连续的像素', async () => {
        const pos0 = await getCellViewportPos(page, 0, 0);
        const pos1 = await getCellViewportPos(page, 2, 0);
        await page.mouse.move(pos0.x, pos0.y);
        await page.mouse.down();
        await page.mouse.move(pos1.x, pos1.y);
        await page.mouse.up();

        const pixels = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, 120, 1).data;
            const colors = [];
            for (let i = 0; i < data.length; i += 4) {
                // 只记录非白非灰（网格线）的像素
                if (data[i] < 200 && data[i + 1] < 200 && data[i + 2] < 200) {
                    colors.push(`rgb(${data[i]}, ${data[i+1]}, ${data[i+2]})`);
                }
            }
            return colors.length;
        });

        // 应该有 >= 3 个深色像素（格子 0,0 / 1,0 / 2,0 的部分区域）
        expect(pixels).toBeGreaterThanOrEqual(3);
    });

    test('右键点击应使用右键颜色填充', async () => {
        const pos = await getCellViewportPos(page, 5, 5);
        // move 到格子中心 + 微小偏移以避开网格线
        await page.mouse.move(pos.x + 2, pos.y + 2);
        await page.mouse.down({ button: 'right' });
        await page.mouse.up({ button: 'right' });

        // 采样格子 (5,5) 中心
        const pixelColor = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(202, 202, 1, 1).data;
            return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        });

        // 右键颜色 #E07A5F 容差 ±20（网格线可能影响）
        const parts = pixelColor.match(/\d+/g).map(Number);
        expect(Math.abs(parts[0] - 224)).toBeLessThanOrEqual(20);
        expect(Math.abs(parts[1] - 122)).toBeLessThanOrEqual(20);
        expect(Math.abs(parts[2] - 95)).toBeLessThanOrEqual(20);
    });

    // ── 工具切换验证 ──
    test('切换到橡皮擦工具', async () => {
        await page.click('#btnEraser');
        await expect(page.locator('#btnEraser')).toHaveClass(/active/);
        await expect(page.locator('#btnBrush')).not.toHaveClass(/active/);
    });

    test('橡皮擦模式左键拖拽应擦除像素', async () => {
        const pos = await getCellViewportPos(page, 1, 1);
        // 先用画笔上色：move + down + up（模拟左键点击）
        await page.mouse.move(pos.x, pos.y);
        await page.mouse.down({ button: 'left' });
        await page.waitForTimeout(50); // 等待绘制完成
        await page.mouse.up({ button: 'left' });
        let pixelColor = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(55, 55, 1, 1).data;
            return data[0] < 200 ? 'dark' : 'light';
        });
        expect(pixelColor).toBe('dark');

        // 切换到橡皮擦
        await page.click('#btnEraser');

        // 在相同位置擦除
        await page.mouse.move(pos.x, pos.y);
        await page.mouse.down({ button: 'left' });
        await page.waitForTimeout(50);
        await page.mouse.up({ button: 'left' });
        pixelColor = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(55, 55, 1, 1).data;
            return data[0] < 200 ? 'dark' : 'light';
        });
        expect(pixelColor).toBe('light');
    });

    // ── 清空画布验证 ──
    test('清空按钮应恢复白色画布', async () => {
        const pos0 = await getCellViewportPos(page, 1, 1);
        const pos1 = await getCellViewportPos(page, 3, 3);
        // 先画一些东西：move + down + up
        await page.mouse.move(pos0.x, pos0.y);
        await page.mouse.down({ button: 'left' });
        await page.waitForTimeout(50);
        await page.mouse.up({ button: 'left' });
        await page.mouse.move(pos1.x, pos1.y);
        await page.mouse.down({ button: 'left' });
        await page.waitForTimeout(50);
        await page.mouse.up({ button: 'left' });

        // 确认有颜色
        let darkCount = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, 400, 400).data;
            let count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) count++;
            }
            return count;
        });
        expect(darkCount).toBeGreaterThan(0);

        // 清空
        await page.click('#btnClear');

        // 检查是否恢复白色
        const whiteCount = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, 400, 400).data;
            let white = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) white++;
            }
            return white;
        });

        // 应该绝大多数是白色（允许网格线的少量误差）
        expect(whiteCount).toBeGreaterThan(140000); // 400*400=160000, >87% 是白色
    });

    // ── 颜色选择器联动验证 ──
    test('更改左键颜色后，色块应同步更新', async () => {
        // 通过 JS 模拟 color input 事件
        await page.evaluate(() => {
            const input = document.getElementById('leftColor');
            input.value = '#FF0000';
            input.dispatchEvent(new Event('input'));
        });

        await expect(page.locator('#leftSwatch')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    });

    test('更改右键颜色后，色块应同步更新', async () => {
        await page.evaluate(() => {
            const input = document.getElementById('rightColor');
            input.value = '#00FF00';
            input.dispatchEvent(new Event('input'));
        });

        await expect(page.locator('#rightSwatch')).toHaveCSS('background-color', 'rgb(0, 255, 0)');
    });

    test('使用新颜色绘制时应该使用最新颜色', async () => {
        // 更改左键颜色为红色
        await page.evaluate(() => {
            const input = document.getElementById('leftColor');
            input.value = '#FF0000';
            input.dispatchEvent(new Event('input'));
        });

        // 用新颜色画：move + down + up
        const pos = await getCellViewportPos(page, 1, 1);
        await page.mouse.move(pos.x, pos.y);
        await page.mouse.down({ button: 'left' });
        await page.waitForTimeout(50);
        await page.mouse.up({ button: 'left' });

        const pixelColor = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(55, 55, 1, 1).data;
            return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        });

        expect(pixelColor).toBe('rgb(255, 0, 0)');
    });

    // ── 边界验证 ──
    test('点击画布外不应绘制', async () => {
        const darkPixelsBefore = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, 400, 400).data;
            let count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) count++;
            }
            return count;
        });

        // 在画布外点击
        // 获取 canvas 边界外的一点
        const canvasRect = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const rect = canvas.getBoundingClientRect();
            return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        });
        // 点击 canvas 上方（导航栏区域）
        await page.mouse.click(canvasRect.left + 20, canvasRect.top - 50);

        const darkPixelsAfter = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, 400, 400).data;
            let count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) count++;
            }
            return count;
        });

        expect(darkPixelsAfter).toBe(darkPixelsBefore);
    });

    test('画布网格线存在', async () => {
        // 网格线是灰色的 (rgba(0,0,0,0.08))，不是纯白也不是纯黑
        // 检查一个网格线位置（例如 x=40, y=20 应该是竖线）
        const gridPixel = await page.evaluate(() => {
            const canvas = document.getElementById('paintCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(40, 20, 1, 1).data;
            return { r: data[0], g: data[1], b: data[2] };
        });

        // 网格线应该是接近白色的浅灰色，不是纯白也不是纯黑
        expect(gridPixel.r).toBeGreaterThan(230);
        expect(gridPixel.r).toBeLessThan(255);
    });
});
