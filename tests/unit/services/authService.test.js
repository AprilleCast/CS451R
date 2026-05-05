jest.mock('../../../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/config/emailService');
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const authService = require('../../../src/services/authService');
const userRepository = require('../../../src/repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../../../src/config/emailService');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

describe('authService.register', () => {
  it('throws 409 if email already registered', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const err = await authService.register({ name: 'Alice', email: 'a@b.com', password: 'pass' }).catch(e => e);

    expect(err.statusCode).toBe(409);
    expect(err.message).toMatch(/already registered/i);
  });

  it('creates user and returns token and user on success', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(42);
    bcrypt.hash.mockResolvedValue('hashed-pass');
    jwt.sign.mockReturnValue('signed-token');

    const result = await authService.register({ name: 'Alice', email: 'a@b.com', password: 'pass' });

    expect(userRepository.create).toHaveBeenCalledWith({ name: 'Alice', email: 'a@b.com', hashedPassword: 'hashed-pass' });
    expect(result.token).toBe('signed-token');
    expect(result.user).toEqual({ id: 42, name: 'Alice', email: 'a@b.com' });
  });
});

describe('authService.login', () => {
  it('throws 401 if user not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    const err = await authService.login({ email: 'x@x.com', password: 'pass' }).catch(e => e);

    expect(err.statusCode).toBe(401);
  });

  it('throws 401 if password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 1, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);

    const err = await authService.login({ email: 'x@x.com', password: 'wrong' }).catch(e => e);

    expect(err.statusCode).toBe(401);
  });

  it('returns token and user on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 7, name: 'Bob', email: 'b@b.com', password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('valid-token');

    const result = await authService.login({ email: 'b@b.com', password: 'correct' });

    expect(result.token).toBe('valid-token');
    expect(result.user).toEqual({ id: 7, name: 'Bob', email: 'b@b.com' });
  });
});

describe('authService.forgotPassword', () => {
  it('returns without error if email not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.forgotPassword({ email: 'ghost@x.com' })).resolves.toBeUndefined();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('saves reset token and sends email if user found', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 3, email: 'c@c.com' });
    userRepository.saveResetToken.mockResolvedValue();
    sendPasswordResetEmail.mockResolvedValue();

    await authService.forgotPassword({ email: 'c@c.com' });

    expect(userRepository.saveResetToken).toHaveBeenCalledWith(3, expect.any(String));
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('c@c.com', expect.stringContaining('reset-password'));
  });
});

describe('authService.resetPassword', () => {
  it('throws 400 if reset token is invalid', async () => {
    userRepository.findResetToken.mockResolvedValue(null);

    const err = await authService.resetPassword({ token: 'bad-token', newPassword: 'new' }).catch(e => e);

    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/invalid or expired/i);
  });

  it('updates password and deletes token on success', async () => {
    userRepository.findResetToken.mockResolvedValue({ user_id: 5 });
    bcrypt.hash.mockResolvedValue('new-hashed');
    userRepository.updatePassword.mockResolvedValue();
    userRepository.deleteResetToken.mockResolvedValue();

    await authService.resetPassword({ token: 'good-token', newPassword: 'newpass' });

    expect(userRepository.updatePassword).toHaveBeenCalledWith(5, 'new-hashed');
    expect(userRepository.deleteResetToken).toHaveBeenCalledWith('good-token');
  });
});
