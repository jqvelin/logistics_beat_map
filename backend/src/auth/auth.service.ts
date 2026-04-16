import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'node:crypto';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { EmailCodeRequestDto } from './dto/email-code-request.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';

const EMAIL_CODE_TTL_MINUTES = 15;
const EMAIL_CODE_SUCCESS_MESSAGE =
  'Если email указан верно, мы отправили код для входа.';
const DEFAULT_RESEND_FROM_EMAIL = 'Logistics Beat Map <onboarding@resend.dev>';

type AuthUser = {
  id: string;
  email: string;
  password: string | null;
  xp: number;
  level: number;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  private readonly resend: Resend;
  private readonly resendFromEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    this.resend = new Resend(resendApiKey);
    this.resendFromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_RESEND_FROM_EMAIL;
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });

    if (!user?.password) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.buildAuthResponse(user);
  }

  async sendEmailCode(dto: EmailCodeRequestDto) {
    const email = this.normalizeEmail(dto.email);
    const code = this.generateEmailCode();
    const codeHash = this.hashEmailCode(email, code);
    const expiresAt = new Date(Date.now() + EMAIL_CODE_TTL_MINUTES * 60 * 1000);

    await this.prisma.emailLoginCode.deleteMany({
      where: {
        OR: [{ email }, { expiresAt: { lte: new Date() } }],
      },
    });

    await this.prisma.emailLoginCode.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    });

    const { error } = await this.resend.emails.send({
      from: this.resendFromEmail,
      to: [email],
      subject: 'Код для входа в Logistics Beat Map',
      text: [
        'Введите одноразовый код в приложении Logistics Beat Map.',
        '',
        `Код: ${code}`,
        `Код действует ${EMAIL_CODE_TTL_MINUTES} минут.`,
      ].join('\n'),
      html: [
        '<p>Введите одноразовый код в <strong>Logistics Beat Map</strong>.</p>',
        `<p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${code}</p>`,
        `<p>Код действует ${EMAIL_CODE_TTL_MINUTES} минут.</p>`,
      ].join(''),
    });

    if (error) {
      await this.prisma.emailLoginCode.deleteMany({
        where: { codeHash },
      });
      throw new InternalServerErrorException('Не удалось отправить код для входа');
    }

    return { message: EMAIL_CODE_SUCCESS_MESSAGE };
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto) {
    const email = this.normalizeEmail(dto.email);
    const codeHash = this.hashEmailCode(email, dto.code);
    const now = new Date();
    const emailLoginCode = await this.prisma.emailLoginCode.findFirst({
      where: {
        email,
        codeHash,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (
      !emailLoginCode ||
      emailLoginCode.consumedAt ||
      emailLoginCode.expiresAt <= now
    ) {
      throw new BadRequestException('Неверный код или срок действия истек');
    }

    const consumeResult = await this.prisma.emailLoginCode.updateMany({
      where: {
        id: emailLoginCode.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        consumedAt: now,
      },
    });

    if (consumeResult.count !== 1) {
      throw new BadRequestException('Неверный код или срок действия истек');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          password: null,
        },
      });
    }

    return this.buildAuthResponse(user);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateEmailCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashEmailCode(email: string, code: string) {
    return createHash('sha256').update(`${email}:${code}`).digest('hex');
  }

  private async buildAuthResponse(user: AuthUser) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
