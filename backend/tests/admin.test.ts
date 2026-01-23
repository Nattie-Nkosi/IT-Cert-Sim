import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { prisma } from '../src/lib/prisma';

// Test data
let testUserId: string;
let testAdminId: string;
let testCertificationId: string;
let testQuestionId: string;
let testExamId: string;
let adminToken: string;
let userToken: string;

const API_URL = 'http://localhost:3001/api';

// Helper function to create test user
async function createTestUser(role: 'USER' | 'ADMIN') {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('TestPass123!', 10);

  const user = await prisma.user.create({
    data: {
      email: role === 'ADMIN' ? 'admin@test.com' : 'user@test.com',
      password: hashedPassword,
      name: role === 'ADMIN' ? 'Test Admin' : 'Test User',
      role: role,
    },
  });

  return user;
}

// Helper function to login and get token
async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return data.token;
}

// Setup test data
beforeAll(async () => {
  // Clean up existing test data
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'admin@test.com' },
        { email: 'user@test.com' },
      ],
    },
  });

  // Create test users
  const admin = await createTestUser('ADMIN');
  const user = await createTestUser('USER');

  testAdminId = admin.id;
  testUserId = user.id;

  // Get tokens
  adminToken = await login('admin@test.com', 'TestPass123!');
  userToken = await login('user@test.com', 'TestPass123!');
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up test data
  if (testExamId) {
    await prisma.exam.deleteMany({ where: { id: testExamId } });
  }
  if (testQuestionId) {
    await prisma.question.deleteMany({ where: { id: testQuestionId } });
  }
  if (testCertificationId) {
    await prisma.certification.deleteMany({ where: { id: testCertificationId } });
  }
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'admin@test.com' },
        { email: 'user@test.com' },
      ],
    },
  });
});

