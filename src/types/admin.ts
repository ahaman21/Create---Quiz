export interface AdminUser {
    id: string;
    email: string;
    role: 'admin' | 'superadmin';
    createdAt: Date;
    lastLogin: Date;
}

export interface AdminAction {
    id: string;
    adminId: string;
    action: string;
    details: any;
    timestamp: Date;
}

export interface AdminStats {
    totalUsers: number;
    totalQuizzes: number;
    totalQuestions: number;
    averageScore: number;
    usersByDate: {
        date: string;
        count: number;
    }[];
    quizzesByDate: {
        date: string;
        count: number;
    }[];
}
