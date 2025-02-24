document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.photo-container');
    const photos = document.querySelectorAll('.photo');
    let rotationY = 0;
    let rotationX = 0;
    let autoRotationSpeed = 0.2;
    let lastTime = 0;
    let isDragging = false;
    let isRotating = true;
    let startX, startY;
    let lastX, lastY;
    let activePhoto = null;
    let lastTouchX, lastTouchY;
    let initialTouchDistance = 0;
    let currentScale = 1;

    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    function arrangePhotos() {
        const totalPhotos = photos.length;
        const angleStep = (360 / totalPhotos);
        const radius = 400;

        photos.forEach((photo, index) => {
            const angle = index * angleStep;
            const radian = (angle * Math.PI) / 180;
            
            // 修改变换顺序，确保照片始终围绕中心点旋转
            const transform = `
                rotateY(${angle}deg)
                translateZ(${radius}px)
            `;
            
            photo.style.transform = transform;
            photo.style.left = '50%';
            photo.style.top = '50%';
            photo.style.marginLeft = '-100px';
            photo.style.marginTop = '-140px';
            
            photo.dataset.initialTransform = transform;
            photo.dataset.angle = angle;
            
            photo.style.opacity = '0';
            setTimeout(() => {
                photo.style.opacity = '1';
                photo.style.transition = 'all 0.5s ease';
            }, index * 100);
        });
    }

    function updateRotation(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (!isDragging && isRotating) {
            rotationY += autoRotationSpeed * (deltaTime / 16);
            updateTransform();
        }

        requestAnimationFrame(updateRotation);
    }

    function updateTransform() {
        // 限制X轴旋转范围
        rotationX = Math.max(-45, Math.min(45, rotationX));
        container.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${currentScale})`;
    }

    // 处理照片悬停效果
    photos.forEach(photo => {
        photo.addEventListener('mouseenter', () => {
            if (!isDragging) {
                activePhoto = photo;
                const baseAngle = parseFloat(photo.dataset.angle);
                const globalRotation = rotationY % 360;
                const relativeAngle = (baseAngle + globalRotation) % 360;
                
                // 根据照片位置调整缩放方向
                const transform = `
                    ${photo.dataset.initialTransform}
                    scale(1.2)
                    translateZ(50px)
                `;
                
                photo.style.transform = transform;
                photo.style.zIndex = '10';
            }
        });

        photo.addEventListener('mouseleave', () => {
            if (!isDragging) {
                photo.style.transform = photo.dataset.initialTransform;
                photo.style.zIndex = '1';
                activePhoto = null;
            }
        });

        photo.addEventListener('click', (e) => {
            e.stopPropagation();
            isRotating = !isRotating;
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('photo')) {
            isRotating = true;
        }
    });

    // 优化的3D拖拽控制
    container.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('photo')) {
            // 如果点击的是照片，延迟开始拖动
            setTimeout(() => {
                if (e.target === activePhoto) {
                    isDragging = true;
                    isRotating = false;
                }
            }, 100);
        } else {
            isDragging = true;
            isRotating = false;
        }
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        // 添加移动阈值和平滑处理
        if (Math.abs(deltaX) < 100 && Math.abs(deltaY) < 100) {
            rotationY += deltaX * 0.5;
            rotationX -= deltaY * 0.5;
            updateTransform();
        }
        
        lastX = e.clientX;
        lastY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        isRotating = false;
        const delta = e.deltaY * 0.5;
        rotationY += delta;
        updateTransform();
    });

    // 添加触摸事件支持
    if (isMobile) {
        // 触摸开始
        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            isDragging = true;
            isRotating = false;

            // 处理多点触控（缩放）
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        });

        // 触摸移动
        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDragging) return;

            // 单点触控（旋转）
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - lastTouchX;
                const deltaY = touch.clientY - lastTouchY;

                if (Math.abs(deltaX) < 100 && Math.abs(deltaY) < 100) {
                    rotationY += deltaX * 0.5;
                    rotationX -= deltaY * 0.5;
                    rotationX = Math.max(-45, Math.min(45, rotationX));
                    updateTransform();
                }

                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
            }
            // 双指缩放
            else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                if (initialTouchDistance > 0) {
                    const scale = currentDistance / initialTouchDistance;
                    currentScale = Math.max(0.5, Math.min(2, scale));
                    container.style.transform = `${container.style.transform} scale(${currentScale})`;
                }
            }
        });

        // 触摸结束
        container.addEventListener('touchend', () => {
            isDragging = false;
            initialTouchDistance = 0;
        });

        // 禁用双击缩放
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    arrangePhotos();
    requestAnimationFrame(updateRotation);
}); 