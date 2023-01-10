import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('Metadata')
export class Metadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  metadata: string;

  @Column({default:true})
  status: boolean;

}
