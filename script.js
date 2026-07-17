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

    // 3. Hệ thống Âm thanh (Tự động nhận diện tên file MP3 + Lặp 1 bài + Tự upload)
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isLoopingSingle = false; 
    let userInteracted = false;
    const audio = new Audio();
    
    const trackTitleEl = document.getElementById('track-title');
    const musicBtn = document.getElementById('music-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const loopBtn = document.getElementById('loop-btn');
    const playlistBtn = document.getElementById('playlist-btn');
    const playlistModal = document.getElementById('playlist-modal');
    const closePlaylistBtn = document.getElementById('close-playlist');
    const playlistListEl = document.getElementById('playlist-list');
    const trackCountEl = document.getElementById('track-count');
    const volumeSlider = document.getElementById('volume-slider');
    const customFileInput = document.getElementById('custom-file-input');

    // --- HÀM THÔNG MINH: TỰ NHẬN DIỆN TÊN BÀI HÁT TỪ TÊN FILE ---
    const getAutoTrackName = (pathOrObject) => {
        // Nếu là dạng chuỗi "sound/hoa hồng đỏ.mp3" thì lấy chuỗi, nếu dạng object cũ thì lấy src
        let filePath = typeof pathOrObject === 'string' ? pathOrObject : (pathOrObject.name || pathOrObject.src || "");
        
        // 1. Lấy phần tên file sau dấu / cuối cùng (Cắt bỏ chữ "sound/")
        let fileName = filePath.split('/').pop().split('\\').pop();
        
        // 2. Tự động xóa đuôi file (.mp3, .wav, .m4a, .flac, .ogg...)
        fileName = fileName.replace(/\.[^/.]+$/, "");
        
        // Trả về tên bài hát đã sạch đẹp (VD: "hoa hồng đỏ")
        return fileName || "Unnamed Track";
    };

    const getTrackSrc = (pathOrObject) => {
        return typeof pathOrObject === 'string' ? pathOrObject : pathOrObject.src;
    };

    // --- RENDER DANH SÁCH BÀI HÁT ---
    const renderPlaylist = () => {
        playlistListEl.innerHTML = '';
        if (!CONFIG.playlist || CONFIG.playlist.length === 0) return;
        
        trackCountEl.textContent = CONFIG.playlist.length;
        CONFIG.playlist.forEach((track, idx) => {
            const autoName = getAutoTrackName(track);
            const li = document.createElement('li');
            li.className = `playlist-item ${idx === currentTrackIndex ? 'playing' : ''}`;
            li.innerHTML = `<span>🎵 ${autoName}</span> <small>#${idx + 1}</small>`;
            
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                currentTrackIndex = idx;
                loadTrack(currentTrackIndex);
                playMusic();
                
                // Bấm chọn bài trong list -> Tự động bật chế độ lặp lại 1 bài đó
                if (!isLoopingSingle) toggleLoopMode(); 
                
                updatePlaylistUI();
                playlistModal.style.display = 'none';
            });
            playlistListEl.appendChild(li);
        });
    };

    const updatePlaylistUI = () => {
        const items = playlistListEl.querySelectorAll('.playlist-item');
        items.forEach((item, idx) => {
            if (idx === currentTrackIndex) item.classList.add('playing');
            else item.classList.remove('playing');
        });
    };

    // --- TẢI BÀI HÁT ---
    const loadTrack = (index) => {
        if (CONFIG.playlist && CONFIG.playlist.length > 0) {
            const track = CONFIG.playlist[index];
            audio.src = getTrackSrc(track);
            // Tự hiển thị tên đã nhận diện lên màn hình chạy chữ
            trackTitleEl.textContent = `▶ ${getAutoTrackName(track)}`;
            updatePlaylistUI();
        }
    };

    // Khởi tạo
    renderPlaylist();
    loadTrack(currentTrackIndex);

    // Khôi phục Volume
    const savedVolume = localStorage.getItem('hbx_volume');
    if (savedVolume) {
        audio.volume = savedVolume;
        volumeSlider.value = savedVolume;
    }

    // --- CÁC HÀM ĐIỀU KHIỂN ---
    const playMusic = () => {
        audio.play().then(() => {
            isPlaying = true;
            musicBtn.textContent = '⏸ Tạm Dừng';
            musicBtn.style.background = 'var(--primary)';
            musicBtn.style.color = '#000';
        }).catch(() => console.log("Chờ tương tác..."));
    };

    const pauseMusic = () => {
        audio.pause();
        isPlaying = false;
        musicBtn.textContent = '▶ Bật Nhạc';
        musicBtn.style.background = 'transparent';
        musicBtn.style.color = 'var(--primary)';
    };

    const nextTrack = () => {
        currentTrackIndex = (currentTrackIndex + 1) % CONFIG.playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) playMusic();
    };

    const prevTrack = () => {
        currentTrackIndex = (currentTrackIndex - 1 + CONFIG.playlist.length) % CONFIG.playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) playMusic();
    };

    const toggleLoopMode = () => {
        isLoopingSingle = !isLoopingSingle;
        if (isLoopingSingle) {
            loopBtn.textContent = '🔂';
            loopBtn.title = "Chế độ: Đang lặp lại 1 bài liên tục";
            loopBtn.classList.add('active-loop');
        } else {
            loopBtn.textContent = '🔁';
            loopBtn.title = "Chế độ: Lặp toàn bộ danh sách";
            loopBtn.classList.remove('active-loop');
        }
    };

    audio.addEventListener('ended', () => {
        if (isLoopingSingle) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextTrack();
        }
    });

    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) pauseMusic(); else playMusic();
        userInteracted = true;
    });

    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });
    loopBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLoopMode(); });
    
    playlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playlistModal.style.display = (playlistModal.style.display === 'none') ? 'block' : 'none';
    });
    closePlaylistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playlistModal.style.display = 'none';
    });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        localStorage.setItem('hbx_volume', e.target.value);
    });

    // --- TỰ NHẬN DIỆN KHI KHÁCH UPLOAD FILE TỪ MÁY HỌ ---
    customFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileURL = URL.createObjectURL(file);
            audio.src = fileURL;
            
            // Tự động nhận diện tên file khách tải lên và XÓA ĐUÔI .mp3
            const cleanUploadedName = file.name.replace(/\.[^/.]+$/, "");
            trackTitleEl.textContent = `▶ FILE CỦA BẠN: ${cleanUploadedName}`;
            
            if (!isLoopingSingle) toggleLoopMode();
            
            playMusic();
            userInteracted = true;
            playlistModal.style.display = 'none';
        }
    });

    document.body.addEventListener('click', () => {
        if (!userInteracted && CONFIG.playlist && CONFIG.playlist.length > 0) {
            userInteracted = true;
            playMusic();
        }
    }, { once: true });

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
