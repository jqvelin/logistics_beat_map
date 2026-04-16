import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailCodeRequestDto } from './dto/email-code-request.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('email-code')
  sendEmailCode(@Body() dto: EmailCodeRequestDto) {
    return this.authService.sendEmailCode(dto);
  }

  @Post('email-code/verify')
  verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto);
  }
}
