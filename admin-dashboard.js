// Define the subject order for HSC
const hscSubjectOrder = [
    "Quran Majeed",
    "Al Hadith",
    "Al Fiqh",
    "Arabic",
    "Arabic Literature (Science)",
    "Bangla",
    "English",
    "ICT",
    "Physics",
    "Chemistry",
    "Biology",
    "Higher Math",
    "Islamic History",
    "Balagat O Mantik",
    "Economics",
    "Civics"
];

// Global variables to store event listeners
let uploadFormListener = null;
let subjectFormListener = null;
let classChangeListener = null;
let subjectChangeListener = null;
let logoutListener = null;

// Add these at the top of the file
let initCount = 0;
let authCheckCount = 0;

// Main initialization
function init() {
    initCount++;
    console.log(`Init called ${initCount} times`);
    console.trace('Init call stack'); // This will show where init is being called from
    
    // Remove any existing listeners
    removeAllListeners();
    
    // Add new listeners
    addLogoutListener();
    addUploadFormListener();
    addSubjectFormListener();
    addClassChangeListener();
    addSubjectChangeListener();
    
    // Load initial data
    loadRecentUploads();
    loadSubjects();
    const classSelect = document.getElementById('class');
    if (classSelect) {
        loadSubjectsForClass(classSelect.value || 'HSC');
    }
}

// Remove all existing listeners
function removeAllListeners() {
    if (uploadFormListener) {
        document.getElementById('uploadForm')?.removeEventListener('submit', uploadFormListener);
    }
    if (subjectFormListener) {
        document.getElementById('subjectForm')?.removeEventListener('submit', subjectFormListener);
    }
    if (classChangeListener) {
        document.getElementById('class')?.removeEventListener('change', classChangeListener);
    }
    if (subjectChangeListener) {
        document.getElementById('subject')?.removeEventListener('change', subjectChangeListener);
    }
    if (logoutListener) {
        document.getElementById('logoutBtn')?.removeEventListener('click', logoutListener);
    }
}

// Add logout listener
function addLogoutListener() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutListener = async () => {
            try {
                await firebase.auth().signOut();
                window.location.href = 'admin-login.html';
            } catch (error) {
                console.error('Logout failed:', error);
            }
        };
        logoutBtn.addEventListener('click', logoutListener);
    }
}

// Add upload form listener
function addUploadFormListener() {
    console.log('Adding upload form listener');
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadFormListener = async (e) => {
            e.preventDefault();
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';
            
            try {
                const imageFiles = document.getElementById('questionImages').files;
                const questionData = {
                    class: document.getElementById('class').value,
                    subject: document.getElementById('subject').value,
                    paper: document.getElementById('paper').value ? document.getElementById('paper').value + ' Paper' : null,
                    year: document.getElementById('year').value,
                    board: document.getElementById('board').value.toLowerCase()
                };
                
                await uploadQuestion(questionData, imageFiles);
                showSuccess('Question uploaded successfully!');
                e.target.reset();
                loadRecentUploads();
            } catch (error) {
                showError(error);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Upload Question';
            }
        };
        uploadForm.addEventListener('submit', uploadFormListener);
    }
}

// Add subject form listener
function addSubjectFormListener() {
    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
        subjectFormListener = async (e) => {
            e.preventDefault();
            
            const subjectData = {
                name: document.getElementById('subjectName').value,
                class: document.getElementById('subjectClass').value,
                hasPapers: document.getElementById('hasPapers').value
            };
            
            try {
                await addSubject(subjectData);
                showSuccess('Subject added successfully!');
                e.target.reset();
                loadSubjects();
            } catch (error) {
                showError(error);
            }
        };
        subjectForm.addEventListener('submit', subjectFormListener);
    }
}

// Add class change listener
function addClassChangeListener() {
    const classSelect = document.getElementById('class');
    if (classSelect) {
        classChangeListener = (e) => {
            loadSubjectsForClass(e.target.value);
        };
        classSelect.addEventListener('change', classChangeListener);
    }
}

// Add subject change listener
function addSubjectChangeListener() {
    const subjectSelect = document.getElementById('subject');
    if (subjectSelect) {
        subjectChangeListener = (e) => {
            const paperSelect = document.getElementById('paper');
            if (!paperSelect) return;
            
            const selectedOption = e.target.options[e.target.selectedIndex];
            const hasPapers = selectedOption.getAttribute('data-has-papers') === 'true';
            
            if (hasPapers) {
                paperSelect.removeAttribute('disabled');
            } else {
                paperSelect.value = '';
                paperSelect.setAttribute('disabled', 'disabled');
            }
        };
        subjectSelect.addEventListener('change', subjectChangeListener);
    }
}

// Load recent uploads
async function loadRecentUploads() {
    const recentUploadsDiv = document.getElementById('recentUploads');
    if (!recentUploadsDiv) return;
    
    try {
        const snapshot = await db.collection('questions')
            .orderBy('uploadDate', 'desc')
            .limit(5)
            .get();
            
        recentUploadsDiv.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="mb-3 d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <strong>${data.subject}</strong>
                        <br>
                        ${data.class} - ${data.year} - ${data.board}
                        ${data.paper ? `- ${data.paper} Paper` : ''}
                    </div>
                    <button class="btn btn-danger btn-sm ms-2" 
                            onclick="deleteQuestion('${doc.id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent uploads:', error);
    }
}

// Load and display subjects
async function loadSubjects() {
    const subjectListDiv = document.getElementById('subjectList');
    if (!subjectListDiv) return;
    
    try {
        const subjects = await getAllSubjects();
        
        // Sort subjects
        subjects.sort((a, b) => {
            if (a.class !== b.class) {
                return a.class === 'HSC' ? -1 : 1;
            }
            if (a.class === 'HSC') {
                return hscSubjectOrder.indexOf(a.name) - hscSubjectOrder.indexOf(b.name);
            }
            return a.name.localeCompare(b.name);
        });

        subjectListDiv.innerHTML = subjects.map(subject => `
            <div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${subject.name}</h6>
                        <small class="text-muted">
                            ${subject.class}
                            ${subject.hasPapers ? ' (Has Papers)' : ''}
                        </small>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deleteSubject('${subject.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Load subjects for class
async function loadSubjectsForClass(classValue) {
    const subjectSelect = document.getElementById('subject');
    const paperSelect = document.getElementById('paper');
    if (!subjectSelect || !paperSelect) return;
    
    try {
        const subjects = await db.collection('subjects')
            .where('class', '==', classValue)
            .get();
            
        const subjectsArray = subjects.docs.map(doc => doc.data());
        
        if (classValue === 'HSC') {
            subjectsArray.sort((a, b) => {
                return hscSubjectOrder.indexOf(a.name) - hscSubjectOrder.indexOf(b.name);
            });
        }

        subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
            subjectsArray.map(subject => {
                return `<option value="${subject.name}" 
                        data-has-papers="${subject.hasPapers}">${subject.name}</option>`;
            }).join('');
            
        paperSelect.value = '';
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Check authentication and initialize
firebase.auth().onAuthStateChanged((user) => {
    authCheckCount++;
    console.log(`Auth check called ${authCheckCount} times`);
    console.log('Current user:', user?.email);
    
    if (!user) {
        console.log('No user, redirecting to login');
        window.location.href = 'admin-login.html';
        return;
    }
    console.log('User authenticated, initializing dashboard');
    init();
});