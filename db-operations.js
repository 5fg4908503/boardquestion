// Get questions based on filters
window.getQuestions = async function(filters) {
    let query = db.collection('questions');
    
    if (filters.class) query = query.where('class', '==', filters.class);
    if (filters.subject) query = query.where('subject', '==', filters.subject);
    if (filters.paper) query = query.where('paper', '==', filters.paper);
    if (filters.year) query = query.where('year', '==', filters.year);
    if (filters.board) query = query.where('board', '==', filters.board);
    
    try {
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting questions:", error);
        return [];
    }
}

// Upload a new question
window.uploadQuestion = async function(questionData, imageFiles) {
    try {
        // Validate input
        if (!questionData.subject || !questionData.class || !questionData.year || !questionData.board) {
            throw new Error('All fields are required');
        }

        // Validate total file size (20MB total limit)
        const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB
        let totalSize = 0;
        for (let file of imageFiles) {
            totalSize += file.size;
        }
        if (totalSize > MAX_TOTAL_SIZE) {
            throw new Error('Total size of all images cannot exceed 20MB');
        }

        // Process images in chunks
        const processImage = async (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        const images = [];
        for (let file of imageFiles) {
            const base64 = await processImage(file);
            images.push(base64);
        }

        // Save question data
        const questionRef = await db.collection('questions').add({
            ...questionData,
            images: images,
            uploadDate: firebase.firestore.FieldValue.serverTimestamp()
        });

        return questionRef.id;
    } catch (error) {
        console.error('Error uploading question:', error);
        throw error;
    }
}

// Add new subject
window.addSubject = async function(subjectData) {
    try {
        // Additional validation
        if (!/^[a-zA-Z\s()]+$/.test(subjectData.name)) {
            throw new Error('Subject name can only contain letters, spaces, and parentheses');
        }
        
        // Check for duplicate subject names
        const existingSubjects = await db.collection('subjects')
            .where('name', '==', subjectData.name)
            .where('class', '==', subjectData.class)
            .get();
            
        if (!existingSubjects.empty) {
            throw new Error('Subject already exists for this class');
        }
        
        // Validate input
        if (!subjectData.name || !subjectData.class) {
            throw new Error('Subject name and class are required');
        }
        
        const subjectId = `${subjectData.name.toLowerCase().replace(/\s+/g, '_')}_${subjectData.class.toLowerCase()}`;
        
        // Check if subject already exists
        const existingDoc = await db.collection('subjects').doc(subjectId).get();
        if (existingDoc.exists) {
            throw new Error('Subject already exists');
        }
        
        // Add papers array if subject has papers
        if (subjectData.hasPapers === 'true') {
            subjectData.papers = ['1st', '2nd'];
        } else {
            subjectData.papers = [];
        }

        // Convert hasPapers to boolean
        subjectData.hasPapers = subjectData.hasPapers === 'true';
        
        // Set default group to HSC
        subjectData.group = 'HSC';

        await db.collection('subjects').doc(subjectId).set(subjectData);
        return subjectId;
    } catch (error) {
        console.error('Error adding subject:', error);
        throw error;
    }
}

// Get all subjects
window.getAllSubjects = async function() {
    try {
        const snapshot = await db.collection('subjects').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting subjects:", error);
        return [];
    }
}

// Delete subject
window.deleteSubject = async function(subjectId) {
    try {
        await db.collection('subjects').doc(subjectId).delete();
    } catch (error) {
        console.error("Error deleting subject:", error);
        throw error;
    }
}

// Get subjects based on class and group
window.getSubjects = async function(classLevel, group = null) {
    let query = db.collection('subjects')
        .where('class', '==', classLevel);
    
    if (group) {
        query = query.where('group', '==', group);
    }
    
    try {
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting subjects:", error);
        return [];
    }
}

// Get questions for a specific subject
window.getSubjectQuestions = async function(classLevel, subject, paper = null) {
    let query = db.collection('questions')
        .where('class', '==', classLevel)
        .where('subject', '==', subject);
    
    if (paper) {
        query = query.where('paper', '==', paper);
    }
    
    try {
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting questions:", error);
        return [];
    }
}

// Delete a question
window.deleteQuestion = async function(questionId) {
    try {
        // Ask for confirmation
        if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) {
            return;
        }
        
        // Delete the question
        await db.collection('questions').doc(questionId).delete();
        
        // Show success message
        showSuccess('Question deleted successfully');
        
        // Refresh the recent uploads list
        loadRecentUploads();
    } catch (error) {
        console.error('Error deleting question:', error);
        showError(error);
    }
} 