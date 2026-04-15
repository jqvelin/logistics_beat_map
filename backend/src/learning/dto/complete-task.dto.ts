import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CompleteTaskDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  selectedOptionIndex?: number;
}
