class Heart {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = window.innerHeight + 100;
        this.size = Math.random() * 15 + 10;
        this.speed = Math.random() * 2 + 1;
        this.opacity = 1;
        this.hue = Math.random() * 60 + 320; // 粉色范围
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        
        // 重新设计爱心形状
        const s = this.size;
        ctx.moveTo(this.x, this.y + s * 0.3);
        ctx.bezierCurveTo(
            this.x, this.y, 
            this.x - s, this.y, 
            this.x - s, this.y - s * 0.5
        );
        ctx.bezierCurveTo(
            this.x - s, this.y - s * 1.1,
            this.x - s * 0.5, this.y - s * 1.2,
            this.x, this.y - s * 0.7
        );
        ctx.bezierCurveTo(
            this.x + s * 0.5, this.y - s * 1.2,
            this.x + s, this.y - s * 1.1,
            this.x + s, this.y - s * 0.5
        );
        ctx.bezierCurveTo(
            this.x + s, this.y, 
            this.x, this.y, 
            this.x, this.y + s * 0.3
        );

        ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${this.opacity})`;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.y -= this.speed;
        this.opacity -= 0.005;
        return this.opacity > 0;
    }
}

class RainbowCursor {
    constructor() {
        this.points = [];
        this.maxPoints = 80; // 增加点的数量使轨迹更长
        this.hue = 0;
        this.lineWidth = 2; // 统一细线条
        this.fadeOutTime = 1000; // 1秒淡出时间
    }

    addPoint(x, y) {
        const timestamp = Date.now();
        this.points.push({ 
            x, 
            y, 
            hue: this.hue,
            width: this.lineWidth,
            alpha: 0.6,  // 提高基础透明度
            timestamp
        });
        
        // 移除超过淡出时间的点
        const now = Date.now();
        this.points = this.points.filter(point => now - point.timestamp < this.fadeOutTime);
        
        this.hue = (this.hue + 2) % 360; // 减慢颜色变化速度
    }

    draw(ctx) {
        ctx.lineCap = 'round';
        const now = Date.now();
        
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            
            // 基于时间计算透明度
            const age = now - p1.timestamp;
            const alpha = Math.max(0, 0.6 * (1 - age / this.fadeOutTime));
            
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, `hsla(${p1.hue}, 100%, 60%, ${alpha})`);
            gradient.addColorStop(1, `hsla(${p2.hue}, 100%, 60%, ${alpha})`);
            
            ctx.beginPath();
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = gradient;
            
            // 使用二次贝塞尔曲线使轨迹更平滑
            if (i < this.points.length - 1) {
                const p3 = this.points[i + 1];
                const xc = (p2.x + p3.x) / 2;
                const yc = (p2.y + p3.y) / 2;
                
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(p2.x, p2.y, xc, yc);
            } else {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            
            ctx.stroke();
        }
    }
}

// 初始化效果
document.addEventListener('DOMContentLoaded', () => {
    // 爱心画布设置
    const heartCanvas = document.getElementById('heartCanvas');
    const heartCtx = heartCanvas.getContext('2d');
    heartCanvas.width = window.innerWidth;
    heartCanvas.height = window.innerHeight;

    // 光标画布设置
    const cursorCanvas = document.getElementById('cursorCanvas');
    const cursorCtx = cursorCanvas.getContext('2d');
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;

    const hearts = [];
    const rainbowCursor = new RainbowCursor();
    let lastMoveTime = 0;
    const moveThrottle = 16; // 约60fps的采样率

    // 创建爱心
    function createHeart() {
        if (Math.random() < 0.1) { // 控制爱心生成频率
            hearts.push(new Heart());
        }
    }

    // 更新和绘制爱心
    function updateHearts() {
        heartCtx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);
        
        for (let i = hearts.length - 1; i >= 0; i--) {
            const heart = hearts[i];
            if (!heart.update()) {
                hearts.splice(i, 1);
            } else {
                heart.draw(heartCtx);
            }
        }
    }

    // 动画循环
    function animate() {
        createHeart();
        updateHearts();
        requestAnimationFrame(animate);
    }

    // 处理鼠标移动
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastMoveTime >= moveThrottle) {
            const x = e.clientX;
            const y = e.clientY;
            
            rainbowCursor.addPoint(x, y);
            
            cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
            rainbowCursor.draw(cursorCtx);
            
            lastMoveTime = now;
        }
    });

    // 处理窗口大小变化
    window.addEventListener('resize', () => {
        heartCanvas.width = window.innerWidth;
        heartCanvas.height = window.innerHeight;
        cursorCanvas.width = window.innerWidth;
        cursorCanvas.height = window.innerHeight;
    });

    // 启动动画
    animate();
}); 