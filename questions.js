// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const urlParams = {
        subject: params.get('subject'),
        paper: params.get('paper'),
        class: 'HSC'
    };
    console.log('URL Parameters:', urlParams);
    return urlParams;
}

// Load questions for the subject
async function loadQuestions(filters = {}) {
    const params = getUrlParams();
    console.log('Loading questions with params:', params);
    const subjectName = document.getElementById('subjectName');
    const paperNumber = document.getElementById('paperNumber');
    const questionsContainer = document.querySelector('.col-md-9');
    
    // Show loading state
    questionsContainer.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading questions...</p>
            <small class="text-muted">This might take a moment while indexes are building</small>
        </div>
    `;
    
    // Update page header
    if (subjectName) subjectName.textContent = params.subject;
    if (paperNumber) paperNumber.textContent = params.paper ? `${params.paper} Paper` : '';
    
    try {
        // Get questions from database
        let query = db.collection('questions')
            .where('class', '==', params.class)
            .where('subject', '==', params.subject);
            
        console.log('Initial query params:', {
            class: params.class,
            subject: params.subject,
            paper: params.paper
        });
            
        // Only add paper filter if paper parameter exists
        if (params.paper) {
            const paperValue = params.paper.endsWith(' Paper') ? params.paper : params.paper + ' Paper';
            query = query.where('paper', '==', paperValue);
            console.log('Query with paper filter:', {
                class: params.class,
                subject: params.subject,
                paper: paperValue
            });
        }
        
        // Apply filters
        if (filters.year) {
            query = query.where('year', '==', filters.year);
        }
        if (filters.board) {
            query = query.where('board', '==', filters.board);
        }
        
        let questions;
        try {
            // Add ordering
            query = query.orderBy('year', 'desc');
            questions = await query.get();
            console.log('Found questions:', questions.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
            console.log('Query was empty:', questions.empty);
        } catch (indexError) {
            console.log('Index still building, getting unordered results');
            // Try without ordering if index is not ready
            questions = await query.get();
            console.log('Found questions (unordered):', questions.docs.map(doc => doc.data()));
        }
        
        if (!questions.empty) {
            questionsContainer.innerHTML = questions.docs.map(doc => {
                const data = doc.data();
                return `
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${data.year} - ${data.board} Board</h5>
                            <button class="btn btn-primary btn-sm" onclick="downloadImages('${doc.id}')">Download Images</button>
                        </div>
                        <div class="card-body">
                            <div class="question-images">
                                <div class="row g-3">
                                    ${data.images.map((image, index) => `
                                        <div class="col-md-6">
                                            <a href="data:image/jpeg;base64,${image}"
                                               data-fancybox="gallery-${doc.id}"
                                               data-caption="Question Part ${index + 1}">
                                                <img src="data:image/jpeg;base64,${image}" 
                                                     alt="Question Part ${index + 1}" 
                                                     class="img-fluid rounded shadow-sm w-100">
                                            </a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Initialize Fancybox
            Fancybox.bind("[data-fancybox]", {
                // Custom options
                Carousel: {
                    infinite: false,
                },
                Toolbar: {
                    display: {
                        left: ["infobar"],
                        middle: [
                            "zoomIn",
                            "zoomOut",
                            "toggle1to1",
                            "rotateCCW",
                            "rotateCW",
                            "flipX",
                            "flipY",
                        ],
                        right: ["slideshow", "thumbs", "close"],
                    },
                },
                Keyboard: {
                    Escape: "close",
                    Delete: "close",
                    Backspace: "close",
                    PageUp: "next",
                    PageDown: "prev",
                    ArrowUp: "prev",
                    ArrowDown: "next",
                    ArrowRight: "next",
                    ArrowLeft: "prev",
                },
                Gesture: {
                    drag: true,
                    touch: true,
                    pinch: true,
                },
                Thumbs: {
                    autoStart: true,
                    type: "classic",
                },
            });
        } else {
            questionsContainer.innerHTML = `
                <div class="alert alert-info">
                    No questions available for ${params.subject} ${params.paper ? params.paper + ' Paper' : ''} yet.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        showError(error);
    }
}

// Download images function
async function downloadImages(questionId) {
    try {
        const doc = await db.collection('questions').doc(questionId).get();
        const data = doc.data();
        
        // Create zip file
        const zip = new JSZip();
        data.images.forEach((base64Image, index) => {
            zip.file(`question_${index + 1}.jpg`, base64Image, {base64: true});
        });
        
        // Generate and download zip
        const content = await zip.generateAsync({type: "blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${data.subject}_${data.year}_${data.board}.zip`;
        link.click();
    } catch (error) {
        console.error('Error downloading images:', error);
        showError(error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load initial questions
    loadQuestions();
    
    // Set up filter handlers
    const filterYear = document.getElementById('filterYear');
    const filterBoard = document.getElementById('boardFilter');
    const applyFilters = document.querySelector('.btn-primary.w-100');
    
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            const year = filterYear?.value;
            const board = filterBoard?.value;
            loadQuestions({ year, board });
        });
    }
}); 