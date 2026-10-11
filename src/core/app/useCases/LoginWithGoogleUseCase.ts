import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { User } from '../../domain/entities/User';

export class LoginWithGoogleUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(idToken?: string): Promise<User> {
    if (!idToken) {
      throw new Error('Error: Did not receive token from Google');
    }

    const user = await this.authRepository.loginWithGoogle(idToken);
    if (!user.token) {
      throw new Error('Authentication token not received from server');
    }

    return user;
  }
}
