const fs = require('fs');
const path = require('path');

const progressPath = path.join(__dirname, '../data/user-progress.json');

const progress = [
    {
        userId: 'default-user',
        courses: [
            {
                courseId: 'course-fullstack',
                completedLevels: [1],
                currentLevel: 2,
                totalPoints: 100
            },
            {
                courseId: 'fullstack', // Backup in case of ID mismatch
                completedLevels: [1],
                currentLevel: 2,
                totalPoints: 100
            }
        ],
        totalPoints: 100,
        achievements: []
    },
    {
        userId: 'user-admin-1',
        courses: [
            {
                courseId: 'course-fullstack',
                completedLevels: [1],
                currentLevel: 2,
                totalPoints: 100
            },
            {
                courseId: 'fullstack',
                completedLevels: [1],
                currentLevel: 2,
                totalPoints: 100
            }
        ],
        totalPoints: 100,
        achievements: []
    }
];

try {
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
    console.log('✅ Restored progress to user-progress.json');
    console.log('Unlock Level 2 for course-fullstack and fullstack');
} catch (error) {
    console.error('❌ Failed to write progress:', error);
}
