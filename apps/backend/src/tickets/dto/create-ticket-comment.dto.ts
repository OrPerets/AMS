import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTicketCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
