import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlaygroundService } from './playground.service';
import { ExecuteRequestDto } from './dto/execute-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('API Playground & Testing Proxy')
@Controller('playground')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute outbound HTTP test request through SSRF-hardened proxy' })
  @ApiResponse({ status: 200, description: 'Request executed successfully' })
  async execute(
    @CurrentUser('id') userId: string,
    @Body() dto: ExecuteRequestDto,
  ) {
    const result = await this.playgroundService.execute(userId, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'List recent API test executions for authenticated user' })
  async getHistory(@CurrentUser('id') userId: string) {
    const history = await this.playgroundService.getHistory(userId);
    return {
      success: true,
      data: history,
    };
  }
}
