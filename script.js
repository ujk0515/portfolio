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

// 모든 서브메뉴 닫기
function closeAllSubmenus() {
    const openMenus = document.querySelectorAll('.menu-item.has-submenu.open');
    const openSubmenus = document.querySelectorAll('.submenu.open');

    openMenus.forEach(menu => menu.classList.remove('open'));
    openSubmenus.forEach(submenu => submenu.classList.remove('open'));
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

    // 섹션 변경 시 파일 로드 (PDF 전용 섹션만)
    if (sectionId === 'career') {
        loadFileFromSupabase(sectionId);
    } else if (sectionId === 'automation-scripts') {
        // 스크립트 섹션은 항상 새로고침 (리스트로 돌아감)
        document.getElementById('scriptsListView').style.display = 'block';
        document.getElementById('scriptEditorView').style.display = 'none';
        currentPage = 1;
        allScripts = [];
        loadScriptsList();
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

    // 현재 ID 저장
    currentPortfolioId = portfolioId;

    // 제목 매핑
    const portfolioTitles = {
        '1': 'Tool_Katalon_studio_with_Gemini_AI',
        '2': 'Game_컴프야_개선안',
        '3': '사용법_Testmo_사용법',
        '4': '사용법_iOS_memory_누수검증',
        '5': '이론_QA의 목적'
    };

    // 제목 업데이트
    const title = document.getElementById('portfolioTitle');
    title.textContent = portfolioTitles[portfolioId] || `프로젝트 ${portfolioId}`;

    // 파일 로드
    loadPortfolioFile(portfolioId);
}

// 이력서/자기소개서 상세 보기
function showResumeDetail(resumeType) {
    // 상세 섹션으로 전환
    switchSection('resume-detail');

    // 현재 타입 저장
    currentResumeType = resumeType;

    // 제목 업데이트
    const title = document.getElementById('resumeTitle');
    const titleMap = {
        'resume': '이력서',
        'cover-letter': '자기소개서'
    };
    title.textContent = titleMap[resumeType];

    // 파일 로드
    loadResumeFile(resumeType);
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

// 이력서/자기소개서 파일 로드
async function loadResumeFile(resumeType) {
    const viewer = document.querySelector('#resume-detail .file-viewer');

    // 로딩 화면 표시
    viewer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">로딩 중입니다...</div>
        </div>
    `;

    try {
        const fileMap = {
            'resume': 'cover-letter/resume.pdf',
            'cover-letter': 'cover-letter/cover-letter.pdf'
        };

        const fileName = fileMap[resumeType];

        // Edge Function을 통해 파일 URL 가져오기
        const publicUrl = await getFileUrl(fileName);

        if (publicUrl) {
            await displayFile('resume-detail', publicUrl, 'pdf');
        } else {
            viewer.innerHTML = '<p>파일을 찾을 수 없습니다. Supabase에 파일을 업로드해주세요.</p>';
        }
    } catch (error) {
        console.error('이력서 파일 로드 에러:', error);
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

            // 다른 메뉴로 이동 시 열려있는 서브메뉴 닫기
            closeAllSubmenus();

            switchSection(section);
        });
    });

    // 서브메뉴 토글 (카드 그리드 표시)
    const submenuToggles = document.querySelectorAll('.menu-item.has-submenu');
    submenuToggles.forEach(submenuToggle => {
        submenuToggle.addEventListener('click', (e) => {
            e.preventDefault();

            // 현재 클릭한 메뉴가 이미 열려있는지 확인
            const isCurrentlyOpen = submenuToggle.classList.contains('open');

            // 모든 서브메뉴 먼저 닫기
            closeAllSubmenus();

            // 서브메뉴 토글 (이미 열려있었으면 닫고, 닫혀있었으면 열기)
            const submenu = submenuToggle.nextElementSibling;
            if (!isCurrentlyOpen) {
                submenuToggle.classList.add('open');
                submenu.classList.add('open');
            }

            // 섹션으로 이동 (카드 그리드 표시)
            const section = submenuToggle.getAttribute('data-section');
            switchSection(section);

            // 서브메뉴가 열릴 때 마퀴 효과 체크
            if (submenu.classList.contains('open')) {
                setTimeout(() => {
                    initMarqueeEffect();
                }, 300); // 애니메이션 완료 후
            }
        });
    });

    // 서브메뉴 아이템 클릭 이벤트
    const submenuItems = document.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // 포트폴리오인지 이력서인지 확인
            const portfolioId = item.getAttribute('data-portfolio');
            const resumeType = item.getAttribute('data-resume');

            if (portfolioId) {
                showPortfolioDetail(portfolioId);
            } else if (resumeType) {
                showResumeDetail(resumeType);
            }

            // 서브메뉴 활성화 상태 업데이트
            submenuItems.forEach(si => si.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 카드 클릭 이벤트 (포트폴리오 + 이력서)
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    portfolioCards.forEach(card => {
        card.addEventListener('click', () => {
            const portfolioId = card.getAttribute('data-portfolio');
            const resumeType = card.getAttribute('data-resume');

            if (portfolioId) {
                showPortfolioDetail(portfolioId);
            } else if (resumeType) {
                showResumeDetail(resumeType);
            }
        });
    });

    // 뒤로가기 버튼
    const backToGrid = document.getElementById('backToGrid');
    if (backToGrid) {
        backToGrid.addEventListener('click', () => {
            switchSection('portfolio');
        });
    }

    const backToResumeGrid = document.getElementById('backToResumeGrid');
    if (backToResumeGrid) {
        backToResumeGrid.addEventListener('click', () => {
            switchSection('resume-cover');
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

    // 이력서&자기소개서 카드 썸네일 로드
    loadResumeThumbnails();

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

    // 중간 섹션 링크 클릭 이벤트
    const sectionLinks = document.querySelectorAll('.section-link');
    sectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');

            // 서브메뉴 닫기
            closeAllSubmenus();

            switchSection(section);
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

// 이력서&자기소개서 카드 썸네일 로드
async function loadResumeThumbnails() {
    const resumeTypes = ['resume', 'cover-letter'];
    for (const type of resumeTypes) {
        const card = document.querySelector(`.portfolio-card[data-resume="${type}"]`);
        if (card) {
            const previewElement = card.querySelector('.card-preview');
            await renderResumeThumbnail(type, previewElement);
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

// 이력서 썸네일 렌더링
async function renderResumeThumbnail(resumeType, container) {
    try {
        const fileMap = {
            'resume': 'cover-letter/resume.pdf',
            'cover-letter': 'cover-letter/cover-letter.pdf'
        };

        const fileName = fileMap[resumeType];

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
        console.error(`썸네일 로드 실패 (${resumeType}):`, error);
        // 에러 시 기본 플레이스홀더 유지
    }
}

// ========================================
// 다운로드 기능
// ======================================== 

let currentResumeType = null;
let currentPortfolioId = null;

// 이력서&자기소개서 전체 다운로드 (ZIP)
async function downloadResumeAll() {
    try {
        const zip = new JSZip();
        const files = [
            { path: 'cover-letter/resume.pdf', name: 'QA_지원자_유재권_이력서.pdf' },
            { path: 'cover-letter/cover-letter.pdf', name: 'QA_지원자_유재권_자기소개서.pdf' }
        ];

        for (const file of files) {
            const url = await getFileUrl(file.path);
            if (url) {
                const response = await fetch(url);
                const blob = await response.blob();
                zip.file(file.name, blob);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'QA_지원자_유재권_이력서&자기소개서.zip';
        link.click();
    } catch (error) {
        console.error('다운로드 실패:', error);
        alert('다운로드 중 오류가 발생했습니다.');
    }
}

// 포트폴리오 전체 다운로드 (ZIP)
async function downloadPortfolioAll() {
    try {
        const zip = new JSZip();
        const portfolioTitles = {
            '1': 'Tool_Katalon_studio_with_Gemini_AI',
            '2': 'Game_컴프야_개선안',
            '3': '사용법_Testmo_사용법',
            '4': '사용법_iOS_memory_누수검증',
            '5': '이론_QA의 목적'
        };

        for (let i = 1; i <= 5; i++) {
            const url = await getFileUrl(`cover-letter/portfolio-${i}.pdf`);
            if (url) {
                const response = await fetch(url);
                const blob = await response.blob();
                zip.file(`QA_지원자_유재권_${portfolioTitles[i]}.pdf`, blob);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'QA_지원자_유재권_포트폴리오.zip';
        link.click();
    } catch (error) {
        console.error('다운로드 실패:', error);
        alert('다운로드 중 오류가 발생했습니다.');
    }
}

// 경력기술서 다운로드
async function downloadCareer() {
    await downloadSingleFile('cover-letter/career.pdf', 'QA_지원자_유재권_경력기술서.pdf');
}

// 현재 보고 있는 이력서/자기소개서 다운로드
async function downloadCurrentResume() {
    if (!currentResumeType) return;

    const fileMap = {
        'resume': { path: 'cover-letter/resume.pdf', name: 'QA_지원자_유재권_이력서.pdf' },
        'cover-letter': { path: 'cover-letter/cover-letter.pdf', name: 'QA_지원자_유재권_자기소개서.pdf' }
    };

    const file = fileMap[currentResumeType];
    await downloadSingleFile(file.path, file.name);
}

// 현재 보고 있는 포트폴리오 다운로드
async function downloadCurrentPortfolio() {
    if (!currentPortfolioId) return;

    const portfolioTitles = {
        '1': 'Tool_Katalon_studio_with_Gemini_AI',
        '2': 'Game_컴프야_개선안',
        '3': '사용법_Testmo_사용법',
        '4': '사용법_iOS_memory_누수검증',
        '5': '이론_QA의 목적'
    };

    const fileName = `QA_지원자_유재권_${portfolioTitles[currentPortfolioId]}.pdf`;
    await downloadSingleFile(`cover-letter/portfolio-${currentPortfolioId}.pdf`, fileName);
}

// 단일 파일 다운로드 헬퍼 함수
async function downloadSingleFile(filePath, downloadName) {
    try {
        const url = await getFileUrl(filePath);
        if (!url) {
            alert('파일을 찾을 수 없습니다.');
            return;
        }

        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = downloadName;
        link.click();
    } catch (error) {
        console.error('다운로드 실패:', error);
        alert('다운로드 중 오류가 발생했습니다.');
    }
}

// ========================================
// 단기 자동화 스크립트 관리
// ======================================== 

const SCRIPTS_FOLDER = 'automation-scripts'; // Supabase Storage 폴더명

let monacoEditor = null;
let currentEditingScript = null;
let isEditMode = false;

// 페이지네이션 변수
let allScripts = []; // 전체 스크립트 목록
let currentPage = 1;
const itemsPerPage = 20;

// Monaco Editor 초기화
function initMonacoEditor() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

    require(['vs/editor/editor.main'], function () {
        const isDarkTheme = !document.body.classList.contains('light-theme');

        monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
            value: '// 여기에 코드를 입력하세요\n',
            language: 'javascript',
            theme: isDarkTheme ? 'vs-dark' : 'vs',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
        });

        // 언어 선택 변경 시 에디터 언어 변경
        document.getElementById('scriptLanguage').addEventListener('change', (e) => {
            const language = e.target.value;
            monaco.editor.setModelLanguage(monacoEditor.getModel(), language);
        });
    });
}

// 스크립트 목록 보기로 전환
function showScriptsList() {
    document.getElementById('scriptsListView').style.display = 'block';
    document.getElementById('scriptEditorView').style.display = 'none';
    currentEditingScript = null;
    isEditMode = false;

    // 이미 로드된 스크립트가 있으면 다시 렌더링만 (페이지 유지)
    if (allScripts.length > 0) {
        renderScriptsPage();
    } else {
        loadScriptsList();
    }
}

// 에디터 보기로 전환 (읽기 전용)
function showScriptEditor(scriptData = null) {
    document.getElementById('scriptsListView').style.display = 'none';
    document.getElementById('scriptEditorView').style.display = 'flex';

    if (!monacoEditor) {
        initMonacoEditor();
        // Monaco 초기화 대기 후 데이터 설정
        setTimeout(() => {
            if (scriptData) {
                setEditorContent(scriptData);
            }
        }, 500);
    } else {
        if (scriptData) {
            setEditorContent(scriptData);
        }
    }
}

function setEditorContent(scriptData) {
    if (!monacoEditor) return;

    isEditMode = false;
    currentEditingScript = scriptData;
    document.getElementById('scriptFileName').value = scriptData.name;
    document.getElementById('scriptLanguage').value = scriptData.language;
    monacoEditor.setValue(scriptData.content);
    monaco.editor.setModelLanguage(monacoEditor.getModel(), scriptData.language);
    monacoEditor.updateOptions({ readOnly: true });
}

// Supabase Storage에서 스크립트 목록 가져오기
async function loadScriptsList() {
    const tableBody = document.getElementById('scriptsTableBody');
    const scriptsListView = document.getElementById('scriptsListView');

    tableBody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; padding: 40px;">
                <div class="loading-container">
                    <div class="spinner"></div>
                    <div class="loading-text">스크립트 목록을 불러오는 중...</div>
                </div>
            </td>
        </tr>
    `;

    try {
        // Supabase Storage API로 폴더 내 파일 목록 가져오기 (POST 방식)
        const response = await fetch('https://ceilxgtgkfvvvfcgkmlx.supabase.co/storage/v1/object/list/portfolio-files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prefix: SCRIPTS_FOLDER,
                limit: 100,
                offset: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Storage API Error:', errorText);
            throw new Error(`Storage API failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Scripts data:', data);

        // 폴더 자체를 제외하고 실제 파일만 필터링
        allScripts = data.filter(item => item.name && item.name !== SCRIPTS_FOLDER && !item.name.endsWith('/'));

        if (allScripts.length === 0) {
            scriptsListView.innerHTML = `
                <div class="empty-scripts-message">
                    <div class="empty-icon">📝</div>
                    <h3>저장된 스크립트가 없습니다</h3>
                    <p>Supabase Storage의 automation-scripts 폴더에 스크립트 파일을 업로드해주세요.</p>
                </div>
            `;
            return;
        }

        // 첫 페이지 렌더링
        currentPage = 1;
        renderScriptsPage();
    } catch (error) {
        console.error('스크립트 목록 로드 에러:', error);
        scriptsListView.innerHTML = `
            <div class="empty-scripts-message">
                <div class="empty-icon">⚠️</div>
                <h3>스크립트 목록을 불러올 수 없습니다</h3>
                <p>오류: ${error.message}</p>
                <p style="margin-top: 10px; font-size: 0.9em; color: #888;">
                    Supabase Storage의 portfolio-files 버킷 권한을 확인해주세요.<br>
                    버킷이 Public 또는 인증된 사용자만 읽기 가능하도록 설정되어야 합니다.
                </p>
            </div>
        `;
    }
}

// 현재 페이지의 스크립트 렌더링
function renderScriptsPage() {
    const tableBody = document.getElementById('scriptsTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageScripts = allScripts.slice(startIndex, endIndex);

    // 테이블 행 렌더링
    tableBody.innerHTML = '';
    pageScripts.forEach((script, index) => {
        const globalIndex = startIndex + index + 1; // 전체 목록 기준 번호
        const row = createScriptRow(script, globalIndex);
        tableBody.appendChild(row);
    });

    // 페이지네이션 렌더링
    renderPagination();
}

// 페이지네이션 UI 렌더링
function renderPagination() {
    const totalPages = Math.ceil(allScripts.length / itemsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    // 페이지가 1개 이하면 페이지네이션 숨김
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';

    // 이전/다음 버튼 상태
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    // 페이지 번호 생성
    pageNumbers.innerHTML = '';

    const maxVisiblePages = 7; // 최대 표시 페이지 수
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 4) {
            startPage = 1;
            endPage = 5;
        } else if (currentPage >= totalPages - 3) {
            startPage = totalPages - 4;
            endPage = totalPages;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }

    // 첫 페이지
    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) {
            addEllipsis();
        }
    }

    // 중간 페이지들
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }

    // 마지막 페이지
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis();
        }
        addPageNumber(totalPages);
    }
}

function addPageNumber(pageNum) {
    const pageNumbers = document.getElementById('pageNumbers');
    const pageBtn = document.createElement('div');
    pageBtn.className = 'page-number';
    pageBtn.textContent = pageNum;

    if (pageNum === currentPage) {
        pageBtn.classList.add('active');
    }

    pageBtn.addEventListener('click', () => {
        currentPage = pageNum;
        renderScriptsPage();
    });

    pageNumbers.appendChild(pageBtn);
}

function addEllipsis() {
    const pageNumbers = document.getElementById('pageNumbers');
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-ellipsis';
    ellipsis.textContent = '...';
    pageNumbers.appendChild(ellipsis);
}

// 스크립트 테이블 행 생성
function createScriptRow(scriptFile, rowNumber) {
    const row = document.createElement('tr');

    const fileName = scriptFile.name;
    const language = detectLanguage(fileName);

    row.innerHTML = `
        <td class="script-no">${rowNumber}</td>
        <td class="script-name">${fileName}</td>
        <td class="script-language">
            <span class="language-badge">${language}</span>
        </td>
    `;

    // 행 클릭 시 뷰어로 이동
    row.addEventListener('click', () => viewScript(fileName));

    return row;
}

// 파일명으로 언어 감지
function detectLanguage(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
        'js': 'JavaScript',
        'py': 'Python',
        'sh': 'Shell',
        'bash': 'Bash',
        'txt': 'Text',
        'html': 'HTML',
        'css': 'CSS',
        'json': 'JSON',
        'yaml': 'YAML',
        'yml': 'YAML',
        'groovy': 'Groovy',
        'dart': 'Flutter'
    };
    return languageMap[ext] || 'Unknown';
}

// 파일명에서 Monaco 언어 코드 추출
function getMonacoLanguage(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
        'js': 'javascript',
        'py': 'python',
        'sh': 'shell',
        'bash': 'shell',
        'txt': 'plaintext',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'groovy': 'javascript', // Groovy는 JavaScript로 표시
        'dart': 'dart'
    };
    return languageMap[ext] || 'plaintext';
}

// 스크립트 내용 로드
async function loadScriptContent(fileName) {
    const fullPath = `${SCRIPTS_FOLDER}/${fileName}`;
    const fileUrl = await getFileUrl(fullPath);
    if (!fileUrl) {
        throw new Error('파일 URL을 가져올 수 없습니다.');
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error('파일을 불러올 수 없습니다.');
    }

    return await response.text();
}

// 스크립트 보기
async function viewScript(fileName) {
    try {
        const content = await loadScriptContent(fileName);
        const language = getMonacoLanguage(fileName);

        showScriptEditor({
            name: fileName,
            language: language,
            content: content
        });
    } catch (error) {
        alert('스크립트를 불러오는 데 실패했습니다: ' + error.message);
    }
}

// 테이블 정렬 기능
let currentSortColumn = null;
let currentSortDirection = 'asc';

function initTableSorting() {
    const headers = document.querySelectorAll('.scripts-table th[data-sort]');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            sortTable(sortKey, header);
        });
    });
}

function sortTable(sortKey, headerElement) {
    // 정렬 방향 결정
    if (currentSortColumn === sortKey) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
    }
    currentSortColumn = sortKey;

    // 모든 헤더에서 정렬 클래스 제거
    document.querySelectorAll('.scripts-table th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // 현재 헤더에 정렬 클래스 추가
    headerElement.classList.add(`sort-${currentSortDirection}`);

    // allScripts 배열 정렬
    allScripts.sort((a, b) => {
        let aValue, bValue;

        switch(sortKey) {
            case 'no':
                // 파일명으로 정렬 (no는 순서이므로)
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'language':
                aValue = detectLanguage(a.name).toLowerCase();
                bValue = detectLanguage(b.name).toLowerCase();
                break;
        }

        if (aValue < bValue) return currentSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // 첫 페이지로 이동하고 다시 렌더링
    currentPage = 1;
    renderScriptsPage();
}

// 이벤트 리스너 등록 (자동화 스크립트 섹션)
document.addEventListener('DOMContentLoaded', () => {
    // + 새 스크립트 버튼 숨기기 (읽기 전용이므로 불필요)
    const addScriptBtn = document.getElementById('addScriptBtn');
    if (addScriptBtn) {
        addScriptBtn.style.display = 'none';
    }

    // 목록으로 돌아가기 버튼
    const backToScriptsList = document.getElementById('backToScriptsList');
    if (backToScriptsList) {
        backToScriptsList.addEventListener('click', () => {
            showScriptsList();
        });
    }

    // 저장 버튼 숨기기 (읽기 전용)
    const saveScriptBtn = document.getElementById('saveScriptBtn');
    if (saveScriptBtn) {
        saveScriptBtn.style.display = 'none';
    }

    // 테이블 정렬 이벤트 초기화
    initTableSorting();

    // 페이지네이션 이전/다음 버튼 이벤트
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderScriptsPage();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allScripts.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderScriptsPage();
            }
        });
    }
});

// ========================================
// 방문자 카운터 시스템
// ========================================

const SUPABASE_URL = 'https://ceilxgtgkfvvvfcgkmlx.supabase.co';

// 고유 방문자 ID 생성 또는 가져오기
function getVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
}

// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// 방문자 수 조회
async function getVisitorCount() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/visitor_count?id=eq.1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch visitor count');
        }

        const data = await response.json();
        if (data && data.length > 0) {
            return data[0].total_count;
        }
        return 0;
    } catch (error) {
        console.error('방문자 수 조회 에러:', error);
        return 0;
    }
}

// 오늘 이미 방문했는지 확인
async function hasVisitedToday(visitorId, todayDate) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/daily_visitors?visitor_id=eq.${visitorId}&visit_date=eq.${todayDate}`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to check visit status');
        }

        const data = await response.json();
        return data && data.length > 0;
    } catch (error) {
        console.error('방문 확인 에러:', error);
        return true; // 에러 시 이미 방문한 것으로 간주 (중복 카운트 방지)
    }
}

// 오늘의 방문 기록 추가
async function recordVisit(visitorId, todayDate) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_visitors`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                visitor_id: visitorId,
                visit_date: todayDate
            })
        });

        if (!response.ok) {
            throw new Error('Failed to record visit');
        }

        return true;
    } catch (error) {
        console.error('방문 기록 에러:', error);
        return false;
    }
}

// 방문자 수 증가
async function incrementVisitorCount() {
    try {
        // 현재 카운트 조회
        const currentCount = await getVisitorCount();
        const newCount = currentCount + 1;

        // 카운트 업데이트
        const response = await fetch(`${SUPABASE_URL}/rest/v1/visitor_count?id=eq.1`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                total_count: newCount,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to increment visitor count');
        }

        return newCount;
    } catch (error) {
        console.error('방문자 수 증가 에러:', error);
        return null;
    }
}

// 방문자 수를 화면에 표시 (4자리 포맷)
function displayVisitorCount(count) {
    const countElement = document.getElementById('visitorCount');
    if (countElement) {
        const formattedCount = String(count).padStart(4, '0');
        countElement.textContent = `${formattedCount}명`;
    }
}

// 방문자 카운터 초기화
async function initVisitorCounter() {
    try {
        const visitorId = getVisitorId();
        const todayDate = getTodayDate();

        // 현재 방문자 수 조회 및 표시
        const currentCount = await getVisitorCount();
        displayVisitorCount(currentCount);

        // 오늘 이미 방문했는지 확인
        const alreadyVisited = await hasVisitedToday(visitorId, todayDate);

        if (!alreadyVisited) {
            // 첫 방문이면 방문 기록 및 카운트 증가
            const recorded = await recordVisit(visitorId, todayDate);
            if (recorded) {
                const newCount = await incrementVisitorCount();
                if (newCount !== null) {
                    displayVisitorCount(newCount);
                }
            }
        }
    } catch (error) {
        console.error('방문자 카운터 초기화 에러:', error);
        // 에러 발생 시 기본값 표시
        displayVisitorCount(0);
    }
}

// 페이지 로드 시 방문자 카운터 초기화
document.addEventListener('DOMContentLoaded', () => {
    initVisitorCounter();
});