document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo UI từ CONFIG
    document.title = `${CONFIG.displayName} | ${CONFIG.bio}`;
    document.getElementById('avatar-img').src = CONFIG.avatar;
    document.getElementById('display-name').textContent = CONFIG.displayName;
    document.getElementById('username').textContent = `@${CONFIG.username}`;
    document.getElementById('bio').textContent = CONFIG.bio;
    document.getElementById('version').textContent = CONFIG.version;
    document.getElementById('year').textContent = new Date().getFullYear();

    if (CONFIG.verified) {
        document.getElementById('verified-badge').style.display = 'block';
    }

    // Dynamic Background Fallback
    if (CONFIG.background) {
        document.body.style.backgroundImage = `url('${CONFIG.background}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }

    // 2. Render Link Cards
    const linksContainer = document.getElementById('links-container');
    CONFIG.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'link-card ripple';
        a.target = '_blank';
        a.innerHTML = `
            <div class="link-icon">${link.icon}</div>
            <div class="link-content">
                <h3>${link.title}</h3>
                <p>${link.description}</p>
            </div>
        `;
        linksContainer.appendChild(a);
    });

    // 3. Hệ thống Âm thanh (Auto-play sau tương tác đầu + LocalStorage)
    const audio = new Audio(CONFIG.music);
    audio.loop = true;
    const volumeSlider = document.getElementById('volume-slider');
    const musicBtn = document.getElementById('music-btn');
    
    // Khôi phục cài đặt Volume
    const savedVolume = localStorage.getItem('hbx_volume');
    if (savedVolume) {
        audio.volume = savedVolume;
        volumeSlider.value = savedVolume;
    }

    let isPlaying = false;
    let userInteracted = false;

    const playMusic = () => {
        audio.play().then(() => {
            isPlaying = true;
            musicBtn.textContent = '⏸ Tạm Dừng';
            musicBtn.style.background = 'var(--primary)';
            musicBtn.style.color = '#000';
        }).catch(err => console.log("Trình duyệt chặn autoplay"));
    };

    // Tự động phát khi user click bất kỳ đâu lần đầu (Bypass Autoplay Policy)
    document.body.addEventListener('click', () => {
        if (!userInteracted && CONFIG.music) {
            userInteracted = true;
            playMusic();
        }
    }, { once: true });

    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Ngăn kích hoạt sự kiện body click
        if (isPlaying) {
            audio.pause();
            musicBtn.textContent = '🎵 Bật Nhạc';
            musicBtn.style.background = 'transparent';
            musicBtn.style.color = 'var(--primary)';
        } else {
            playMusic();
        }
        isPlaying = !isPlaying;
        userInteracted = true;
    });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        localStorage.setItem('hbx_volume', e.target.value);
    });

    // 4. Loading Screen & Visitor Counter
    setTimeout(() => {
        const loader = document.getElementById('loading');
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }, 1500);

    let visits = localStorage.getItem('hbx_visits') || 0;
    visits++;
    localStorage.setItem('hbx_visits', visits);
    document.getElementById('visits').textContent = visits;

    // 5. Đồng hồ Digital
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString('vi-VN');
    }, 1000);

    // 6. Mouse Glow Effect
    if (CONFIG.cursorEffect) {
        const glow = document.querySelector('.cursor-glow');
        document.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
    }

    // 7. Matrix Rain Effect (Tuỳ chọn bật/tắt trong config)
    if (CONFIG.matrix) {
        const canvas = document.getElementById('matrix-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = '01HACKBORYｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'.split('');
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        setInterval(drawMatrix, 50);
        
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
});
