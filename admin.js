// 관리자 비밀번호 (실제 사용시 변경하세요)
const ADMIN_PASSWORD = 'vera7499';

// 로컬 스토리지 키
const ADMIN_AUTH_KEY = 'vera_admin_auth';

// Notice Manager using Firebase Firestore
class NoticeManager {
    constructor() {
        this.notices = [];
    }

    async loadNotices() {
        try {
            // Load notices from Firestore
            const snapshot = await noticesCollection.orderBy('timestamp', 'desc').get();
            this.notices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return this.notices;
        } catch (error) {
            console.error('Failed to load notices:', error);
            this.notices = [];
            return this.notices;
        }
    }

    async addNotice(title, content) {
        const notice = {
            title,
            content,
            date: new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\. /g, '. ').replace(/\.$/, '.'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Add to Firestore
            const docRef = await noticesCollection.add(notice);
            const newNotice = {
                id: docRef.id,
                ...notice,
                timestamp: Date.now() // Use local timestamp temporarily
            };

            // Add to local array at the beginning
            this.notices.unshift(newNotice);

            return newNotice;
        } catch (error) {
            console.error('Failed to add notice:', error);
            alert('공지사항 추가 실패: ' + error.message);
            throw error;
        }
    }

    async updateNotice(id, title, content) {
        try {
            // Update in Firestore
            await noticesCollection.doc(id).update({
                title,
                content
            });

            // Update local array
            const index = this.notices.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notices[index] = {
                    ...this.notices[index],
                    title,
                    content
                };
            }

            return true;
        } catch (error) {
            console.error('Failed to update notice:', error);
            alert('공지사항 수정 실패: ' + error.message);
            return false;
        }
    }

    async deleteNotice(id) {
        try {
            // Delete from Firestore
            await noticesCollection.doc(id).delete();

            // Remove from local array
            this.notices = this.notices.filter(n => n.id !== id);

            return true;
        } catch (error) {
            console.error('Failed to delete notice:', error);
            alert('공지사항 삭제 실패: ' + error.message);
            return false;
        }
    }

    getNotices() {
        return this.notices;
    }
}

const noticeManager = new NoticeManager();

// 모달 관리
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 공지사항 표시 (사용자용)
async function displayNotices() {
    // Ensure notices are loaded
    if (noticeManager.getNotices().length === 0) {
        await noticeManager.loadNotices();
    }

    const notices = noticeManager.getNotices();
    const noticeSection = document.getElementById('notices');
    const noticeList = document.getElementById('notice-list');
    const noticeItem = document.getElementById('nav-notice-item');

    if (notices.length === 0) {
        noticeSection.style.display = 'none';
        if (noticeItem) noticeItem.style.display = 'none';
        return;
    }

    noticeSection.style.display = 'block';
    if (noticeItem) noticeItem.style.display = 'block';
    noticeList.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-header">
                <h3 class="notice-title">${notice.title}</h3>
                <span class="notice-date">${notice.date}</span>
            </div>
            <p class="notice-content">${notice.content}</p>
        </div>
    `).join('');
}

// 공지사항 표시 (관리자용)
async function displayAdminNotices() {
    // Ensure notices are loaded
    if (noticeManager.getNotices().length === 0) {
        await noticeManager.loadNotices();
    }

    const notices = noticeManager.getNotices();
    const adminNoticeList = document.getElementById('admin-notice-list');

    if (notices.length === 0) {
        adminNoticeList.innerHTML = '<p class="no-notices">등록된 공지사항이 없습니다.</p>';
        return;
    }

    adminNoticeList.innerHTML = notices.map(notice => `
        <div class="admin-notice-item">
            <div class="admin-notice-header">
                <h4>${notice.title}</h4>
                <span class="notice-date">${notice.date}</span>
            </div>
            <p>${notice.content}</p>
            <div class="admin-notice-actions">
                <button class="btn-edit" onclick="editNotice('${notice.id}')">
                    <i class="fas fa-edit"></i> 수정
                </button>
                <button class="btn-delete" onclick="deleteNotice('${notice.id}')">
                    <i class="fas fa-trash"></i> 삭제
                </button>
            </div>
        </div>
    `).join('');
}

// 관리자 인증 확인
function isAdminAuthenticated() {
    const auth = sessionStorage.getItem(ADMIN_AUTH_KEY);
    return auth === 'true';
}

// 관리자 로그인
document.getElementById('admin-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');

    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
        closeModal('admin-login-modal');
        openModal('admin-panel-modal');
        displayAdminNotices();
        document.getElementById('admin-password').value = '';
        errorMsg.textContent = '';
    } else {
        errorMsg.textContent = '비밀번호가 올바르지 않습니다.';
    }
});

// 관리자 로그아웃
document.getElementById('admin-logout').addEventListener('click', function () {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    closeModal('admin-panel-modal');
    alert('로그아웃되었습니다.');
});

// 관리자 패널 닫기
document.getElementById('admin-close').addEventListener('click', function () {
    closeModal('admin-panel-modal');
});

// 공지사항 등록
document.getElementById('notice-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const title = document.getElementById('notice-title').value;
    const content = document.getElementById('notice-content').value;

    try {
        await noticeManager.addNotice(title, content);
        await displayNotices();
        await displayAdminNotices();

        // 폼 초기화
        document.getElementById('notice-title').value = '';
        document.getElementById('notice-content').value = '';

        alert('공지사항이 등록되었습니다!');
    } catch (error) {
        // Error already shown by NoticeManager
    }
});

// 공지사항 수정
function editNotice(id) {
    const notice = noticeManager.getNotices().find(n => n.id === id);
    if (notice) {
        document.getElementById('edit-notice-id').value = notice.id;
        document.getElementById('edit-notice-title').value = notice.title;
        document.getElementById('edit-notice-content').value = notice.content;
        openModal('edit-notice-modal');
    }
}

// 공지사항 수정 저장
document.getElementById('edit-notice-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('edit-notice-id').value;
    const title = document.getElementById('edit-notice-title').value;
    const content = document.getElementById('edit-notice-content').value;

    if (await noticeManager.updateNotice(id, title, content)) {
        await displayNotices();
        await displayAdminNotices();
        closeModal('edit-notice-modal');
        alert('공지사항이 수정되었습니다!');
    }
});

// 공지사항 삭제
async function deleteNotice(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        if (await noticeManager.deleteNotice(id)) {
            await displayNotices();
            await displayAdminNotices();
            alert('공지사항이 삭제되었습니다!');
        }
    }
}

// 관리자 링크 클릭
document.getElementById('admin-link').addEventListener('click', function (e) {
    e.preventDefault();
    if (isAdminAuthenticated()) {
        openModal('admin-panel-modal');
        displayAdminNotices();
    } else {
        openModal('admin-login-modal');
    }
});

// 모달 닫기 버튼
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function () {
        this.closest('.modal').style.display = 'none';
    });
});

// 모달 외부 클릭시 닫기
window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// 페이지 로드시 공지사항 표시
document.addEventListener('DOMContentLoaded', function () {
    displayNotices();
});
