import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { User } from '../../domain/entities/User';

export class LoginUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(username: string, password: string): Promise<User> {
    if (!username || username.trim() === '') {
      throw new Error('Please enter True Name (username)');
    }
    if (username.length < 3) {
      throw new Error('True Name must contain at least 3 characters');
    }
    if (!password) {
      throw new Error('Please enter Secret Word (password)');
    }
    if (password.length < 4) {
      throw new Error('Secret Word must contain at least 4 characters');
    }

    return await this.authRepository.login(username, password);
  }
}
