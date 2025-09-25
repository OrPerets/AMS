import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateTicketCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
