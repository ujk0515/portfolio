// ========================================
// Edge Function 설정
// ========================================

const EDGE_FUNCTION_URL = 'https://ceilxgtgkfvvvfcgkmlx.supabase.co/functions/v1/abcd';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaWx4Z3Rna2Z2dnZmY2drbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjM4NzYsImV4cCI6MjA3NDk5OTg3Nn0.6F7g4VS-Uz8Cv0iKsGTiG2X0xP7lTfIfaN91gKifjpA';

// Edge Function을 통해 파일 URL 가져오기
async function getFileUrl(fileName) {
    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ fileName })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch file URL');
        }

        const data = await response.json();
        return data.publicUrl;
    } catch (error) {
        console.error('Error fetching file URL:', error);
        return null;
    }
}

// ========================================
// 테마 관리
// ========================================

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        document.body.classList.toggle('light-theme', savedTheme === 'light');
    } else {
        document.body.classList.toggle('light-theme', !prefersDark);
    }

    updateThemeIcon();
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeBtn = document.getElementById('themeToggle');
    const isLight = document.body.classList.contains('light-theme');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        document.body.classList.toggle('light-theme', !e.matches);
        updateThemeIcon();
    }
});

// ========================================
// 사이드바 토글
// ========================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

function initSidebarToggleFromMain() {
    const mainContent = document.getElementById('mainContent');

    mainContent.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) {
            const rect = mainContent.getBoundingClientRect();
            if (e.clientX - rect.left < 60 && e.clientY - rect.top < 60) {
                toggleSidebar();
            }
        }
    });
}

// ========================================
// 메뉴 네비게이션
// ========================================

function switchSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    const menuItems = document.querySelectorAll('.menu-item:not(.disabled)');
    menuItems.forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const activeMenuItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }

    // 섹션 변경 시 파일 로드
    if (sectionId !== 'dashboard') {
        loadFileFromSupabase(sectionId);
    }
}

// ========================================
// Supabase 파일 로드
// ========================================

