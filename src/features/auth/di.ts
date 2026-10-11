import { AuthRepositoryImpl } from '../../core/infra/repositoriesImpl/AuthRepositoryImpl';
import { LoginUseCase } from '../../core/app/useCases/LoginUseCase';
import { LoginWithGoogleUseCase } from '../../core/app/useCases/LoginWithGoogleUseCase';

// Composition root for Auth feature
const authRepository = new AuthRepositoryImpl();

export const loginUseCase = new LoginUseCase(authRepository);
export const loginWithGoogleUseCase = new LoginWithGoogleUseCase(authRepository);
