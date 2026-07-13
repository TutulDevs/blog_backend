import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/logs')
  @Header('Content-Type', 'text/html')
  getLogs(): string {
    return this.appService.getLogs();
  }
}