async function loadFileFromSupabase(section) {
    const viewer = document.querySelector(`#${section} .file-viewer`);

    // 로딩 화면 표시
    viewer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">로딩 중입니다...</div>
        </div>
    `;

    try {
        // 파일명 매핑
        const fileMapping = {
            'cover-letter': 'cover-letter/resume.pdf',
            'career': 'cover-letter/career.pdf'
        };

        const fileName = fileMapping[section];
        if (!fileName) {
            viewer.innerHTML = '<p>파일 정보를 찾을 수 없습니다.</p>';
            return;
        }

        // Edge Function을 통해 파일 URL 가져오기
        const publicUrl = await getFileUrl(fileName);

        if (publicUrl) {
            await displayFile(section, publicUrl, 'pdf');
        } else {
            viewer.innerHTML = '<p>파일을 찾을 수 없습니다. Supabase에 파일을 업로드해주세요.</p>';
        }
    } catch (error) {
        console.error('파일 로드 에러:', error);
        viewer.innerHTML = '<p>파일을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 포트폴리오 상세 보기
function showPortfolioDetail(portfolioId) {
    // 포트폴리오 상세 섹션으로 전환
    switchSection('portfolio-detail');

    // 제목 업데이트
    const title = document.getElementById('portfolioTitle');
    title.textContent = `프로젝트 ${portfolioId}`;

    // 파일 로드
    loadPortfolioFile(portfolioId);
}

// 포트폴리오 파일 로드
async function loadPortfolioFile(portfolioId) {
    const viewer = document.querySelector('#portfolio-detail .file-viewer');

    // 로딩 화면 표시
    viewer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">로딩 중입니다...</div>
        </div>
    `;

    try {
        const fileName = `cover-letter/portfolio-${portfolioId}.pdf`;

        // Edge Function을 통해 파일 URL 가져오기
        const publicUrl = await getFileUrl(fileName);

        if (publicUrl) {
            await displayFile('portfolio-detail', publicUrl, 'pdf');
        } else {
            viewer.innerHTML = '<p>파일을 찾을 수 없습니다. Supabase에 파일을 업로드해주세요.</p>';
        }
    } catch (error) {
        console.error('포트폴리오 파일 로드 에러:', error);
        viewer.innerHTML = '<p>파일을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

async function displayFile(section, fileUrl, fileType) {
    const viewer = document.querySelector(`#${section} .file-viewer`);

    if (fileType === 'pdf') {
        viewer.innerHTML = '<canvas id="pdf-canvas-' + section + '"></canvas>';
        await renderPDF(fileUrl, section);
    } else if (fileType === 'image') {
        viewer.innerHTML = `<img src="${fileUrl}" alt="${section}">`;
    } else {
        viewer.innerHTML = `<p>지원하지 않는 파일 형식입니다.</p>`;
    }
}

// PDF 렌더링 함수
async function renderPDF(url, section) {
    const canvas = document.getElementById('pdf-canvas-' + section);
    const viewer = document.querySelector(`#${section} .file-viewer`);

    try {
        // PDF.js 워커 설정
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        // 캔버스 컨테이너로 교체
        viewer.innerHTML = '<div class="pdf-container" id="pdf-container-' + section + '"></div>';
        const container = document.getElementById('pdf-container-' + section);

        // 모든 페이지 렌더링
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = 'pdf-page';

            container.appendChild(canvas);

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        }
    } catch (error) {
        console.error('PDF 렌더링 에러:', error);
        viewer.innerHTML = '<p>PDF를 불러올 수 없습니다.</p>';
    }
}

// ========================================
// 초기화
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

    initSidebarToggleFromMain();

    // 메인 메뉴 아이템 클릭 이벤트
    const menuItems = document.querySelectorAll('.menu-item:not(.disabled):not(.has-submenu)');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // 서브메뉴 토글 (포트폴리오 카드 그리드도 표시)
    const submenuToggle = document.querySelector('.menu-item.has-submenu');
    if (submenuToggle) {
        submenuToggle.addEventListener('click', (e) => {
            e.preventDefault();

            // 서브메뉴 토글
            const submenu = submenuToggle.nextElementSibling;
            submenuToggle.classList.toggle('open');
            submenu.classList.toggle('open');

            // 포트폴리오 섹션으로 이동 (카드 그리드 표시)
            const section = submenuToggle.getAttribute('data-section');
            switchSection(section);

            // 서브메뉴가 열릴 때 마퀴 효과 체크
            if (submenu.classList.contains('open')) {
                setTimeout(() => {
                    initMarqueeEffect();
                }, 300); // 애니메이션 완료 후
            }
        });
    }

    // 서브메뉴 아이템 클릭 이벤트 (포트폴리오 상세로 이동)
    const submenuItems = document.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const portfolioId = item.getAttribute('data-portfolio');
            showPortfolioDetail(portfolioId);

            // 서브메뉴 활성화 상태 업데이트
            submenuItems.forEach(si => si.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 포트폴리오 카드 클릭 이벤트
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    portfolioCards.forEach(card => {
        card.addEventListener('click', () => {
            const portfolioId = card.getAttribute('data-portfolio');
            showPortfolioDetail(portfolioId);
        });
    });

    // 뒤로가기 버튼
    const backToGrid = document.getElementById('backToGrid');
    if (backToGrid) {
        backToGrid.addEventListener('click', () => {
            switchSection('portfolio');
        });
    }

    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.getElementById('sidebar').classList.add('collapsed');
    }

    // 페이지 로드 시 대시보드 활성화
    switchSection('dashboard');

    // 포트폴리오 카드 썸네일 로드
    loadPortfolioThumbnails();

    // AI 포트폴리오 카드 클릭 이벤트
    const aiCards = document.querySelectorAll('.ai-card');
    aiCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 링크 클릭이 아닌 경우만 카드 클릭으로 처리
            if (e.target.tagName !== 'A') {
                const url = card.getAttribute('data-url');
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    });
});

// 마퀴 효과 초기화
function initMarqueeEffect() {
    const submenuItems = document.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        const textElement = item.querySelector('.marquee-text');
        if (textElement && !textElement.classList.contains('scrolling')) {
            // 텍스트 영역이 부모 요소를 넘치는지 확인
            const textWidth = textElement.scrollWidth;
            const itemWidth = item.clientWidth - 40; // padding 제외 (좌측 40px)

            // 1px 이상 차이나면 마퀴 적용
            if (textWidth >= itemWidth) {
                textElement.classList.add('scrolling');
                // 핑퐁 애니메이션은 복제 불필요 (원본 텍스트만 좌우로 이동)
            }
        }
    });
}

// 포트폴리오 카드 썸네일 로드
async function loadPortfolioThumbnails() {
    for (let i = 1; i <= 5; i++) {
        const card = document.querySelector(`.portfolio-card[data-portfolio="${i}"]`);
        if (card) {
            const previewElement = card.querySelector('.card-preview');
            await renderThumbnail(i, previewElement);
        }
    }
}

// 썸네일 렌더링
async function renderThumbnail(portfolioId, container) {
    try {
        const fileName = `cover-letter/portfolio-${portfolioId}.pdf`;

        // Edge Function을 통해 파일 URL 가져오기
        const publicUrl = await getFileUrl(fileName);

        if (publicUrl) {
            // PDF.js 워커 설정
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const loadingTask = pdfjsLib.getDocument(publicUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // 첫 페이지만

            const scale = 0.5; // 썸네일 크기
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'cover';

            container.innerHTML = '';
            container.appendChild(canvas);

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        }
    } catch (error) {
        console.error(`썸네일 로드 실패 (Portfolio ${portfolioId}):`, error);
        // 에러 시 기본 플레이스홀더 유지
    }
}