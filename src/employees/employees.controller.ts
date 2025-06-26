import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  getAll() {
    return this.employeesService.findAll();
  }

  @Get('list')
  @ApiOperation({ summary: 'Get employees by list of IDs' })
  @ApiQuery({
    name: 'ids',
    description: 'Comma separated list of employee IDs',
    required: false,
    example: 'id1,id2,id3',
  })
  getByIds(@Query('ids') idsParam?: string) {
    if (!idsParam) return [];
    const ids = idsParam.split(',');
    return this.employeesService.findByIds(ids);
  }
}