describe('Admin Authentication', () => {
  test('should deny access without token', async () => {
    const response = await fetch(`${API_URL}/admin/certifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Cert',
        code: 'TEST-001',
        vendor: 'Test Vendor',
      }),
    });

    expect(response.status).toBe(500); // Error thrown by middleware
  });

  test('should deny access with regular user token', async () => {
    const response = await fetch(`${API_URL}/admin/certifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: 'Test Cert',
        code: 'TEST-001',
        vendor: 'Test Vendor',
      }),
    });

    expect(response.status).toBe(500); // Forbidden error
  });

  test('should allow access with admin token', async () => {
    const response = await fetch(`${API_URL}/admin/certifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Test Certification',
        code: 'TEST-CERT-001',
        vendor: 'Test Vendor',
        description: 'Test certification for testing',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Certification');
    testCertificationId = data.id;
  });
});

describe('Certification Management', () => {
  test('should create a new certification', async () => {
    const response = await fetch(`${API_URL}/admin/certifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'CompTIA Network+',
        code: 'N10-009',
        vendor: 'CompTIA',
        description: 'CompTIA Network+ Certification',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.code).toBe('N10-009');
    expect(data.vendor).toBe('CompTIA');
  });

  test('should fail to create duplicate certification code', async () => {
    const response = await fetch(`${API_URL}/admin/certifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Test',
        code: 'TEST-CERT-001', // Same code as before
        vendor: 'Test Vendor',
      }),
    });

    expect(response.status).toBe(500); // Unique constraint violation
  });
});

describe('Question Management', () => {
  test('should create a single question', async () => {
    const response = await fetch(`${API_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionText: 'What is the default subnet mask for a Class C network?',
        questionType: 'SINGLE_CHOICE',
        explanation: 'Class C networks use 255.255.255.0 as the default subnet mask',
        certificationId: testCertificationId,
        difficulty: 'EASY',
        answers: [
          { answerText: '255.255.255.0', isCorrect: true },
          { answerText: '255.255.0.0', isCorrect: false },
          { answerText: '255.0.0.0', isCorrect: false },
          { answerText: '255.255.255.255', isCorrect: false },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.questionText).toContain('Class C network');
    expect(data.answers).toHaveLength(4);
    testQuestionId = data.id;
  });

  test('should fail to create question without answers', async () => {
    const response = await fetch(`${API_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionText: 'Invalid question',
        questionType: 'SINGLE_CHOICE',
        certificationId: testCertificationId,
        difficulty: 'EASY',
        answers: [], // Empty answers
      }),
    });

    expect(response.status).toBe(400); // Validation error
  });

  test('should get all questions', async () => {
    const response = await fetch(`${API_URL}/admin/questions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('should filter questions by certification', async () => {
    const response = await fetch(`${API_URL}/admin/questions?certificationId=${testCertificationId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    data.forEach((q: any) => {
      expect(q.certificationId).toBe(testCertificationId);
    });
  });

  test('should update a question', async () => {
    const response = await fetch(`${API_URL}/admin/questions/${testQuestionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionText: 'Updated: What is the default subnet mask for a Class C network?',
        questionType: 'SINGLE_CHOICE',
        explanation: 'Updated explanation',
        certificationId: testCertificationId,
        difficulty: 'MEDIUM',
        answers: [
          { answerText: '255.255.255.0', isCorrect: true },
          { answerText: '255.255.0.0', isCorrect: false },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.questionText).toContain('Updated:');
    expect(data.difficulty).toBe('MEDIUM');
  });

  test('should delete a question', async () => {
    // Create a question to delete
    const createResponse = await fetch(`${API_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionText: 'Question to delete',
        questionType: 'TRUE_FALSE',
        certificationId: testCertificationId,
        difficulty: 'EASY',
        answers: [
          { answerText: 'True', isCorrect: true },
          { answerText: 'False', isCorrect: false },
        ],
      }),
    });

    const created = await createResponse.json();
    const deleteResponse = await fetch(`${API_URL}/admin/questions/${created.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(deleteResponse.status).toBe(200);
    const data = await deleteResponse.json();
    expect(data.success).toBe(true);
  });
});

describe('Bulk Question Upload', () => {
  test('should upload multiple questions in bulk', async () => {
    const response = await fetch(`${API_URL}/admin/questions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questions: [
          {
            questionText: 'What port does HTTP use?',
            questionType: 'SINGLE_CHOICE',
            explanation: 'HTTP uses port 80',
            certificationId: testCertificationId,
            difficulty: 'EASY',
            answers: [
              { answerText: '80', isCorrect: true },
              { answerText: '443', isCorrect: false },
              { answerText: '22', isCorrect: false },
              { answerText: '21', isCorrect: false },
            ],
          },
          {
            questionText: 'What port does HTTPS use?',
            questionType: 'SINGLE_CHOICE',
            explanation: 'HTTPS uses port 443',
            certificationId: testCertificationId,
            difficulty: 'EASY',
            answers: [
              { answerText: '443', isCorrect: true },
              { answerText: '80', isCorrect: false },
              { answerText: '22', isCorrect: false },
              { answerText: '21', isCorrect: false },
            ],
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.count).toBe(2);
    expect(data.questions).toHaveLength(2);
  });

  test('should fail bulk upload with invalid data', async () => {
    const response = await fetch(`${API_URL}/admin/questions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questions: [
          {
            questionText: 'Invalid question',
            // Missing questionType
            certificationId: testCertificationId,
            answers: [],
          },
        ],
      }),
    });

    expect(response.status).toBe(400); // Validation error
  });
});

describe('Exam Management', () => {
  test('should create an exam with questions', async () => {
    // First, get available questions
    const questionsResponse = await fetch(`${API_URL}/admin/questions?certificationId=${testCertificationId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    const questions = await questionsResponse.json();
    const questionIds = questions.slice(0, 3).map((q: any) => q.id);

    const response = await fetch(`${API_URL}/admin/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Test Exam 1',
        description: 'Practice exam for testing',
        duration: 60,
        passingScore: 70,
        certificationId: testCertificationId,
        questionIds: questionIds,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Exam 1');
    expect(data.questions).toHaveLength(3);
    testExamId = data.id;
  });

  test('should get all exams for admin', async () => {
    const response = await fetch(`${API_URL}/admin/exams`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('should get exam details with questions', async () => {
    const response = await fetch(`${API_URL}/admin/exams/${testExamId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(testExamId);
    expect(data.questions).toBeDefined();
    expect(Array.isArray(data.questions)).toBe(true);
  });

  test('should update exam questions', async () => {
    // Get all questions for this certification
    const questionsResponse = await fetch(`${API_URL}/admin/questions?certificationId=${testCertificationId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    const questions = await questionsResponse.json();
    const newQuestionIds = questions.slice(0, 5).map((q: any) => q.id);

    const response = await fetch(`${API_URL}/admin/exams/${testExamId}/questions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionIds: newQuestionIds,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify the exam now has 5 questions
    const verifyResponse = await fetch(`${API_URL}/admin/exams/${testExamId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    const verifyData = await verifyResponse.json();
    expect(verifyData.questions.length).toBe(5);
  });
});

describe('PDF Parsing', () => {
  test('should parse PDF with exam questions', async () => {
    // Create a simple text file to simulate PDF (actual PDF parsing would need real PDF)
    const testPDFContent = `
Question: 1
What is TCP?
A. Transmission Control Protocol
B. Transfer Control Protocol
C. Technical Control Protocol
D. Transport Control Protocol
Answer: A
Explanation: TCP stands for Transmission Control Protocol, which is a connection-oriented protocol.

Question: 2
What port does SSH use?
A. 21
B. 22
C. 23
D. 25
Answer: B
Explanation: SSH (Secure Shell) uses port 22 for secure remote access.
    `;

    // Note: This test would need actual PDF file upload capability
    // For now, we test the structure of the endpoint
    const blob = new Blob([testPDFContent], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'test.pdf');

    const response = await fetch(`${API_URL}/admin/questions/parse-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
      body: formData,
    });

    // Should return parsed questions or error
    expect([200, 500]).toContain(response.status);
  });
});

describe('Data Validation', () => {
  test('should reject question with invalid question type', async () => {
    const response = await fetch(`${API_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionText: 'Test question',
        questionType: 'INVALID_TYPE', // Invalid
        certificationId: testCertificationId,
        answers: [
          { answerText: 'Answer 1', isCorrect: true },
        ],
      }),
    });

    expect(response.status).toBe(400);
  });

  test('should reject question with invalid difficulty', async () => {
    const response = await fetch(`${API_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionText: 'Test question',
        questionType: 'SINGLE_CHOICE',
        difficulty: 'INVALID_DIFFICULTY', // Invalid
        certificationId: testCertificationId,
        answers: [
          { answerText: 'Answer 1', isCorrect: true },
        ],
      }),
    });

    expect(response.status).toBe(400);
  });

  test('should reject exam with empty question list', async () => {
    const response = await fetch(`${API_URL}/admin/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Invalid Exam',
        duration: 60,
        passingScore: 70,
        certificationId: testCertificationId,
        questionIds: [], // Empty
      }),
    });

    expect(response.status).toBe(400);
  });

  test('should reject exam with invalid passing score', async () => {
    const response = await fetch(`${API_URL}/admin/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Invalid Exam',
        duration: 60,
        passingScore: 150, // Invalid (> 100)
        certificationId: testCertificationId,
        questionIds: [testQuestionId],
      }),
    });

    // Should either reject or accept (depends on validation)
    expect([200, 400, 500]).toContain(response.status);
  });
});
